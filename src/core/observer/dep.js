/* @flow */

import type Watcher from './watcher'
import { remove } from '../util/index'
import config from '../config'

let uid = 0

/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 */
// 订阅器 / 依赖管理器
// Dep 实际上是对 Watcher 的一种管理
// 一个 Dep 对应一个 obj.key
// 在读取响应式数据时，负责收集依赖，每个 dep（或者说 obi.key）依赖的 watcher 有哪些
// 响应式数据更新时，负责通知 dep 中那些 watcher 去执行 update 方法
export default class Dep {
  static target: ?Watcher;
  id: number;
  subs: Array<Watcher>;

  constructor () {
    // 每个 Dep 都有唯一的 ID
    this.id = uid++
    // subs 用于存放依赖
    this.subs = []
  }

  // 在 dep 中添加 watcher
  addSub (sub: Watcher) {
    this.subs.push(sub)
  }

  // 移除依赖 sub
  removeSub (sub: Watcher) {
    remove(this.subs, sub)
  }

  // 在 watcher 中添加 dep
  // Dep.target 判断是否是 Watcher 的构造函数调用,判断是 Watcher 的 this.get 调用
  depend () {
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }

  // 通知 dep 中所有 watcher，执行 watcher.update()
  notify () {
    // stabilize the subscriber list first
    // subs： dep 中收集的 watcher 数组
    // 把 订阅者subs 克隆一份，避免后续操作影响原 订阅者集合subs
    const subs = this.subs.slice()
    if (process.env.NODE_ENV !== 'production' && !config.async) {
      // subs aren't sorted in scheduler if not running async
      // we need to sort them now to make sure they fire in correct
      // order
      subs.sort((a, b) => a.id - b.id)
    }
    for (let i = 0, l = subs.length; i < l; i++) {
      // 让 watcher 依次执行自己的 update 方法
      subs[i].update()
    }
  }
}

// The current target watcher being evaluated.
// This is globally unique because only one watcher
// can be evaluated at a time.
Dep.target = null
// 存储被触发收集但未被收集完毕的订阅者；理解为一个栈，保证 Watcher 的收集顺序
const targetStack = []

export function pushTarget (target: ?Watcher) {
  // 把当前 Watcher 添加到 targetStack 数组中，只有：恢复这个 Watcher
  targetStack.push(target)
  // 当前 Watcher 赋值到 Dep.target，保证同一时间只有一个 Watcher 被收集
  Dep.target = target
}

export function popTarget () {
  // 把当前 Watcher 移除 targetStack 数组，说明当前 Watcher 已经收集完毕
  targetStack.pop()
  // 把上一个未被收集的 Watcher 重新赋值给 Dep.target
  Dep.target = targetStack[targetStack.length - 1]
}
