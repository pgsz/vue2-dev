/* @flow */

import Dep from './dep'
import VNode from '../vdom/vnode'
import { arrayMethods } from './array'
import {
  def,
  warn,
  hasOwn,
  hasProto,
  isObject,
  isPlainObject,
  isPrimitive,
  isUndef,
  isValidArrayIndex,
  isServerRendering
} from '../util/index'

const arrayKeys = Object.getOwnPropertyNames(arrayMethods)

/**
 * In some cases we may want to disable observation inside a component's
 * update computation.
 */
// 某些情况下，禁用组件的更新计算   例如：inject 中
export let shouldObserve: boolean = true

export function toggleObserving (value: boolean) {
  shouldObserve = value
}

/**
 * Observer class that is attached to each observed
 * object. Once attached, the observer converts the target
 * object's property keys into getter/setters that
 * collect dependencies and dispatch updates.
 */
// 监听器
// 观察者类： 会被附加到每个被观察的对象上， value.__ob__ = this
// 而对象的各个属性则会被转换成 getter/setter，并收集依赖和通知更新
export class Observer {
  value: any;
  dep: Dep;
  vmCount: number; // number of vms that have this object as root $data

  constructor (value: any) {
    this.value = value
    // 实例化一个 dep
    this.dep = new Dep()
    this.vmCount = 0
    // 把自身的实例对象添加到数据 value 的__ob__ 属性上，使得 value 的__ob__ 属性上保存 Observer 类的一些实例对象和实例方法
    def(value, '__ob__', this)
    if (Array.isArray(value)) {
      // 处理数组响应式
      // 判断是否有 __proto__ 属性，__proto__ 属性是不规划的，有些浏览器没有此属性
      // obj.__proto__访问对象的原型链
      if (hasProto) {
        protoAugment(value, arrayMethods)
      } else {
        copyAugment(value, arrayMethods, arrayKeys)
      }
      this.observeArray(value)
    } else {
      // 处理对象响应式
      this.walk(value)
    }
  }
 
  /**
   * Walk through all properties and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   */
  // 遍历对象上的每个 key，为每个 key 设置响应式
  // 仅当值为对象时才会走到这
  walk (obj: Object) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i])
    }
  }

  /**
   * Observe a list of Array items.
   */
  // 遍历数组的每一项，对其进行观察（响应式处理）
  observeArray (items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      // 不能直接调用 defineReactive；因为数组元素可以是对象、数组等
      observe(items[i])
    }
  }
}

// helpers

/**
 * Augment a target Object or Array by intercepting
 * the prototype chain using __proto__
 */
function protoAugment (target, src: Object) {
  /* eslint-disable no-proto */
  // 用经过增强的数组原型方法，覆盖默认的原型方法，之后再执行那七个数组方法时就具有了依赖通知更新的能力，已达到实现数组响应式能力
  target.__proto__ = src
  /* eslint-enable no-proto */
}

/**
 * Augment a target Object or Array by defining
 * hidden properties.
 */
// 将增强的那七个方法直接赋值到数组对象上
/* istanbul ignore next */
function copyAugment (target: Object, src: Object, keys: Array<string>) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i]
    def(target, key, src[key])
  }
}

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 */
// 响应式处理入口
// 为对象创建观察者实例，如果对象已经被观察过，则返回已有的观察者实例，否则创建新的观察者实例
// value：被监听的数据； asRootData：true：被监听的数据时根级数据
export function observe (value: any, asRootData: ?boolean): Observer | void {
  // 非对象 和 VNode 实例不做响应式处理
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  let ob: Observer | void
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    // 如果 value 对象上存在 __ob__ 属性且 value.__ob__ 是 Observer 类实例化的对象，则表示已经做过观察了，直接返回 __ob__ 属性，避免重复监听
    ob = value.__ob__
  } else if (
    shouldObserve &&
    // 非服务端
    !isServerRendering() &&
    // 数组或对象
    (Array.isArray(value) || isPlainObject(value)) &&
    // 可扩展的， Object.freeze() 可冻结对象，使其不可扩展
    Object.isExtensible(value) &&
    // 不是 Vue 实例对象
    !value._isVue
  ) {
    // 实例化 Observer，进行响应式处理
    ob = new Observer(value)
  }
  // 根级数据且 ob 有值
  if (asRootData && ob) {
    ob.vmCount++
  }
  return ob
}

/**
 * 监听对象类型的数据 value 过程，是先把 value 作为参数传入 observe(value) 函数，在其中执行 new Observer(value) ，
 * 然后在 Observer 构造函数中，调用 this.walk 实例方法，
 * 在 this.walk 方法中用 Object.keys() 获取 value 的键集合 keys ，然后遍历 keys 在其中执行 defineReactive(value, keys[i]) ，
 * 在 defineReactive 函数中在 value 自身的属性描述符上定义 get 和 set 属性用来监听，
 * 再通过 value[keys[i]] 获取 value 每个子属性 val ，
 * 如果 val 是对象或数组就会执行 observe(val) 来监听子属性 val，重复开始的流程，这样形成了一个递归调用，
 * 这样数据 value不管本身还是它的所有子属性都会被监听到。
*/
/**
 * Define a reactive property on an Object.
 */
/**
 * 拦截 obj[key] 的读取和设置操作
 *  1：在第一次读取时收集依赖，比如执行 render 函数生成虚拟 DOM 时会有读取操作
 *  2：在更新时设置新值并通知依赖更新
*/
export function defineReactive (
  obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function,
  shallow?: boolean
) {
  // 实例化一个 dep，一个 key 对应一个 dep
  const dep = new Dep()

  // 获取属性描述符，不可配置（可改变或删除）对象直接 return
  // Object.getOwnPropertyDescriptor() 方法返回指定对象上一个自有属性对应的属性描述符。（自有属性指的是直接赋予该对象的属性，不需要从原型链上进行查找的属性）
  const property = Object.getOwnPropertyDescriptor(obj, key)
  // configurable 属性为 true 时，该对象的属性描述符才能被修改
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  // 记录 getter 和 setter，获取 val 值
  const getter = property && property.get
  const setter = property && property.set
  // arguments.length === 2 只要两个参数，没有第三个参数 val
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key]
  }

  // 通过递归的方式处理 val 为对象的情况，即处理嵌套对象，保证对象中所有 key 都被观察到
  let childOb = !shallow && observe(val)
  // 响应式核心与原理：
  // 读取对象才会进行依赖收集
  // 拦截 obj[key] 的访问和设置
  Object.defineProperty(obj, key, {
    // 可枚举
    enumerable: true,
    // 属性描述符可修改
    configurable: true,
    // 拦截 obj.key，进行依赖收集以及返回最新的值
    get: function reactiveGetter () {
      // obj.key 的值
      const value = getter ? getter.call(obj) : val
      /**
       * Dep.target 为 Dep 类的一个静态属性，值为 watcher，在实例化 watcher 是会被设置
       * 实例化 Watcher 时会执行 new Watcher 时传递的回调函数（computed 除外，因为懒执行）
       * 回调函数中如果有 vm.key 的读取行为，会触发这里的 读取 拦截，进行依赖收集
       * 回调函数执行完以后会将 Dep.target 设置为 null，避免重复收集依赖
      */
      if (Dep.target) {
        // 读取时进行依赖收集，将 dep 添加到 watcher 中，也将 watcher 添加到 dep 中，双向收集
        dep.depend()
        // childOb 表示对象中嵌套对象的观察者对象，如果存在也对其进行依赖收集
        if (childOb) {
          // 对嵌套对象也进行依赖收集 
          // this.key.childKey 被更新时能触发响应式更新的原因
          childOb.dep.depend()
          if (Array.isArray(value)) {
            // 处理嵌套为数组的情况
            dependArray(value)
          }
        }
      }
      return value
    },
    // 拦截 obj.key =  newVal 的操作
    set: function reactiveSetter (newVal) {
      // 旧值 obj[key]
      const value = getter ? getter.call(obj) : val
      /* eslint-disable no-self-compare */
      // 如果新老值一样的 则直接 return，不更新不触发响应式更新过程
      // 对象的值可能为 NaN，所以用 newVal !== newVal && value !== value 做下判断
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }
      // #7981: for accessor properties without setter
      // setter 不存在，是一个只读属性，直接返回
      if (getter && !setter) return
      // 设置新值，替换老值
      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      // 对新值做响应式处理
      childOb = !shallow && observe(newVal)
      // 当响应式数据更新时，做依赖通知更新
      dep.notify()
    }
  })
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 */
/**
 * 通过 Vue.set 或者 this.$set 方法给 target 的指定 key 设置值 val
 * 如果 target 是对象，并且 key 原本不存在，则为新 key 设置响应式，然后执行依赖通知
*/
export function set (target: Array<any> | Object, key: any, val: any): any {
  if (process.env.NODE_ENV !== 'production' &&
  // undefined、null 或 原始类型
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot set reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  // 处理数组 Vue.set(arr, idx, val)
  // 判断是否是数组，判断参数 key 是否是正确的数组下标
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    // 避免 splice 实例方法中的参数 key 超过数组的长度，而出现只在尾部添加所需的数组元素
    // 确保通过 splice 添加数组元素和通过数组下标添加数组元素的结果一致
    target.length = Math.max(target.length, key)
    // 更新数组指定下标的元素
    // 利用数组的 splice 方法实现的
    target.splice(key, 1, val)
    return val
  }
  // 处理对象已有的属性且不是原型上的属性 对旧值的更新
  if (key in target && !(key in Object.prototype)) {
    target[key] = val
    return val
  }
  const ob = (target: any).__ob__
  // 不能向 Vue 实例或者 $data 动态添加响应式属性，vmCount 的用处之一
  // this.$data 的 ob.vmCount = 1，表示根组件，其他子组件的 vm.vmCount 都是 0
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    )
    return val
  }
  // target 不是响应式对象，新属性会被设置，但是不会做响应式处理
  if (!ob) {
    target[key] = val
    return val
  }
  // 新属性设置 getter、setter，读取时收集依赖，更新时触发依赖通知更新 
  defineReactive(ob.value, key, val)
  // 直接进行依赖通知更新
  ob.dep.notify()
  return val
}

/**
 * Delete a property and trigger change if necessary.
 */
/**
 * 通过 Vue.delete 或者 vm.$delete 删除 target 对象的指定 key
 * 数组通过 splice 方法实现，对象则通过 delete 运算符删除指定 key，并执行依赖通知
*/
export function del (target: Array<any> | Object, key: any) {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot delete reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  // 数组，利用 splice 方法实现删除元素
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1)
    return
  }
  const ob = (target: any).__ob__
  // 避免删除 Vue 实例的属性或者 $date 的数据
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    )
    return
  }
  // 如果属性不存在直接结束
  if (!hasOwn(target, key)) {
    // 没有 key 直接返回
    return
  }
  // 使用 delete 操作符删除属性
  delete target[key]
  // 如没有监听，删除后直接返回
  if (!ob) {
    return 
  }
  // 触发依赖通知更新
  ob.dep.notify()
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 */
// 处理数组选项为对象的情况，对其进行依赖收集，因为前面的所有处理都没办法对数组项为对象的元素进行依赖收集
function dependArray (value: Array<any>) {
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i]
    // 有 __ob__ 说明是对象
    e && e.__ob__ && e.__ob__.dep.depend()
    // 数组情况
    if (Array.isArray(e)) {
      dependArray(e)
    }
  }
}
