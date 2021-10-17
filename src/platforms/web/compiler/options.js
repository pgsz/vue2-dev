/* @flow */

import {
  isPreTag,
  mustUseProp,
  isReservedTag,
  getTagNamespace
} from '../util/index'

import modules from './modules/index'
import directives from './directives/index'
import { genStaticKeys } from 'shared/util'
import { isUnaryTag, canBeLeftOpenTag } from './util'

export const baseOptions: CompilerOptions = {
  expectHTML: true,
  // class、style、v-model(input)
  modules,
  // 指令
  directives,
  // pre 标签
  isPreTag,
  // 是否为 一元标签/自闭合标签
  isUnaryTag,
  // 规定了一些应该使用 props 进行绑定的属性
  mustUseProp,
  // 只有开始标签的属性，结束标签浏览器会自动补全
  canBeLeftOpenTag,
  // 保留标签 （html + svg）
  isReservedTag,
  // 获取标签的命名空间
  getTagNamespace,
  // 静态 key
  staticKeys: genStaticKeys(modules)
}
