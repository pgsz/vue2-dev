/* @flow */

import { _Set as Set, isObject } from '../util/index'
import type { SimpleSet } from '../util/index'
import VNode from '../vdom/vnode'

// 天然的去重效果，避免重复收集依赖
const seenObjects = new Set()

/**
 * Recursively traverse an object to evoke all converted
 * getters, so that every nested property inside the object
 * is collected as a "deep" dependency.
 */
// 创建watcher实例的时候把obj对象内部所有的值都递归的读一遍，
// 那么这个watcher实例就会被加入到对象内所有值的依赖列表中，
// 之后当对象内任意某个值发生变化时就能够得到通知了。
export function traverse (val: any) {
  _traverse(val, seenObjects)
  seenObjects.clear()
}

function _traverse (val: any, seen: SimpleSet) {
  let i, keys
  const isA = Array.isArray(val)
  // 不是数组、对象，被冻结的对象，VNode类实例化对象
  if ((!isA && !isObject(val)) || Object.isFrozen(val) || val instanceof VNode) {
    return
  }
  // 被监听过
  if (val.__ob__) {
    // 获取 Dep 的标识 id
    const depId = val.__ob__.dep.id
    // 避免重复遍历子对象触发收集订阅者
    if (seen.has(depId)) {
      return
    }
    seen.add(depId)
  }
  if (isA) {
    // 数组
    i = val.length
    // 递归
    while (i--) _traverse(val[i], seen)
  } else {
    keys = Object.keys(val)
    i = keys.length
    while (i--) _traverse(val[keys[i]], seen)
  }
}
