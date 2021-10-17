/* @flow */

import type Watcher from './watcher'
import config from '../config'
import { callHook, activateChildComponent } from '../instance/lifecycle'

import {
  warn,
  nextTick,
  devtools,
  inBrowser,
  isIE
} from '../util/index'

export const MAX_UPDATE_COUNT = 100

const queue: Array<Watcher> = []
const activatedChildren: Array<Component> = []
let has: { [key: number]: ?true } = {}
let circular: { [key: number]: number } = {}
let waiting = false
let flushing = false
let index = 0

/**
 * Reset the scheduler's state.
 */
function resetSchedulerState () {
  index = queue.length = activatedChildren.length = 0
  has = {}
  if (process.env.NODE_ENV !== 'production') {
    circular = {}
  }
  waiting = flushing = false
}

// Async edge case #6566 requires saving the timestamp when event listeners are
// attached. However, calling performance.now() has a perf overhead especially
// if the page has thousands of event listeners. Instead, we take a timestamp
// every time the scheduler flushes and use that for all event listeners
// attached during that flush.
export let currentFlushTimestamp = 0

// Async edge case fix requires storing an event listener's attach timestamp.
let getNow: () => number = Date.now

// Determine what event timestamp the browser is using. Annoyingly, the
// timestamp can either be hi-res (relative to page load) or low-res
// (relative to UNIX epoch), so in order to compare time we have to use the
// same timestamp type when saving the flush timestamp.
// All IE versions use low-res event timestamps, and have problematic clock
// implementations (#9632)
if (inBrowser && !isIE) {
  const performance = window.performance
  if (
    performance &&
    typeof performance.now === 'function' &&
    getNow() > document.createEvent('Event').timeStamp
  ) {
    // if the event timestamp, although evaluated AFTER the Date.now(), is
    // smaller than it, it means the event is using a hi-res timestamp,
    // and we need to use the hi-res version for event listener timestamps as
    // well.
    getNow = () => performance.now()
  }
}

/**
 * Flush both queues and run the watchers.
 */
/**
 * 刷新队列，由 flushCallbacks 函数负责调用，主要：
 *   1：更新 flushing 为 true，表示正在刷新队列，在此期间往队列中 push 新的 watcher 时需要特殊处理，将其放在队列合适的位置
 *   2：按照队列中的 watcher.id 从下到大排序，保证西安创建的 watcher 先执行，也配合第一步
 *   3：遍历 watcher 队列，依次执行 watcher.before、watcher.run，并清除缓存的 watcher
*/
function flushSchedulerQueue () {
  currentFlushTimestamp = getNow()
  // 将 flushing 置为 true，表示现在的 watcher 队列正在被刷新
  flushing = true
  let watcher, id

  // Sort queue before flush.
  // This ensures that:
  // 1. Components are updated from parent to child. (because parent is always
  //    created before the child)
  // 2. A component's user watchers are run before its render watcher (because
  //    user watchers are created before the render watcher)
  // 3. If a component is destroyed during a parent component's watcher run,
  //    its watchers can be skipped.
  /** 
   * 刷新队列之前先给队列排序(升序),可以保证:
   *  1.组件的更新顺序为父级到子级,因为父组件总是在子组件之前被创建
   *  2.一个组件的用户 watcher 在其渲染 watcher 之前执行,因为用户 watcher 先于 渲染 watcher的创建
   *  3.如果一个组件在其父组件的 watch 执行期间销毁,则它的 watcher 可以跳过
   * 排序以后在刷新队列期间新进来的 watcher 也会按顺序放入队列的合适位置
   */
  queue.sort((a, b) => a.id - b.id)

  // do not cache length because more watchers might be pushed
  // as we run existing watchers
  // for 循环遍历 watcher 队列，依次执行 watcher 的 run 方法
  // 这里直接使用了 queue.length，动态计算队列的长度，没有缓存长度，是因为在执行现有 watcher 期间队列中可能会被 push 进新的 watcher
  for (index = 0; index < queue.length; index++) {
    // 拿出当前索引 watcher
    watcher = queue[index]
    // 首先执行 before 钩子
    if (watcher.before) {
      // 使用 vm.$watch 或者 watch 选项时可以通过配置项（options.before）传递
      watcher.before()
    }
    // 清空缓存，表示当前 watcher 已经被执行，当该 watcher 再次入队时就可以进来
    id = watcher.id
    has[id] = null
    // 执行 watcher 的 run 方法
    watcher.run()
    // in dev build, check and stop circular updates.
    if (process.env.NODE_ENV !== 'production' && has[id] != null) {
      circular[id] = (circular[id] || 0) + 1
      if (circular[id] > MAX_UPDATE_COUNT) {
        warn(
          'You may have an infinite update loop ' + (
            watcher.user
              ? `in watcher with expression "${watcher.expression}"`
              : `in a component render function.`
          ),
          watcher.vm
        )
        break
      }
    }
  }

  // keep copies of post queues before resetting state
  const activatedQueue = activatedChildren.slice()
  const updatedQueue = queue.slice()

  resetSchedulerState()

  // call component updated and activated hooks
  callActivatedHooks(activatedQueue)
  callUpdatedHooks(updatedQueue)

  // devtool hook
  /* istanbul ignore if */
  if (devtools && config.devtools) {
    devtools.emit('flush')
  }
}

function callUpdatedHooks (queue) {
  let i = queue.length
  while (i--) {
    const watcher = queue[i]
    const vm = watcher.vm
    if (vm._watcher === watcher && vm._isMounted && !vm._isDestroyed) {
      callHook(vm, 'updated')
    }
  }
}

/**
 * Queue a kept-alive component that was activated during patch.
 * The queue will be processed after the entire tree has been patched.
 */
export function queueActivatedComponent (vm: Component) {
  // setting _inactive to false here so that a render function can
  // rely on checking whether it's in an inactive tree (e.g. router-view)
  vm._inactive = false
  activatedChildren.push(vm)
}

function callActivatedHooks (queue) {
  for (let i = 0; i < queue.length; i++) {
    queue[i]._inactive = true
    activateChildComponent(queue[i], true /* true */)
  }
}

/**
 * Push a watcher into the watcher queue.
 * Jobs with duplicate IDs will be skipped unless it's
 * pushed when the queue is being flushed.
 */
// 将 watcher 放入 watcher 队列
export function queueWatcher (watcher: Watcher) {
  const id = watcher.id
  // 判重， watcher 不会重复入队
  if (has[id] == null) {
    // 缓存一下，置为 true，用于判断是否已经入队
    has[id] = true
    if (!flushing) {
      // 如果 flushing = false，表示当前 watcher 队列没有处于刷新，watcher 直接入队
      queue.push(watcher)
    } else {
      // watcher 队列已经在被刷新了，这时候这个 watcher 入队就需要特殊操作一下
      // 保证 watcher 入队后，刷新中的 watcher 队列仍然是有序的
      // 从队列尾开始倒序遍历，根据当前 watcher.id
      // if already flushing, splice the watcher based on its id
      // if already past its id, it will be run next immediately.
      let i = queue.length - 1
      while (i > index && queue[i].id > watcher.id) {
        i--
      }
      queue.splice(i + 1, 0, watcher)
    }
    // queue the flush
    if (!waiting) {
      // waiting 为 false 走这里，表示当前浏览器的异步任务队列中没有 flushSchedulerQueue 函数
      waiting = true

      if (process.env.NODE_ENV !== 'production' && !config.async) {
        // 同步执行，直接去刷新 watcher 队列
        // 一般不会走到这，Vue 默认是异步执行；改为同步，性能大打折扣
        flushSchedulerQueue()
        return
      }
      // this.$nextTick 或者 Vue.nextTick
      // 将回调函数（flushSchedulerQueue）放入 callbacks 数组
      // 通过 pending 控制向浏览器任务队列中添加 flushCallbacks 函数
      nextTick(flushSchedulerQueue)
    }
  }
}
