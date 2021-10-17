/* @flow */
/* globals MutationObserver */

import { noop } from 'shared/util'
import { handleError } from './error'
import { isIE, isIOS, isNative } from './env'

export let isUsingMicroTask = false

// 回调队列
const callbacks = []
// 异步锁
let pending = false

/**
 * 1.将 pending 再次置为 false，表示下一个 flushCallbacks 函数可以进入浏览器的异步队列任务
 * 2.清空 callbacks 数组
 * 3.执行 callbacks 数组中的所有函数 
 *        flushSchedulerQueue
 *        用户自己调用 this.$nextTick 传递的函数
 */
function flushCallbacks () {
  // 微任务队列中，只会存在一个 flushCallbacks 函数
  // 置为 false；使下个事件循环中能 nextTick 函数中调用 timerFunc 函数
  pending = false
  // 相当于 深拷贝
  const copies = callbacks.slice(0)
  // 清空 callbacks
  callbacks.length = 0
  // 遍历 callbacks 数组,执行其中存储的每个 flushSchedulerQueue 函数
  for (let i = 0; i < copies.length; i++) {
    copies[i]()
  }
}

// microtasks： 微任务； macro： 宏任务
// Here we have async deferring wrappers using microtasks.
// In 2.5 we used (macro) tasks (in combination with microtasks).
// However, it has subtle problems when state is changed right before repaint
// (e.g. #6813, out-in transitions).
// Also, using (macro) tasks in event handler would cause some weird behaviors
// that cannot be circumvented (e.g. #7109, #7153, #7546, #7834, #8109).
// So we now use microtasks everywhere, again.
// A major drawback of this tradeoff is that there are some scenarios
// where microtasks have too high a priority and fire in between supposedly
// sequential events (e.g. #4521, #6690, which have workarounds)
// or even between bubbling of the same event (#6566).
// 将 flushCallbacks 函数放入浏览器的异步任务队列中
let timerFunc

// The nextTick behavior leverages the microtask queue, which can be accessed
// via either native Promise.then or MutationObserver.
// MutationObserver has wider support, however it is seriously bugged in
// UIWebView in iOS >= 9.3.3 when triggered in touch event handlers. It
// completely stops working after triggering a few times... so, if native
// Promise is available, we will use it:
/* istanbul ignore next, $flow-disable-line */
// 优雅降级处理
if (typeof Promise !== 'undefined' && isNative(Promise)) {
  const p = Promise.resolve()
  // 首选 Promise.resolve().then()
  timerFunc = () => {
    // 在微任务队列 中放入 flushCallbacks 函数
    p.then(flushCallbacks)
    // In problematic UIWebViews, Promise.then doesn't completely break, but
    // it can get stuck in a weird state where callbacks are pushed into the
    // microtask queue but the queue isn't being flushed, until the browser
    // needs to do some other work, e.g. handle a timer. Therefore we can
    // "force" the microtask queue to be flushed by adding an empty timer.
    /**
     * 在有问题的 UIWebViews 中，Promise.then 不会完全中断，但是它可能会陷入奇异的状态
     * 在这种状态下，回调被推入微任务队列，但队列没有刷新，知道浏览器需要执行其他工作。例如处理一个定时器
     * 因此，通过添加空定时器来 强制 刷新微任务队列
    */
    if (isIOS) setTimeout(noop)
  }
  isUsingMicroTask = true
} else if (!isIE && typeof MutationObserver !== 'undefined' && (
  isNative(MutationObserver) ||
  // PhantomJS and iOS 7.x
  MutationObserver.toString() === '[object MutationObserverConstructor]'
)) {
  // MutationObserver 次之
  // Use MutationObserver where native Promise is not available,
  // e.g. PhantomJS, iOS7, Android 4.4
  // (#6466 MutationObserver is unreliable in IE11)
  let counter = 1
  // 创建新的 MutationObserver
  const observer = new MutationObserver(flushCallbacks)
  // 参加文本节点
  const textNode = document.createTextNode(String(counter))
  // 监听文本节点内容
  observer.observe(textNode, {
    characterData: true
  })
  timerFunc = () => {
    counter = (counter + 1) % 2
    textNode.data = String(counter)
  }
  isUsingMicroTask = true
} else if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
  // setImmediate 宏任务
  // 兼容 IE10 以上浏览器
  // Fallback to setImmediate.
  // Technically it leverages the (macro) task queue,
  // but it is still a better choice than setTimeout.
  timerFunc = () => {
    setImmediate(flushCallbacks)
  }
} else {
  // 最后 setTimeout
  // 兼容 IE10 以下浏览器
  // Fallback to setTimeout.
  timerFunc = () => {
    setTimeout(flushCallbacks, 0)
  }
}

/**
 * 1：用 try catch 包装 flushSchedulerQueue 函数，然后将其放入 callbacks 数组
 * 2: 如果 pending 为 false，表示现在浏览器的任务队列中没有 flushCallbacks 函数
 *    如果 pending 为 true，则表示浏览器的任务队列中已经放入 flushCallbacks 函数
 *    待执行 flushCallbacks 函数时，pending 会再次置为 false，表示下一个 flushCallbacks 函数可以进入浏览器的任务队列
 * pending 的作用： 保证同一时刻，浏览器的任务队列中只有一个 flushCallbacks 函数
 * @param {*} cb 接受一个回调函数 => flushSchedulerQueue 函数
 * @param {*} ctx 上下文
 * @returns 
 */
export function nextTick (cb?: Function, ctx?: Object) {
  let _resolve
  // 将 nextTick 的回调函数用 try catch 包装一层，方便异常捕获
  // 然后将 包装后的函数 放到这个 callback 数组 （将回调函数推入回调队列）
  callbacks.push(() => {
    if (cb) {
      // 方便错误捕获
      try {
        cb.call(ctx)
      } catch (e) {
        handleError(e, ctx, 'nextTick')
      }
    } else if (_resolve) {
      _resolve(ctx)
    }
  })
  if (!pending) {
    // pending 为 false，没有 flushCallbacks 函数，执行 timeFunc 函数
    pending = true
    // 在浏览器的任务队列中（首选微任务队列）放入 flushCallbacks 函数
    timerFunc()
  }
  // $flow-disable-line
  // 没有提供回调，并支持 Promise，返回一个 Promise
  if (!cb && typeof Promise !== 'undefined') {
    return new Promise(resolve => {
      _resolve = resolve
    })
  }
}
