/* @flow */

import {
  warn,
  remove,
  isObject,
  parsePath,
  _Set as Set,
  handleError,
  invokeWithErrorHandling,
  noop
} from '../util/index'

import { traverse } from './traverse'
import { queueWatcher } from './scheduler'
import Dep, { pushTarget, popTarget } from './dep'

import type { SimpleSet } from '../util/index'

let uid = 0

/**
 * A watcher parses an expression, collects dependencies,
 * and fires callback when the expression value changes.
 * This is used for both the $watch() api and directives.
 */
// 订阅者
/**
 * 一个组件一个 watcher (渲染 watcher) 或者一个表达式一个 watcher （用户 watcher）
 * 当数据更新时 watcher 会触发，访问 this.computedProperty 时也会触发 watcher
*/
export default class Watcher {
  vm: Component;
  expression: string;
  cb: Function;
  id: number;
  deep: boolean;
  user: boolean;
  lazy: boolean;
  sync: boolean;
  dirty: boolean;
  active: boolean;
  deps: Array<Dep>;
  newDeps: Array<Dep>;
  depIds: SimpleSet;
  newDepIds: SimpleSet;
  before: ?Function;
  getter: Function;
  value: any;

  constructor (
    // Vue 实例化对象
    vm: Component,
    // 要监听的数据，可谓为字符串：要观察的数据路径；或函数结果返回要观察的数据
    expOrFn: string | Function,
    // 回调函数，当监听的数据发生变化时调用
    cb: Function,
    // 配置项
    options?: ?Object,
    // true：创建的 Watcher 是渲染 Watcher
    isRenderWatcher?: boolean
  ) {
    this.vm = vm
    // 渲染 Watcher
    if (isRenderWatcher) {
      vm._watcher = this
    }
    // _watchers 是一个 Watcher 的集合，缓存 Watcher
    vm._watchers.push(this)
    // options
    if (options) {
      this.deep = !!options.deep
      this.user = !!options.user
      this.lazy = !!options.lazy
      this.sync = !!options.sync
      this.before = options.before
    } else {
      this.deep = this.user = this.lazy = this.sync = false
    }
    this.cb = cb
    this.id = ++uid // uid for batching
    this.active = true
    this.dirty = this.lazy // for lazy watchers
    // 表示 Watcher 持有的 Dep 的数组集合，Dep 专门收集并管理订阅者
    this.deps = []
    this.newDeps = []
    // 表示 this.deps 和 this.newDeps 中 Dep 的标识符 id 的 Set 集合
    this.depIds = new Set()
    this.newDepIds = new Set()
    this.expression = process.env.NODE_ENV !== 'production'
      ? expOrFn.toString()
      : ''
    // parse expression for getter
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn
    } else {
      /**
       * this.getter = () => { return this.xxx }
       * 在 this.get 中执行 this.getter 时触发依赖收集
       * 待后续 this.xxx 更新时会触发响应
      */
      // 传递 key 进来，this.key， 传递进来可能是个字符串，转换成函数
      this.getter = parsePath(expOrFn)
      if (!this.getter) {
        this.getter = noop
        process.env.NODE_ENV !== 'production' && warn(
          `Failed watching path: "${expOrFn}" ` +
          'Watcher only accepts simple dot-delimited paths. ' +
          'For full control, use a function instead.',
          vm
        )
      }
    }
    this.value = this.lazy
      ? undefined
      : this.get()
  }

  /**
   * Evaluate the getter, and re-collect dependencies.
   */
  // 为什么要重新收集依赖？
  // 因为触发更新说明有响应式数据被更新啦，但是被更新的数据虽然已经经过 observe 观察了，但是却没有依赖收集
  // 在更新页面时，会重新执行一次 render 函数
  // 触发 updateComputed 的执行，进行组件更新，进入 patch 阶段
  // 更新组件时先执行 render 生成 VNode，期间触发读取操作，进行依赖收集
  get () {
    // 什么情况 执行更新
    // 对新值进行依赖收集
    // Dep.target = this
    pushTarget(this)
    // value 为回调函数执行的结果
    let value
    const vm = this.vm
    try {
      // 执行实例化 watcher 是传递进来的第二个参数：
      // 有可能是一个函数，比如 实例化渲染 watcher 时传递的 updateComputed 函数
      // 用户 watcher，可能传递的是一个 key，也可能是读取 this.key 的函数
      // 触发读取操作,被 setter 拦截,进行依赖收集
      value = this.getter.call(vm, vm)
    } catch (e) {
      if (this.user) {
        handleError(e, vm, `getter for watcher "${this.expression}"`)
      } else {
        throw e
      }
    } finally {
      // "touch" every property so they are all tracked as
      // dependencies for deep watching
      // 深度监听
      if (this.deep) {
        traverse(value)
      }
      // 关闭 Dep.target，Dep.target = null
      popTarget()
      this.cleanupDeps()
    }
    return value
  }

  /**
   * Add a dependency to this directive.
   */
  // 将 dep 放到 watcher 中
  addDep (dep: Dep) {
    const id = dep.id
    // 判重，已经收集则跳过
    if (!this.newDepIds.has(id)) {
      // 缓存 dep.id，用于判重
      this.newDepIds.add(id)
      // 添加 dep
      this.newDeps.push(dep)
      // 避免在 dep 中重复添加 watcher，this.depIds 的设置在 cleanupDeps 方法中
      if (!this.depIds.has(id)) {
        // 将 watcher 自己放到 dep 中， 来了个双向收集
        dep.addSub(this)
      }
    }
  }

  /**
   * Clean up for dependency collection.
   * 移除无用的发布者，通知发布者移除订阅者
   */
  cleanupDeps () {
    let i = this.deps.length
    while (i--) {
      const dep = this.deps[i]
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this)
      }
    }
    let tmp = this.depIds
    this.depIds = this.newDepIds
    this.newDepIds = tmp
    this.newDepIds.clear()
    tmp = this.deps
    this.deps = this.newDeps
    this.newDeps = tmp
    this.newDeps.length = 0
  }

  /**
   * Subscriber interface.
   * Will be called when a dependency changes.
   */
  // 根据 watcher 配置项，决定下一步怎么走，一般是 queueWatcher
  update () {
    /* istanbul ignore else */
    if (this.lazy) {
      // 赖执行时走到这，比如 computed
      // 将 dirty 置为 true，在组件更新之后，当响应式数据再次被更新时，执行 computed getter
      // 重新执行 computed 回调函数，计算新值，然后缓存到 watcher.value
      this.dirty = true
    } else if (this.sync) {
      // 同步执行
      // 比如： this.$watch() 或者 watch 选项时，传递一个 sync 配置，比如 { sync: true }
      // 当为 true 时，数据更新该 watcher 就不走异步更新队列，直接执行 this.run 方法更新
      // 这个属性在官方文档中没有出现
      this.run()
    } else {
      // 将当前 watcher 放入 watcher 队列，一般会走这
      queueWatcher(this)
    }
  }

  /**
   * Scheduler job interface.
   * Will be called by the scheduler.
   */
  /**
   *  由 刷新队列函数 flushSchedulerQueue 调用，完成如下几件事：
   *   1、执行实例化 watcher 传递的第二个参数，updateComponent 或者 获取 this.xx 的一个函数(parsePath 返回的函数)
   *   2、更新旧值为新值
   *   3、执行实例化 watcher 时传递的第三个参数，比如用户 watcher 的回调函数
  */
  run () {
    // active：实例对象来判断订阅者是否被销毁，默认为 true；销毁时 置为 false
    if (this.active) {
      // 执行 get
      const value = this.get()
      if (
        value !== this.value ||
        // Deep watchers and watchers on Object/Arrays should fire even
        // when the value is the same, because the value may
        // have mutated.
        isObject(value) ||
        this.deep
      ) {
        // set new value
        // 更新旧值为新增
        const oldValue = this.value
        this.value = value
        if (this.user) {
          // 用户 watcher，再执行一下 watch 回调
          const info = `callback for watcher "${this.expression}"`
          invokeWithErrorHandling(this.cb, this.vm, [value, oldValue], this.vm, info)
        } else {
          // 渲染 watcher，this.cb = noop， 一个空函数
          this.cb.call(this.vm, value, oldValue)
        }
      }
    }
  }

  /**
   * Evaluate the value of the watcher.
   * This only gets called for lazy watchers.
   */
  /**
   * 懒执行 watcher 会调用该方法
   *  比如：computed，在获取 vm.computedProperty 的值时会调用该方法
   * 执行 this.get，即 watcher 的回调函数，得到返回值
   * this.dirty 被置为 false，页面在本次渲染中只会一次 computed.key 的回调函数
   *  computed 和 methods 区别之一： computed 有缓存的原理
   * 页面更新之后 this.dirty 被重新置为 true，在 this.update 方法中完成
  */
  evaluate () {
    this.value = this.get()
    this.dirty = false
  }

  /**
   * Depend on all deps collected by this watcher.
   */
  depend () {
    let i = this.deps.length
    while (i--) {
      this.deps[i].depend()
    }
  }

  /**
   * Remove self from all dependencies' subscriber list.
   */
  /**
   * 1：从全局 Watcher 集合 this.vm._watchers 中移除订阅者
   * 2：去除订阅者订阅的发布者中移除该订阅者
  */
  teardown () {
    if (this.active) {
      // remove self from vm's watcher list
      // this is a somewhat expensive operation so we skip it
      // if the vm is being destroyed.
      // _isBeingDestroyed 是 Vue 实例是否被销毁的标志；true： 已销毁
      if (!this.vm._isBeingDestroyed) {
        // 从 _watchers 删除 指定的 Watcher
        remove(this.vm._watchers, this)
      }
      let i = this.deps.length
      while (i--) {
        this.deps[i].removeSub(this)
      }
      this.active = false
    }
  }
}
