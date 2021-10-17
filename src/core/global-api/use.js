/* @flow */

import { toArray } from '../util/index'

/**
 * 定义 Vue.use 负责为 Vue 安装插件：
 *   1：判断插件是否已经安装，判重
 *   2：安装插件，执行插件的 install 方法
*/
export function initUse (Vue: GlobalAPI) {
  // Vue.use(plugin)
  // 本质： 执行插件暴露出来的 install 方法，开始的时候判重，防止重复注册
  Vue.use = function (plugin: Function | Object) {
    // 已经安装过的创建列表
    const installedPlugins = (this._installedPlugins || (this._installedPlugins = []))
    // 确保不会重复注册同一组件
    if (installedPlugins.indexOf(plugin) > -1) {
      return this
    }

    // additional parameters
    // install(Vue)
    // 将 Vue 构造函数放到第一个参数位置，将参数传递给 install 方法
    const args = toArray(arguments, 1)
    args.unshift(this)
    if (typeof plugin.install === 'function') {
      // plugin 是对象，执行 install 方法安装插件
      plugin.install.apply(plugin, args)
    } else if (typeof plugin === 'function') {
      // plugin 是函数，直接执行
      plugin.apply(null, args)
    }
    // plugin 放入已安装的插件数组中，防止重复安装
    installedPlugins.push(plugin)
    return this
  }
}
