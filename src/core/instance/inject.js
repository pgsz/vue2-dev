/* @flow */

import { hasOwn } from 'shared/util'
import { warn, hasSymbol } from '../util/index'
import { defineReactive, toggleObserving } from '../observer/index'

// 解析组件配置项上的 provide 对象，将其挂载到 vm._provide
export function initProvide (vm: Component) {
  const provide = vm.$options.provide
  if (provide) {
    vm._provided = typeof provide === 'function'
      ? provide.call(vm)
      : provide
  }
}

/**
 * 
 * 解析 inject 选项  
 * 
 * 1、得到 { key: val } 形式的配置对象
 * 2、对解析结果做响应式处理，代理每个 key 到 vm 实例上
 */
export function initInjections (vm: Component) {
  // 从配置项上解析 inject 选择，最好得到 result[key] = val 的结果
  const result = resolveInject(vm.$options.inject, vm)
  // 对 result 做数据响应式处理
  // 不建议在子组件去更改这些数据，因为一旦祖代组件中 注入的 provide 发生更改，你在组件中做的更改就会被覆盖
  if (result) {
    toggleObserving(false)
    Object.keys(result).forEach(key => {
      /* istanbul ignore else */
      if (process.env.NODE_ENV !== 'production') {
        defineReactive(vm, key, result[key], () => {
          warn(
            `Avoid mutating an injected value directly since the changes will be ` +
            `overwritten whenever the provided component re-renders. ` +
            `injection being mutated: "${key}"`,
            vm
          )
        })
      } else {
        // 解析结果做响应式处理，将每个 key 代理到 vue 实例上
        // this.key
        defineReactive(vm, key, result[key])
      }
    })
    toggleObserving(true)
  }
}

export function resolveInject (inject: any, vm: Component): ?Object {
  if (inject) {
    // inject is :any because flow is not smart enough to figure out cached
    const result = Object.create(null)
    // inject 配置项的所有的 key
    const keys = hasSymbol
      ? Reflect.ownKeys(inject)
      : Object.keys(inject)

    // 遍历 inject 选项中 key 组成的数组
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      // #6574 in case the inject object is observed...
      // 跳过 __ob__ 对象
      if (key === '__ob__') continue
      // 获取 from 属性
      const provideKey = inject[key].from
      // 遍历所有祖代组件，直到根组件；从祖代组件的配置项中找到 provide 选项，从而找到对应 key 的值
      let source = vm
      while (source) {
        if (source._provided && hasOwn(source._provided, provideKey)) {
          // result[key] = val
          result[key] = source._provided[provideKey]
          break
        }
        source = source.$parent
      }
      // 如果都没找到，则采用 inject[key].default，如果没有默认值，则抛出错误
      if (!source) {
        // 设置默认值
        if ('default' in inject[key]) {
          const provideDefault = inject[key].default
          result[key] = typeof provideDefault === 'function'
            ? provideDefault.call(vm)
            : provideDefault
        } else if (process.env.NODE_ENV !== 'production') {
          warn(`Injection "${key}" not found`, vm)
        }
      }
    }
    return result
  }
}
