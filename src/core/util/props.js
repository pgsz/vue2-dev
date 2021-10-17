/* @flow */

import { warn } from './debug'
import { observe, toggleObserving, shouldObserve } from '../observer/index'
import {
  hasOwn,
  isObject,
  toRawType,
  hyphenate,
  capitalize,
  isPlainObject
} from 'shared/util'

type PropOptions = {
  type: Function | Array<Function> | null,
  default: any,
  required: ?boolean,
  validator: ?Function
};

export function validateProp (
  // key: propOptions中的属性名
  key: string,
  // 子组件用户设置的 props 选项
  propOptions: Object,
  // 父组件或用户提供的 props 数据
  propsData: Object,
  vm?: Component
): any {
  // 当前 key 在 propOptions 中对应的值
  const prop = propOptions[key]
  // 当前 key 在用户提供的 props 选项中是否存在，即父组件是否传入该属性
  const absent = !hasOwn(propsData, key)
  // 使用当前 key 在用户提供的 props 数据选项中获取的数据，即父组件对于该属性传入的真实值
  let value = propsData[key]
  // boolean casting
  // 判断是否存在 Boolean 类型
  const booleanIndex = getTypeIndex(Boolean, prop.type)
  if (booleanIndex > -1) {
    // 处理布尔类型的 props
    if (absent && !hasOwn(prop, 'default')) {
      // 不存在即父组件没有传入，没有设置默认值 则置为 false
      value = false
    } else if (value === '' || value === hyphenate(key)) {
      // hyphenate 函数 将 key 进行驼峰转换
      // 都会置为 true
      // <Child name></Child>
      // <Child name="name"></Child>
      // <Child userName="user-name"></Child>
      // only cast empty string / same name to boolean if
      // boolean has higher priority
      const stringIndex = getTypeIndex(String, prop.type)
      // 不存在 String 类型 或 Boolean 类型 优先级高于 String
      if (stringIndex < 0 || booleanIndex < stringIndex) {
        value = true
      }
    }
  }
  // check default value
  // 如果不是 Boolean 类型，只需要判断父组件是否传入该属；没有，则用调用默认值，并将其转成响应式
  // 检查默认值
  if (value === undefined) {
    // 获取 prop 的默认值
    value = getPropDefaultValue(vm, prop, key)
    // since the default value is a fresh copy,
    // make sure to observe it.
    // 默认数据是新的数据，所以需要转成响应式的
    const prevShouldObserve = shouldObserve
    // 决定 observe 被调用时，是否会将 value 转换成响应式的
    toggleObserving(true)
    // 获取默认值转换成响应式的
    observe(value)
    // 恢复成最初的状态
    toggleObserving(prevShouldObserve)
  }
  if (
    process.env.NODE_ENV !== 'production' &&
    // skip validation for weex recycle-list child component props
    !(__WEEX__ && isObject(value) && ('@binding' in value))
  ) {
    // 校验属性值是否与要求的类型匹配
    assertProp(prop, key, value, vm, absent)
  }
  // 返回真实值
  return value
}

/**
 * Get the default value of a prop.
 */
// 子组件 props 选项中的 key 获取其对应的默认值
function getPropDefaultValue (vm: ?Component, prop: PropOptions, key: string): any {
  // no default, return undefined
  if (!hasOwn(prop, 'default')) {
    return undefined
  }
  const def = prop.default
  // warn against non-factory defaults for Object & Array
  // 如果是对象，则抛出警告：对象或数组默认值必须从工厂函数获取
  if (process.env.NODE_ENV !== 'production' && isObject(def)) {
    warn(
      'Invalid default value for prop "' + key + '": ' +
      'Props with type Object/Array must use a factory function ' +
      'to return the default value.',
      vm
    )
  }
  // the raw prop value was also undefined from previous render,
  // return previous default value to avoid unnecessary watcher trigger
  // 父组件没有该属性，但 vm._props 中有该属性
  if (vm && vm.$options.propsData &&
    vm.$options.propsData[key] === undefined &&
    vm._props[key] !== undefined
  ) {
    return vm._props[key]
  }
  // call factory function for non-Function types
  // a value is Function if its prototype is function even across different execution context
  return typeof def === 'function' && getType(prop.type) !== 'Function'
    ? def.call(vm)
    : def
}

/**
 * Assert whether a prop is valid.
 */
// 校验父组件传入真实的值与 prop 选项中 type 类型匹配
function assertProp (
  // prop 选项
  prop: PropOptions,
  // prop 选项中的 key
  name: string,
  // 父组件传入的真实数据
  value: any,
  // 当前实力
  vm: ?Component,
  // 父组件是否传入该属性
  absent: boolean
) {
  if (prop.required && absent) {
    // 先处理必填项 prop数据中没有传
    warn(
      'Missing required prop: "' + name + '"',
      vm
    )
    return
  }
  if (value == null && !prop.required) {
    // 不存在的情况  注意: 使用的 == ;null 或 undefined 都为 true
    return
  }
  // 校验的类型
  let type = prop.type
  // 是否校验成功  没有设置 type 默认为 true
  // type === true :为防止 props:{propA: true} 的情况：一定会校验成功
  let valid = !type || type === true
  // 保存 type 的列表,校验失败,在控制台打印保存的类型警告
  const expectedTypes = []
  if (type) {
    if (!Array.isArray(type)) {
      // 不是数组，转成数组
      type = [type]
    }
    // !valid 重点： type 列表中只要有一个校验成功，循环就结束了
    for (let i = 0; i < type.length && !valid; i++) {
      const assertedType = assertType(value, type[i], vm)
      expectedTypes.push(assertedType.expectedType || '')
      valid = assertedType.valid
    }
  }

  const haveExpectedTypes = expectedTypes.some(t => t)
  if (!valid && haveExpectedTypes) {
    warn(
      getInvalidTypeMessage(name, value, expectedTypes),
      vm
    )
    return
  }
  const validator = prop.validator
  // prop 支持自定义函数，最后自定义验证函数
  if (validator) {
    if (!validator(value)) {
      warn(
        'Invalid prop: custom validator check failed for prop "' + name + '".',
        vm
      )
    }
  }
}

const simpleCheckRE = /^(String|Number|Boolean|Function|Symbol|BigInt)$/

// 校验后返回一个对象  是否校验成功和类型
function assertType (value: any, type: Function, vm: ?Component): {
  valid: boolean;
  expectedType: string;
} {
  let valid
  const expectedType = getType(type)
  if (simpleCheckRE.test(expectedType)) {
    const t = typeof value
    valid = t === expectedType.toLowerCase()
    // for primitive wrapper objects
    if (!valid && t === 'object') {
      valid = value instanceof type
    }
  } else if (expectedType === 'Object') {
    valid = isPlainObject(value)
  } else if (expectedType === 'Array') {
    valid = Array.isArray(value)
  } else {
    try {
      valid = value instanceof type
    } catch (e) {
      warn('Invalid prop type: "' + String(type) + '" is not a constructor', vm);
      valid = false;
    }
  }
  return {
    valid,
    expectedType
  }
}

const functionTypeCheckRE = /^\s*function (\w+)/

/**
 * Use function string name to check built-in types,
 * because a simple equality check will fail when running
 * across different vms / iframes.
 */
function getType (fn) {
  const match = fn && fn.toString().match(functionTypeCheckRE)
  return match ? match[1] : ''
}

function isSameType (a, b) {
  return getType(a) === getType(b)
}

// 获取对应类型的索引
function getTypeIndex (type, expectedTypes): number {
  if (!Array.isArray(expectedTypes)) {
    return isSameType(expectedTypes, type) ? 0 : -1
  }
  for (let i = 0, len = expectedTypes.length; i < len; i++) {
    if (isSameType(expectedTypes[i], type)) {
      return i
    }
  }
  return -1
}

function getInvalidTypeMessage (name, value, expectedTypes) {
  let message = `Invalid prop: type check failed for prop "${name}".` +
    ` Expected ${expectedTypes.map(capitalize).join(', ')}`
  const expectedType = expectedTypes[0]
  const receivedType = toRawType(value)
  // check if we need to specify expected value
  if (
    expectedTypes.length === 1 &&
    isExplicable(expectedType) &&
    isExplicable(typeof value) &&
    !isBoolean(expectedType, receivedType)
  ) {
    message += ` with value ${styleValue(value, expectedType)}`
  }
  message += `, got ${receivedType} `
  // check if we need to specify received value
  if (isExplicable(receivedType)) {
    message += `with value ${styleValue(value, receivedType)}.`
  }
  return message
}

function styleValue (value, type) {
  if (type === 'String') {
    return `"${value}"`
  } else if (type === 'Number') {
    return `${Number(value)}`
  } else {
    return `${value}`
  }
}

const EXPLICABLE_TYPES = ['string', 'number', 'boolean']
function isExplicable (value) {
  return EXPLICABLE_TYPES.some(elem => value.toLowerCase() === elem)
}

function isBoolean (...args) {
  return args.some(elem => elem.toLowerCase() === 'boolean')
}
