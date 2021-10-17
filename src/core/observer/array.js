/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 */

import { def } from '../util/index'

// 覆写（增强）数组原型方法，使其具有依赖通知更新的能力
// 基于数组原型对象创建一个新的对象
const arrayProto = Array.prototype
export const arrayMethods = Object.create(arrayProto)

// 操作数组的七个方法，这七个方法可以改变数组自身
// 变更方法 （filter、map等不会变更原始数组：替换方法）
const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

/**
 * Intercept mutating methods and emit events
 */
// 拦截变异方法并触发；函数劫持
// 遍历七个方法
methodsToPatch.forEach(function (method) {
  // cache original method
  // 缓存原生方法；以 push 为例，获取 arrayProto.push 的原生方法
  const original = arrayProto[method]
  // 分别在 arrayMethods 对象上定义 七个方法
  // 比如后续执行 arr.push()
  // def 就是 Object.defineProperty，拦截 arrayMethods 的访问
  def(arrayMethods, method, function mutator (...args) {
    // 先执行原生的 push 方法，往数组中放置更新的数据
    const result = original.apply(this, args)
    const ob = this.__ob__
    // 如果是一下三个之一，说明新插入了元素
    let inserted
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args
        break
      case 'splice':
        // splice 第三个参数才是新增元素
        inserted = args.slice(2)
        break
    }
    // 如果执行的是 push unshift splice 操作的话，进行响应式处理
    if (inserted) ob.observeArray(inserted)
    // notify change
    // 执行 dep.notify 方法进行依赖通知更新
    ob.dep.notify()
    return result
  })
})
