/* @flow */

import {
  tip,
  toArray,
  hyphenate,
  formatComponentName,
  invokeWithErrorHandling
} from '../util/index'
import { updateListeners } from '../vdom/helpers/index'

export function initEvents (vm: Component) {
  //  用来存储事件对象
  vm._events = Object.create(null)
  vm._hasHookEvent = false
  // init parent attached events
  // 父组件 事件监听器
  const listeners = vm.$options._parentListeners
  if (listeners) {
    // 存在事件监听器 将父组件向子组件注册的事件注册到子组件的实例中
    updateComponentListeners(vm, listeners)
  }
}

let target: any

function add (event, fn) {
  // this.$on
  target.$on(event, fn)
}

function remove (event, fn) {
  target.$off(event, fn)
}

function createOnceHandler (event, fn) {
  const _target = target
  return function onceHandler () {
    const res = fn.apply(null, arguments)
    if (res !== null) {
      _target.$off(event, onceHandler)
    }
  }
}

export function updateComponentListeners (
  vm: Component,
  listeners: Object,
  oldListeners: ?Object
) {
  target = vm
  // 如果 listeners 对象中存在某个 key（即事件名）而 oldListeners 中不存在，则需要新增事件
  // 反之：则需要从事件系统中卸载
  updateListeners(listeners, oldListeners || {}, add, remove, createOnceHandler, vm)
  target = undefined
}

/**
 * methods: {
    isClick () {
      this.$emit('isLeft', '点击事件！')
    },
    isClickOther () {
      this.$emit('isRight', ['点击1', '点击2'])
    }
  },
  mounted () {
    this.$on('isLeft', val => {
      console.log(val)
    })
    this.$on('isLeft', val => {
      console.log('=====')
    })
    this.$on('isRight', (...val) => {
      console.log(val)
    })
    this.$on(['isLeft', 'isRight'], () => {
      console.log(666)
    })
  }
*/
export function eventsMixin (Vue: Class<Component>) {
  const hookRE = /^hook:/
  /**
   * 监听实例上的自定义事件
   * 将所有事件和对应的回调放到 vm._event 对象上
   * vm._event = { eventName: [fn1,fn2,...],... }
  */
  Vue.prototype.$on = function (event: string | Array<string>, fn: Function): Component {
    const vm: Component = this
    // 事件为数组的情况
    // this.$on([event1,event2,...], () => { xxx })
    if (Array.isArray(event)) {
      for (let i = 0, l = event.length; i < l; i++) {
        // 调用 $on
        vm.$on(event[i], fn)
      }
    } else {
      // 一个事件可以设置多个响应函数
      // this.$on('custom-click', cb1)
      // this.$on('custom-click', cb2)
      (vm._events[event] || (vm._events[event] = [])).push(fn)
      // optimize hook:event cost by using a boolean flag marked at registration
      // instead of a hash lookup
      // <comp @hook:mounted="handleHookMounted"
      // hookEvent 提供从外部为组件实例注入声明周期方法的机会
      // 比如 从组件外部为组件的 mounted 方法注入额外的逻辑
      // 结合 callhook 方法实现
      if (hookRE.test(event)) {
        // 置为 true，标记当前组件实例存在 hook event
        vm._hasHookEvent = true
      }
    }
    return vm
  }

  /**
   * 监听一个自定义事件，但值触发一次。一旦触发，监听器就会被移除
  */
  Vue.prototype.$once = function (event: string, fn: Function): Component {
    const vm: Component = this
    // 包装函数  调用 $on，只是 $on 的回调函数被特殊处理，触发时，执行回调函数，先移除事件监听，然后执行你设置的回调函数
    function on () {
      vm.$off(event, on)
      fn.apply(vm, arguments)
    }
    // 赋值 fn 用于移除时 对比 删除
    on.fn = fn
    // 将包装函数作为事件的回调函数
    vm.$on(event, on)
    return vm
  }

  /**
   * 移除事件监听器，即从 vm._events 对象中找到对应的事件，移除所有事件 或者 移除指定事件的回调函数
   *   1：如果没有参数，则移除所有的事件监听器; vm._events = {}
   *   2：只提供了一个参数，则移除该事件所有的监听器; vm._events[event] = null
   *   3：提供了两个参数，则移除指定事件的指定回调函数
   * 
   * 通过 $on 设置的 vm._events 对象
  */
  Vue.prototype.$off = function (event?: string | Array<string>, fn?: Function): Component {
    const vm: Component = this
    // all
    // 没有参数，移除所有事件监听器 => vm._events = {}
    if (!arguments.length) {
      vm._events = Object.create(null)
      return vm
    }
    // array of events
    if (Array.isArray(event)) {
      for (let i = 0, l = event.length; i < l; i++) {
        vm.$off(event[i], fn)
      }
      return vm
    }
    // specific event
    // 获取指定事件的回调函数
    const cbs = vm._events[event]
    if (!cbs) {
      // 表示没有注册事件
      return vm
    }
    if (!fn) {
      // 没有 fn 回调函数,则移除改事件的所有回调函数
      vm._events[event] = null
      return vm
    }
    // specific handler
    // 移除指定事件的指定回调函数,从数组的回调函数中找到改回调函数,然后删除
    let cb
    let i = cbs.length
    while (i--) {
      cb = cbs[i]
      // cb.fn === fn  $once 移除时
      if (cb === fn || cb.fn === fn) {
        cbs.splice(i, 1)
        break
      }
    }
    return vm
  }

  /**
   * 触发实例上的指定事件 vm._events[event] => cbs => loop cbs => cb(args)
  */
  Vue.prototype.$emit = function (event: string): Component {
    const vm: Component = this
    if (process.env.NODE_ENV !== 'production') {
      // 事件名转换为小写
      const lowerCaseEvent = event.toLowerCase()
      // HTML 属性不区分大小写， 不能 v-on 监听小驼峰形式的事件，使用 - 字符
      if (lowerCaseEvent !== event && vm._events[lowerCaseEvent]) {
        tip(
          `Event "${lowerCaseEvent}" is emitted in component ` +
          `${formatComponentName(vm)} but the handler is registered for "${event}". ` +
          `Note that HTML attributes are case-insensitive and you cannot use ` +
          `v-on to listen to camelCase events when using in-DOM templates. ` +
          `You should probably use "${hyphenate(event)}" instead of "${event}".`
        )
      }
    }
    // 从 vm._events 对象中获取指定事件的所有回调函数 
    let cbs = vm._events[event]
    if (cbs) {
      // 数组转换，类数组转换为 数组
      cbs = cbs.length > 1 ? toArray(cbs) : cbs
      // this.$emit('custom-click', args1, args2)
      // 获取传入的附加参数 args = [arg1, arg2]
      const args = toArray(arguments, 1)
      const info = `event handler for "${event}"`
      for (let i = 0, l = cbs.length; i < l; i++) {
        // 执行回调函数
        invokeWithErrorHandling(cbs[i], vm, args, vm, info)
      }
    }
    return vm
  }
}
