/* @flow */

import { identity, resolveAsset } from 'core/util/index'

/**
 * Runtime helper for resolving filters
 * 
 * 用于解析过滤器
 * 
 * 第一个参数永远是 表达式的值，或者前一个过滤器处理后的结果
 */
export function resolveFilter (id: string): Function {
  return resolveAsset(this.$options, 'filters', id, true) || identity
}
