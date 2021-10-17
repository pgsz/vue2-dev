/* @flow */

import config from '../config'
import Watcher from '../observer/watcher'
import Dep, { pushTarget, popTarget } from '../observer/dep'
import { isUpdatingChildComponent } from './lifecycle'

import {
  set,
  del,
  observe,
  defineReactive,
  toggleObserving
} from '../observer/index'

import {
  warn,
  bind,
  noop,
  hasOwn,
  hyphenate,
  isReserved,
  handleError,
  nativeWatch,
  validateProp,
  isPlainObject,
  isServerRendering,
  isReservedAttribute,
  invokeWithErrorHandling
} from '../util/index'

// 定义 默认的属性描述符
const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop
}

// 将 key 代理到 vue 实例上
export function proxy (target: Object, sourceKey: string, key: string) {
  sharedPropertyDefinition.get = function proxyGetter () {
    // this._props.key
    return this[sourceKey][key]
  }
  sharedPropertyDefinition.set = function proxySetter (val) {
    this[sourceKey][key] = val
  }
  // 拦截对 this.key 的访问
  Object.defineProperty(target, key, sharedPropertyDefinition)
}

// 响应式原理的入口，分别处理 props、methods、data、computed、watch
// 优先级： props、methods、data、computed 对象中的属性不能出现重复，优先级和列出顺序一致
export function initState (vm: Component) {
  //  Vue2.0 起，侦测粒度为组件层面，其中一个状态发生变化，会通知到组件，然后组件内部使用虚拟 DOM 进行数据比对
  // 新增 _watchers，保存当前组件中所有的 watcher 实例
  vm._watchers = []
  const opts = vm.$options
  // 对 prop 配置做响应式处理
  // 代理 props 配置上的 key 到 vue 实例，支持 this.propKey 的方式访问
  if (opts.props) initProps(vm, opts.props)
  // 判重处理： methods 对象中定义的属性不能和 props 对象中的属性重复， props 优先级 > methods 的优先级
  // 将 methods 中的配置赋值到 vue 实例上， 支持通过 this.methodsKey 的方式访问方法
  if (opts.methods) initMethods(vm, opts.methods)
  // data 在 props 后初始化，data 中可以使用 props 中的数据
  if (opts.data) {
    // 判重处理： data 中的属性不能和 props 以及 methods 中的属性重复
    // 代理： 将 data 中的属性代理到 vue 实例上，支持通过 this.key 的方式访问
    // 响应式
    initData(vm)
  } else {
    // 不存在 直接使用 observe 观察空对象
    observe(vm._data = {}, true /* asRootData */)
  }
  // computed 是通过 watcher 来实现的，对每一个 computedKey 实例化一个 watcher，默认懒执行
  // 将 computedKey 代理到 vue 实例上，支持通过 this.computedKey 的方式访问 computed.key
  // 判重, computed 中的 key 不能和 data、props 中的属性重复
  // 注意理解 computed 缓存的实现原理
  if (opts.computed) initComputed(vm, opts.computed)
  // watch 在 props 和 data 后面初始化，所以 watch 中可以观察 props 和 data
  // opts.watch !== nativeWatch  避免 Fireox 浏览器中的 Object.prototype 上有一个 watch方法。当用户没有设置 watch 时，避免 opts。watch 会是 Object.prototype.watch 函数
  if (opts.watch && opts.watch !== nativeWatch) {
    // 核心：实例化一个 watcher 实例，并返回一个 unwatch
    initWatch(vm, opts.watch)
  }
  // computed 和 watch 有什么区别
  // computed 默认懒执行，且不可更改，但是 watch 可配置
  // 使用场景不同
}

// 处理 props 对象，为 props 对象的每一个属性设置响应式，并将其代理到 vm 实例上
function initProps (vm: Component, propsOptions: Object) {
  // propsOptions： 规格化之后的 props 选项  详情见： normalizeProps 方法
  // 保存通过父组件或用户通过 propData 传入的真实 props 数据
  const propsData = vm.$options.propsData || {}
  // 指向 vm._props 的指针，所有设置到 props 变量中的属性都会保存到 vm._props 中
  const props = vm._props = {}
  // cache prop keys so that future props updates can iterate using Array
  // instead of dynamic object key enumeration.
  // 缓存 props 的每个 key，性能优化。将来更新 props 时，只需要遍历 vm.$options._propKeys 数组即可
  const keys = vm.$options._propKeys = []
  // 判断是否是根组件
  const isRoot = !vm.$parent
  // root instance props should be converted
  // root 实例的 props 属性应该被转换成响应式数据；不是根实例，不需要转换
  if (!isRoot) {
    // toggleObserving: 用来控制数据转换成响应式
    toggleObserving(false)
  }
  for (const key in propsOptions) {
    // 缓存 key
    keys.push(key)
    // 验证 prop，不存在默认值替换，类型为 bool，则变换成 true 或 false，当时用 default 中默认值时，会将默认值的副本 observe
    const value = validateProp(key, propsOptions, propsData, vm)
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      // 不能是保留属性： key，ref，slot，slot-scope，is
      const hyphenatedKey = hyphenate(key)
      if (isReservedAttribute(hyphenatedKey) ||
          config.isReservedAttr(hyphenatedKey)) {
        warn(
          `"${hyphenatedKey}" is a reserved attribute and cannot be used as component prop.`,
          vm
        )
      }
      defineReactive(props, key, value, () => {
        if (!isRoot && !isUpdatingChildComponent) {
          warn(
            `Avoid mutating a prop directly since the value will be ` +
            `overwritten whenever the parent component re-renders. ` +
            `Instead, use a data or computed property based on the prop's ` +
            `value. Prop being mutated: "${key}"`,
            vm
          )
        }
      })
    } else {
      // 对 proxy 数据做响应式处理
      defineReactive(props, key, value)
    }
    // static props are already proxied on the component's prototype
    // during Vue.extend(). We only need to proxy props defined at
    // instantiation here.
    // 代理 this.propsKey
    if (!(key in vm)) {
      proxy(vm, `_props`, key)
    }
  }
  toggleObserving(true)
}

/**
 * 1：判重
 * 2：将 data[key] 代理到 Vue 实例上
 * 3：为 data 数据设置响应式
*/
function initData (vm: Component) {
  let data = vm.$options.data
  // 将变量data作为指针指向vm._data
  // 保证后续处理的 data 是一个对象
  data = vm._data = typeof data === 'function'
    ? getData(data, vm)
    : data || {}
  if (!isPlainObject(data)) {
    data = {}
    process.env.NODE_ENV !== 'production' && warn(
      'data functions should return an object:\n' +
      'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
      vm
    )
  }
  // proxy data on instance
  const keys = Object.keys(data)
  const props = vm.$options.props
  const methods = vm.$options.methods
  let i = keys.length
  while (i--) {
    const key = keys[i]
    // 判重处理： data 中属性 不能和 props 和 methods 中的属性重复
    if (process.env.NODE_ENV !== 'production') {
      if (methods && hasOwn(methods, key)) {
        warn(
          `Method "${key}" has already been defined as a data property.`,
          vm
        )
      }
    }
    if (props && hasOwn(props, key)) {
      process.env.NODE_ENV !== 'production' && warn(
        `The data property "${key}" is already declared as a prop. ` +
        `Use prop default value instead.`,
        vm
      )
      // 过滤 不是以 $ 或 _ 开头的
    } else if (!isReserved(key)) {
      // 代理，代理 data 中的属性到 vue 实例，支持通过 this.key 的方式访问
      proxy(vm, `_data`, key)
    }
  }
  // observe data
  // 响应式处理
  observe(data, true /* asRootData */)
}

export function getData (data: Function, vm: Component): any {
  // #7573 disable dep collection when invoking data getters
  pushTarget()
  try {
    return data.call(vm, vm)
  } catch (e) {
    handleError(e, vm, `data()`)
    return {}
  } finally {
    popTarget()
  }
}

const computedWatcherOptions = { lazy: true }

/**
 * 1：为 computed[key] 创建 watcher 实例，默认是懒加载
 * 2：代理 computed[key] 到 Vm 实例
 * 3：判重
 * compute = {
 *   key1: () => { return x }
 *   key2: {
 *      get: () => { return x }
 *      set: () => {}
 *   }
 * }
*/
function initComputed (vm: Component, computed: Object) {
  // $flow-disable-line
  // Object.create(null) 创建出来的对象没有原型，不存在 __proto__ 属性
  const watchers = vm._computedWatchers = Object.create(null)
  // computed properties are just getters during SSR
  // 计算属性在 SSR 环境中，只是一个普通的 getter 方法
  const isSSR = isServerRendering()

  // 遍历 computed 对象
  for (const key in computed) {
    // 获取 kye 对应的值
    const userDef = computed[key]
    // 获取 getter 函数
    const getter = typeof userDef === 'function' ? userDef : userDef.get
    // 如果没有取值器
    if (process.env.NODE_ENV !== 'production' && getter == null) {
      warn(
        `Getter is missing for computed property "${key}".`,
        vm
      )
    }

    // 在非 SSR 环境中，为计算属性创建内部观察器
    if (!isSSR) {
      // create internal watcher for the computed property.
      // 实例化一个 watch ,所以 computed 其实就是通过 watcher 来实现的 
      watchers[key] = new Watcher(
        vm,
        // getter 函数
        getter || noop,
        noop,
        // 配置项， computed 默认是 懒加载
        computedWatcherOptions
      )
    }

    // component-defined computed properties are already defined on the
    // component prototype. We only need to define computed properties defined
    // at instantiation here.
    if (!(key in vm)) {
      // 代理 computed 对象中的属性到 vm 实例上，可以使用 this.computedKey 访问
      defineComputed(vm, key, userDef)
    } else if (process.env.NODE_ENV !== 'production') {
      // 不能与 data 、 props 、 methods 重名，重名不会定义计算属性
      if (key in vm.$data) {
        warn(`The computed property "${key}" is already defined in data.`, vm)
      } else if (vm.$options.props && key in vm.$options.props) {
        warn(`The computed property "${key}" is already defined as a prop.`, vm)
      } else if (vm.$options.methods && key in vm.$options.methods) {
        warn(`The computed property "${key}" is already defined as a method.`, vm)
      }
    }
  }
}

// 代理 computed 对象中的 key 到 vm 上
export function defineComputed (
  target: any,
  key: string,
  userDef: Object | Function
) {
  // 非服务端 计算属性才缓存  shouldCache：true
  const shouldCache = !isServerRendering()
  // 构造属性描述符（get、set）
  if (typeof userDef === 'function') {
    sharedPropertyDefinition.get = shouldCache
      ? createComputedGetter(key)
      : createGetterInvoker(userDef)
    sharedPropertyDefinition.set = noop
  } else {
    sharedPropertyDefinition.get = userDef.get
    // cache 废弃选项 默认为 true
      ? shouldCache && userDef.cache !== false
        ? createComputedGetter(key)
        : createGetterInvoker(userDef.get)
      : noop
    sharedPropertyDefinition.set = userDef.set || noop
  }
  if (process.env.NODE_ENV !== 'production' &&
      sharedPropertyDefinition.set === noop) {
    // 没有设置 setter，对计算属性进行修改
    sharedPropertyDefinition.set = function () {
      warn(
        `Computed property "${key}" was assigned to but it has no setter.`,
        this
      )
    }
  }
  // 将 computed 配置中的 key 代理到 vue实例上,支持通过 this.computedKey 的方式访问 computed 中属性
  Object.defineProperty(target, key, sharedPropertyDefinition)
}

// 返回一个函数，在访问 vm.computedProperty 时会被执行，然后返回执行结果
function createComputedGetter (key) {
  // computed 属性值会缓存的原理也是在这里结合 watcher.dirty、watcher.evaluate、watcher.update 实现的
  return function computedGetter () {
    // 拿到 watcher  this._computedWatchers 属性保存了所有计算属性的 watcher 实例
    const watcher = this._computedWatchers && this._computedWatchers[key]
    if (watcher) {
      // 执行 watcher.evaluate 方法
      // 执行 computed.key 的值(函数)得到函数的执行结果，赋值给 watcher.value
      // 将 watcher.dirty 置为 false
      // computed 和 methods 有什么区别
      // 一次渲染当中，只执行一次 computed 函数，后续的访问就不再执行了，直到下一次更新之后，才会再执行
      if (watcher.dirty) {
        // watcher.dirty 属性用于标识计算属性的返回值是否有变化
        // true： 所依赖的状态发生了改变
        watcher.evaluate()
      }
      if (Dep.target) {
        // 将读取计算属性的 watcher 添加到计算属性所依赖的所有状态的依赖列表中
        // 让计算属性的 watcher 持续观察计算属性所依赖的状态的变化
        watcher.depend()
      }
      return watcher.value
    }
  }
}

function createGetterInvoker(fn) {
  return function computedGetter () {
    return fn.call(this, this)
  }
}

/**
 * 1：校验 methods[kye]，是否是函数
 * 2：判重
 * 将 methods[key] 赋值到 vm 实例上,得到 vm[key] = methods[key]
*/
function initMethods (vm: Component, methods: Object) {
  const props = vm.$options.props
  // 判重， methods 中的 key 不能和 props 中的 key 重复。 props 中的优先级高于 methods
  for (const key in methods) {
    if (process.env.NODE_ENV !== 'production') {
      // 检验是否是个函数
      if (typeof methods[key] !== 'function') {
        warn(
          `Method "${key}" has type "${typeof methods[key]}" in the component definition. ` +
          `Did you referenc e the function correctly?`,
          vm
        )
      }
      // 检验 是否和 props 中同名
      if (props && hasOwn(props, key)) {
        warn(
          `Method "${key}" has already been defined as a prop.`,
          vm
        )
      }
      // 检查 是否和 Vue 实例上已有的方法重叠,一般是一些内置的方法,比如以 $ 或 _ 开头的
      if ((key in vm) && isReserved(key)) {
        warn(
          `Method "${key}" conflicts with an existing Vue instance method. ` +
          `Avoid defining component methods that start with _ or $.`
        )
      }
    }
    // 将 methods 中的所有方法赋值到 vue 实例上，支持通过 this.methodKey 的方式访问定义的方法
    vm[key] = typeof methods[key] !== 'function' ? noop : bind(methods[key], vm)
  }
}

/**
 * 1：遍历 watch 对象
 * 2：调用 createWatcher 函数
 * watch = {
 *   'key1': (val, oldVal) => {}
 *   'key2': 'this.methodName',
 *   'key3': {
 *      handler: (val, oldVal) => {},
 *      deep: true
 *    },
 *   'key4': [
 *     'this.methodName',
 *     () => {},
 *     {}
 *    ],
 *   'key.key5': {} 
 * }
*/
function initWatch (vm: Component, watch: Object) {
  // 遍历 watch 配置项
  for (const key in watch) {
    const handler = watch[key]
    if (Array.isArray(handler)) {
      // 为数组的情况
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i])
      }
    } else {
      createWatcher(vm, key, handler)
    }
  }
}

/**
 * 兼容性处理,保证是个函数
 * 调用 $watch
*/
function createWatcher (
  vm: Component,
  // 表达式或计算属性函数
  expOrFn: string | Function,
  // watch 对象的值
  handler: any,
  // 用于传递给 vm.$watch 的选项对象
  options?: Object
) {
  // 如果是对象 从 handler 属性获取 函数
  if (isPlainObject(handler)) {
    options = handler
    handler = handler.handler
  }
  // 如果是字符串，表示的是一个 methods 方法，直接通过 this.methodsKey 的方式拿到函数
  if (typeof handler === 'string') {
    handler = vm[handler]
  }
  return vm.$watch(expOrFn, handler, options)
}

export function stateMixin (Vue: Class<Component>) {
  // flow somehow has problems with directly declared definition object
  // when using Object.defineProperty, so we have to procedurally build up
  // the object here.
  // 处理 data 数据，定义 get 方法，访问 this._data
  const dataDef = {}
  dataDef.get = function () { return this._data }
  // 处理 props 数据
  const propsDef = {}
  propsDef.get = function () { return this._props }
  // 异常提示
  if (process.env.NODE_ENV !== 'production') {
    dataDef.set = function () {
      warn(
        'Avoid replacing instance root $data. ' +
        'Use nested data properties instead.',
        this
      )
    }
    // 只读
    propsDef.set = function () {
      warn(`$props is readonly.`, this)
    }
  }

  // 将 $data 和 $props 挂载到 Vue 原型链，支持通过 this.$data 和 this.$props 访问
  Object.defineProperty(Vue.prototype, '$data', dataDef)
  Object.defineProperty(Vue.prototype, '$props', propsDef)

  // this.$set 和 this.$delete
  // Vue.set 和 Vue.delete 别名
  Vue.prototype.$set = set
  Vue.prototype.$delete = del


  // // 键路径
  // vm.$watch('a.b.c', function (newVal, oldVal) {
  //   // 做点什么
  // })
  // // 函数
  // vm.$watch(
  //   function () {
  //     // 表达式 `this.a + this.b` 每次得出一个不同的结果时
  //     // 处理函数都会被调用。
  //     // 这就像监听一个未被定义的计算属性
  //     return this.a + this.b
  //   },
  //   function (newVal, oldVal) {
  //     // 做点什么
  //   }
  // )
  /**
   * 创建 watcher，返回 unwatch：
   *   1：兼容性处理，保证 new Watcher 时的 cb 为函数
   *   2：标记用户 watcher
   *   3：创建 watcher 实例
   *   4：如果设置了 immediate，则立即执行 cb
   *   5：返回 unwatch
  */
  Vue.prototype.$watch = function (
    // key
    expOrFn: string | Function,
    // 回调函数
    cb: any,
    // 配置项
    options?: Object
  ): Function {
    const vm: Component = this
    // 兼容性处理，用户调用 vm.$watch 时设置的 cb 可能是个对象；处理 cb 是对象的情况，保证后续处理中 cb 肯定是个函数
    // this.$watch()
    if (isPlainObject(cb)) {
      return createWatcher(vm, expOrFn, cb, options)
    }
    // options.user 表示用户 watcher，还有渲染 watcher，即 updateComponent 方法中实例化的 watcher
    options = options || {}
    // 标记，这是个用户 watcher
    options.user = true
    // 实例化 watcher
    const watcher = new Watcher(vm, expOrFn, cb, options)
    // 存在 immediate，则立即执行回调函数
    if (options.immediate) {
      const info = `callback for immediate watcher "${watcher.expression}"`
      pushTarget()
      invokeWithErrorHandling(cb, vm, [watcher.value], vm, info)
      popTarget()
    }
    // 返回一个 unwatch，用于解除监听
    return function unwatchFn () {
      watcher.teardown()
    }
  }
}
