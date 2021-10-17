/* @flow */

import { toNumber, toString, looseEqual, looseIndexOf } from 'shared/util'
import { createTextVNode, createEmptyVNode } from 'core/vdom/vnode'
import { renderList } from './render-list'
import { renderSlot } from './render-slot'
import { resolveFilter } from './resolve-filter'
import { checkKeyCodes } from './check-keycodes'
import { bindObjectProps } from './bind-object-props'
import { renderStatic, markOnce } from './render-static'
import { bindObjectListeners } from './bind-object-listeners'
import { resolveScopedSlots } from './resolve-scoped-slots'
import { bindDynamicKeys, prependModifier } from './bind-dynamic-keys'

export function installRenderHelpers (target: any) {
  // _c = $createElement
  // _c(tag, data, children)
  // 处理 v-once 指令
  target._o = markOnce
  // 将值转换为数值，parseFloat 方法实现
  target._n = toNumber
  // 将值转换为字符串，对象 JSON.stringify，原始值： String
  target._s = toString
  // v-for
  target._l = renderList
  // 插槽 slot
  target._t = renderSlot
  // 判断两个值是否相等，类似 ==
  target._q = looseEqual
  // 类似 indexOf
  target._i = looseIndexOf
  // 负责生成静态树 VNode
  target._m = renderStatic
  // 解析过滤器 filter
  target._f = resolveFilter
  target._k = checkKeyCodes
  target._b = bindObjectProps
  // 为文本节点生成 VNode
  target._v = createTextVNode
  // 为空节点生成 VNode
  target._e = createEmptyVNode
  // 作用域插槽
  target._u = resolveScopedSlots
  target._g = bindObjectListeners
  target._d = bindDynamicKeys
  target._p = prependModifier
}
