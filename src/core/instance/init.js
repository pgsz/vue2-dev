/* @flow */

import config from '../config'
import { initProxy } from './proxy'
import { initState } from './state'
import { initRender } from './render'
import { initEvents } from './events'
import { mark, measure } from '../util/perf'
import { initLifecycle, callHook } from './lifecycle'
import { initProvide, initInjections } from './inject'
import { extend, mergeOptions, formatComponentName } from '../util/index'

let uid = 0

export function initMixin (Vue: Class<Component>) {
  // 负责 Vue 的初始化过程
  Vue.prototype._init = function (options?: Object) {
    //  Vue 实例
    const vm: Component = this
    // a uid
    // 每个 Vue 实例都有一个 _uid，并且依次递增
    vm._uid = uid++

    // a flag to avoid this being observed
    vm._isVue = true
    // 处理组件配置项
    // merge options
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      /**
      * 每个子组件初始化，做性能优化处理
      * 将组件配置对象上的一些深层次属性放到 vm.$options 选项中,减少原型链的动态查找，以提高代码的执行效率
      */
      initInternalComponent(vm, options)
    } else {
      // 根组件走这里  选项合并，将全局配置选项合并到根组件的局部配置上
      // 组件选项合并，发生在三个地方：
     /**
      *  1. Vue.component(CompName, Comp) 做了选项合并，
      * 合并 Vue 内置的全局组件（keep-alive、transition、transition-group）和用户自己注册的全局组件，最终都会合并到 全局的 components 选项中 --- 全局 API
      * 2. 子组件内部： { components: { xxx }}, 局部注册，执行编译器生成的 render 函数做了合并，会合并全局配置项到组件局部配置项上 --- 编译器
      * 3. 这里的根组件情况
      */
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
    }
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      // 代理处理，将 vm 实例上的属性代理到 vm._renderProxy
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm

    // 重点： 核心

    // 初始化组件实例关系属性，比如 $parent,$children,$root,$refs 等
    initLifecycle(vm)
    // 初始化自定义事件
    // 组件上事件的监听其实是子组件自己在监听， 谁触发谁监听，事件的派发和监听者都是子组件本身
    initEvents(vm)
    // 初始化插槽，获取 this.$slots，定义 this._c ，即 createdElement 方法，平时使用的 h 函数
    initRender(vm)
    // 执行 beforeCreated 生命周期函数
    callHook(vm, 'beforeCreate')
    // 初始化 inject 选项：得到 result[key] = val 形式的配置项，并做响应式处理
    initInjections(vm) // resolve injections before data/props
    // 响应式原理的核心，处理 props、methods、computed、data、watch 等选项
    initState(vm)
    // 处理 provide 选项
    // 总结 provide、inject 的实现原理 
    // inject 主动去祖代组件 provide 中找数据，并不是 provide 注入，inject 使用
    initProvide(vm) // resolve provide after data/props
    // 调用 created 生命周期函数
    callHook(vm, 'created')

    // 如果存在 el 选项，自动执行 $mount  开启模板编译和挂载阶段
    // 如果没有传递 el 选项，需要手动执行 vm.$mount 方法，开启模板编译和挂载阶段
    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
}

// 性能优化 打平配置项上的属性，减少运行时原型链的查找，提高执行效率
export function initInternalComponent (vm: Component, options: InternalComponentOptions) {
  // 基于 构造函数 上的配置对象创建 vm.$options
  const opts = vm.$options = Object.create(vm.constructor.options)
  // doing this because it's faster than dynamic enumeration.
  // 这样做是因为比动态枚举更快
  const parentVnode = options._parentVnode
  opts.parent = options.parent
  opts._parentVnode = parentVnode

  // 避免原型链的动态查找
  // 将配置对象的属性取出来赋值到 $options
  const vnodeComponentOptions = parentVnode.componentOptions
  opts.propsData = vnodeComponentOptions.propsData
  opts._parentListeners = vnodeComponentOptions.listeners
  opts._renderChildren = vnodeComponentOptions.children
  opts._componentTag = vnodeComponentOptions.tag

  // 有 render 函数，将其赋值到 vm.$options
  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}

// 从组件构造函数上解析配置项 options，并合并基类选项
export function resolveConstructorOptions (Ctor: Class<Component>) {
  // 从实例函数上获取选项
  let options = Ctor.options
  if (Ctor.super) {
    // 存在基类，递归解析基类构造函数的选项
    const superOptions = resolveConstructorOptions(Ctor.super)
    // 缓存
    const cachedSuperOptions = Ctor.superOptions
    if (superOptions !== cachedSuperOptions) {
      // 说明基类的配置项发生了改变，需要重新设置
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions
      // check if there are any late-modified/attached options (#4976)
      // 找到更改选项
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options
      if (modifiedOptions) {
        // 如果存在被修改或增加的选项，则合并两个选项
        extend(Ctor.extendOptions, modifiedOptions)
      }
      // 选项合并，将新的选项赋值给 options
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}

// 解析构造函数选项中后续被修改或增加的选项
function resolveModifiedOptions (Ctor: Class<Component>): ?Object {
  let modified
  // 构造函数选项
  const latest = Ctor.options
  // 密封的构造函数选项，备份
  const sealed = Ctor.sealedOptions
  // 对比两个选项，记录不一致的选项
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {}
      modified[key] = latest[key]
    }
  }
  return modified
}
