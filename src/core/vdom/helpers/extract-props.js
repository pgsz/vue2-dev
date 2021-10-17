/* @flow */

import {
  tip,
  hasOwn,
  isDef,
  isUndef,
  hyphenate,
  formatComponentName
} from 'core/util/index'

/**
 * 提取 props，得到 res[key] = val
 * 以 props 配置中的属性为 key，父组件中对应的数据为 value
 * 当父组件中数据更新时，触发响应式更新，更新执行 render，生成 VNode，就会有一次走到这里
 * 这样 子组件中响应的数据会被更新
*/
export function extractPropsFromVNodeData (
  // 属性对象
  data: VNodeData,
  // 构造函数
  Ctor: Class<Component>,
  // 标签
  tag?: string
): ?Object {
  // we are only extracting raw values here.
  // validation and default values are handled in the child
  // component itself.
  // 从构造函数拿到 props 配置项
  const propOptions = Ctor.options.props
  if (isUndef(propOptions)) {
    return
  }
  // 处理 props 配置项
  // res[propKey] = data.xx.key
  const res = {}
  const { attrs, props } = data
  if (isDef(attrs) || isDef(props)) {
    // 遍历 props 配置项
    for (const key in propOptions) {
      const altKey = hyphenate(key)
      if (process.env.NODE_ENV !== 'production') {
        const keyInLowerCase = key.toLowerCase()
        if (
          key !== keyInLowerCase &&
          attrs && hasOwn(attrs, keyInLowerCase)
        ) {
          // props 属性定义的时候 使用小驼峰如:testProp，在使用的时候需要 <div text-prop="xxx"></div>
          tip(
            `Prop "${keyInLowerCase}" is passed to component ` +
            `${formatComponentName(tag || Ctor)}, but the declared prop name is` +
            ` "${key}". ` +
            `Note that HTML attributes are case-insensitive and camelCased ` +
            `props need to use their kebab-case equivalents when using in-DOM ` +
            `templates. You should probably use "${altKey}" instead of "${key}".`
          )
        }
      }
      // 从组件的属性对象上获取组件 props 指定属性的值
      checkProp(res, props, key, altKey, true) ||
      checkProp(res, attrs, key, altKey, false)
    }
  }
  return res
}

function checkProp (
  res: Object,
  hash: ?Object,
  key: string,
  altKey: string,
  preserve: boolean
): boolean {
  if (isDef(hash)) {
    if (hasOwn(hash, key)) {
      res[key] = hash[key]
      if (!preserve) {
        delete hash[key]
      }
      return true
    } else if (hasOwn(hash, altKey)) {
      res[key] = hash[altKey]
      if (!preserve) {
        delete hash[altKey]
      }
      return true
    }
  }
  return false
}
