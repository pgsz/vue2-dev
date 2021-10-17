/* @flow */

import { ASSET_TYPES } from 'shared/constants'
import { isPlainObject, validateComponentName } from '../util/index'

export function initAssetRegisters (Vue: GlobalAPI) {
  /**
   * Create asset registration methods.
   * 初始化 Vue.component、Vue.directive、Vue.filter
   */
  ASSET_TYPES.forEach(type => {
    // 以 component 为例
    // 定义 Vue.component = function () { xx }
    Vue[type] = function (
      id: string,
      definition: Function | Object
    ): Function | Object | void {
      if (!definition) {
        return this.options[type + 's'][id]
      } else {
        /* istanbul ignore if */
        if (process.env.NODE_ENV !== 'production' && type === 'component') {
          // 检验 name 值是否合法
          validateComponentName(id)
        }
        if (type === 'component' && isPlainObject(definition)) {
          // 设置组件名称，有 name 则使用 name，否则就是 id
          definition.name = definition.name || id
          // Vue.extend 方法、基于 definition 去扩展一个新的组件子类，直接 new Definition() 实例化一个组件
          definition = this.options._base.extend(definition)
        }
        if (type === 'directive' && typeof definition === 'function') {
          // 如果是函数，默认监听 bind 和 update 两个事件
          definition = { bind: definition, update: definition }
        }
        // this.options[components] = { CompName: definition }
        // 在实例化时通过 mergeOptions 将全局注册的组件合并到每个组件的配置对象的 components 中
        this.options[type + 's'][id] = definition
        return definition
      }
    }
  })
}
