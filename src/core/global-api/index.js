/* @flow */

import config from '../config'
import { initUse } from './use'
import { initMixin } from './mixin'
import { initExtend } from './extend'
import { initAssetRegisters } from './assets'
import { set, del } from '../observer/index'
import { ASSET_TYPES } from 'shared/constants'
import builtInComponents from '../components/index'
import { observe } from 'core/observer/index'

import {
  warn,
  extend,
  nextTick,
  mergeOptions,
  defineReactive
} from '../util/index'

/**
 * 初始化全局 api 入口
 *   默认配置： Vue.config
 *   工具方法： Vue.util.xx
 *   Vue.set、Vue.delete、Vue.nextTick、Vue.observable
 *   Vue.options.components、Vue.options.directives、Vue.options.filters、Vue.options._base
 *   Vue.use、Vue.extend、Vue.mixin、Vue.component、Vue.directive、Vue.filter
*/
export function initGlobalAPI (Vue: GlobalAPI) {
  // config
  const configDef = {}
  // Vue 全局默认的配置
  configDef.get = () => config
  // 避免 Vue.configDef = {}
  // Vue.configDef.xxx = xxx
  if (process.env.NODE_ENV !== 'production') {
    configDef.set = () => {
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      )
    }
  }
  // 将配置代理到 Vue 对象上， 通过 Vue.config 的方式访问
  Object.defineProperty(Vue, 'config', configDef)

  // exposed util methods.
  // NOTE: these are not considered part of the public API - avoid relying on
  // them unless you are aware of the risk.
  // 向外暴露一些内置的工具方法
  // 不要轻易使用这些工具方法，除非你很清楚这些工具方法，以及知道使用的风险
  Vue.util = {
    // 警告日志
    warn,
    // 类似选项合并，将 A 对象的属性复制到 B 对象上 shared/util
    extend,
    // 合并选项
    mergeOptions,
    // 设置响应式，给对象设置 getter、setter，涉及到依赖收集，更新触发依赖通知
    defineReactive
  }

  // Vue.set、Vue.delete、Vue.nextTick
  Vue.set = set
  Vue.delete = del
  Vue.nextTick = nextTick

  // 2.6 explicit observable API
  // 向外暴露为对象设置响应式的方法
  Vue.observable = <T>(obj: T): T => {
    // 为对象设置响应式
    observe(obj)
    return obj
  }
  
  // Vue 全局配置选项
  // Vue.option = { components: {}, directives: {}, filters: {} }
  Vue.options = Object.create(null)
  ASSET_TYPES.forEach(type => {
    Vue.options[type + 's'] = Object.create(null)
  })

  // this is used to identify the "base" constructor to extend all plain-object
  // components with in Weex's multi-instance scenarios.
  // 将 Vue 构造函数赋值给 Vue.options._base
  Vue.options._base = Vue

  // 将 keep-alive 组件放到 Vue.options.component 对象中
  extend(Vue.options.components, builtInComponents)

  // 初始化 Vue.use
  initUse(Vue)
  // Vue.mixins
  initMixin(Vue)
  // Vue.extend
  initExtend(Vue)
  // Vue.Component、directive、filter
  initAssetRegisters(Vue)
}
