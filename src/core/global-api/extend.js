/* @flow */

import { ASSET_TYPES } from 'shared/constants'
import { defineComputed, proxy } from '../instance/state'
import { extend, mergeOptions, validateComponentName } from '../util/index'

// 定义 Vue.extend 方法
export function initExtend (Vue: GlobalAPI) {
  /**
   * Each instance constructor, including Vue, has a unique
   * cid. This enables us to create wrapped "child
   * constructors" for prototypal inheritance and cache them.
   */
  Vue.cid = 0
  let cid = 1

  /**
   * Class inheritance
   * 基于 Vue 去扩展子类，该子类同样支持进一步的扩展
   * 扩展时可以传递一些默认配置
   * 默认配置如果和基类有冲突会进行选项合并
   */
  Vue.extend = function (extendOptions: Object): Function {
    // 用户传入的一个包含组件选项的对象参数
    extendOptions = extendOptions || {}
    // 指向父类，即基础 Vue 类
    const Super = this
    // 父类的 cid 属性
    const SuperId = Super.cid
    // 利用缓存，如果存在则返回缓存中的构造函数
    // 用同一个配置项，多次调用 Vue.extend 方法时，第二次调用开始就会使用缓存
    const cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {})
    if (cachedCtors[SuperId]) {
      return cachedCtors[SuperId]
    }

    // 验证组件名称
    const name = extendOptions.name || Super.options.name
    if (process.env.NODE_ENV !== 'production' && name) {
      validateComponentName(name)
    }

    // 定义一个 Vue 子类，和 Vue 构造函数一样
    // function Vue(options){
    //   this._init(options)
    // }
    const Sub = function VueComponent (options) {
      // 初始化
      this._init(options)
    }
    // 设置子类的原型对象，通过原型链继承的方式继承 Vue
    Sub.prototype = Object.create(Super.prototype)
    // 设置构造函数
    Sub.prototype.constructor = Sub
    Sub.cid = cid++
    // 合并基类选项和传递进来的选项
    // 可以通过 Vue.extend 方法定义一个子类，预设一些配置项，这些配置项相当于直接使用 Vue 构造函数时的 默认配置一样
    Sub.options = mergeOptions(
      Super.options,
      extendOptions
    )
    // 记录自己的基类，即将父类保存到子类的 super 属性中，以确保在子类中能拿到父类
    Sub['super'] = Super

    // For props and computed properties, we define the proxy getters on
    // the Vue instances at extension time, on the extended prototype. This
    // avoids Object.defineProperty calls for each instance created.
    // 将 props、computed 代理到子类上，在子类支持通过 this.xx 的方式访问
    if (Sub.options.props) {
      initProps(Sub)
    }
    if (Sub.options.computed) {
      initComputed(Sub)
    }

    // allow further extension/mixin/plugin usage
    // 定义 extend、mixin、use 三个静态方法，让子类支持继续向下扩展
    Sub.extend = Super.extend
    Sub.mixin = Super.mixin
    Sub.use = Super.use

    // create asset registers, so extended classes
    // can have their private assets too.
    // 定义 component directive filter 三个静态方法
    ASSET_TYPES.forEach(function (type) {
      Sub[type] = Super[type]
    })
    // enable recursive self-lookup
    // 组件递归自调用 的实现原理
    // 如果组件设置了 name 属性，则将自己注册到自己的 components 选项中
    if (name) {
      // {
      //   name: 'Comp',
      //   components: { 'Comp': 'Comp' }
      // }
      Sub.options.components[name] = Sub
    }

    // keep a reference to the super options at extension time.
    // later at instantiation we can check if Super's options have
    // been updated.
    // 在扩展时保留对基类选项的引用
    Sub.superOptions = Super.options
    Sub.extendOptions = extendOptions
    Sub.sealedOptions = extend({}, Sub.options)

    // cache constructor
    // 缓存
    cachedCtors[SuperId] = Sub
    return Sub
  }
}

function initProps (Comp) {
  const props = Comp.options.props
  for (const key in props) {
    proxy(Comp.prototype, `_props`, key)
  }
}

function initComputed (Comp) {
  const computed = Comp.options.computed
  for (const key in computed) {
    defineComputed(Comp.prototype, key, computed[key])
  }
}
