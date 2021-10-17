/* @flow */

import { genHandlers } from './events'
import baseDirectives from '../directives/index'
import { camelize, no, extend } from 'shared/util'
import { baseWarn, pluckModuleFunction } from '../helpers'
import { emptySlotScopeToken } from '../parser/index'

type TransformFunction = (el: ASTElement, code: string) => string;
type DataGenFunction = (el: ASTElement) => string;
type DirectiveFunction = (el: ASTElement, dir: ASTDirective, warn: Function) => boolean;

export class CodegenState {
  options: CompilerOptions;
  warn: Function;
  transforms: Array<TransformFunction>;
  dataGenFns: Array<DataGenFunction>;
  directives: { [key: string]: DirectiveFunction };
  maybeComponent: (el: ASTElement) => boolean;
  onceId: number;
  staticRenderFns: Array<string>;
  pre: boolean;

  constructor (options: CompilerOptions) {
    this.options = options
    this.warn = options.warn || baseWarn
    this.transforms = pluckModuleFunction(options.modules, 'transformCode')
    this.dataGenFns = pluckModuleFunction(options.modules, 'genData')
    this.directives = extend(extend({}, baseDirectives), options.directives)
    const isReservedTag = options.isReservedTag || no
    this.maybeComponent = (el: ASTElement) => !!el.component || !isReservedTag(el.tag)
    this.onceId = 0
    this.staticRenderFns = []
    this.pre = false
  }
}

export type CodegenResult = {
  render: string,
  staticRenderFns: Array<string>
};

// AST 生成渲染函数
export function generate (
  ast: ASTElement | void,
  // 配置选项
  options: CompilerOptions
): CodegenResult {
  // 实例化 CodegenState 对象，生成代码的时候需要用到其中的一些东西
  const state = new CodegenState(options)
  // fix #11483, Root level <script> tags should not be rendered. 呈现
  // 判断是否为空
  const code = ast ? (ast.tag === 'script' ? 'null' : genElement(ast, state)) : '_c("div")'
  return {
    // 动态节点的渲染函数
    render: `with(this){return ${code}}`,
    // 静态节点渲染函数的数组
    staticRenderFns: state.staticRenderFns
  }
}

// 处理 ast 对象，得到一个可执行函数的 字符串 形式，比如 _c(tag, data, children, normalizationType)
export function genElement (el: ASTElement, state: CodegenState): string {
  if (el.parent) {
    el.pre = el.pre || el.parent.pre
  }

  // 根据当前 AST 元素节点属性的不同从而执行不同的代码生成函数
  if (el.staticRoot && !el.staticProcessed) {
    // _m(idx)
    // idx 是当前静态节点的渲染函数在 staticRenderFns 数据中的下标
    return genStatic(el, state)
  } else if (el.once && !el.onceProcessed) {
    // 处理节点上的 v-once 指令
    return genOnce(el, state)
  } else if (el.for && !el.forProcessed) {
    // 处理节点上的 v-for 指令
    return genFor(el, state)
  } else if (el.if && !el.ifProcessed) {
    // 处理节点上的 v-if 指令 得到一个 三元表达式
    return genIf(el, state)
  } else if (el.tag === 'template' && !el.slotTarget && !state.pre) {
    // 当前节点是 template 标签 && 不是插槽 && 不带 v-pre 指令
    return genChildren(el, state) || 'void 0'
  } else if (el.tag === 'slot') {
    //  处理 slot 标签
    return genSlot(el, state)
  } else {
    // component or element
    // 处理动态组件或普通元素（自定义组件和平台保留标签）
    let code
    if (el.component) {
      // 动态组件
      code = genComponent(el.component, el, state)
    } else {
      // 获取节点属性 data
      let data
      // plain：true 节点没有属性
      if (!el.plain || (el.pre && state.maybeComponent(el))) {
        // 最终是个 JSON 字符串
        data = genData(el, state)
      }

      // 获取子节点列表 children
      const children = el.inlineTemplate ? null : genChildren(el, state, true)
      // _c(tag, data, children, normalizationType)   normalizationType： 节点的规范类型
      code = `_c('${el.tag}'${
        data ? `,${data}` : '' // data
      }${
        children ? `,${children}` : '' // children
      })`
    }
    // module transforms
    //分别为 code 执行 transformNode 方法
    for (let i = 0; i < state.transforms.length; i++) {
      code = state.transforms[i](el, code)
    }
    return code
  }
}

// hoist static sub-trees out
// 处理静态节点，生成静态节点的渲染函数，将其放到 static.staticRenderFns 数组中， 返回 _m(idx)
function genStatic (el: ASTElement, state: CodegenState): string {
  // 标记当前静态节点已经被处理，避免额外的递归
  el.staticProcessed = true
  // Some elements (templates) need to behave differently inside of a v-pre
  // node.  All pre nodes are static roots, so we can use this as a location to
  // wrap a state change and reset it upon exiting the pre node.
  const originalPreState = state.pre
  if (el.pre) {
    state.pre = el.pre
  }
  // 调用 genElement 方法得到静态节点渲染函数，将其 push到 staticRenderFns 数组中，包装成 'with(this){return _c(xxx)}'
  state.staticRenderFns.push(`with(this){return ${genElement(el, state)}}`)
  state.pre = originalPreState
  // 返回可执行函数，_m(idx, true or '')
  // idx: 当前静态节点的渲染函数在 staticRenderFns 数组的下标
  return `_m(${
    state.staticRenderFns.length - 1
  }${
    el.staticInFor ? ',true' : ''
  })`
}

// v-once
/**
 * 处理带有 v-once 指令的节点：
 *  1： 当前节点存在 v-if 指令，得到 三元表达式： exp ? render1 : render2
 *  2： 当前节点包含在 v-for 指令的内部， 得到 _o(_c(tag, data, children), number, key)
 *  3： 当前节点是 v-once 节点， 得到 _m(idx, true or '')
*/
function genOnce (el: ASTElement, state: CodegenState): string {
  el.onceProcessed = true
  // 如果存在 v-if 指令 && 没处理
  if (el.if && !el.ifProcessed) {
    return genIf(el, state)
  } else if (el.staticInFor) {
    // 当前节点被包裹在 v-for 指令
    let key = ''
    let parent = el.parent
    while (parent) {
      if (parent.for) {
        key = parent.key
        break
      }
      parent = parent.parent
    }
    if (!key) {
      process.env.NODE_ENV !== 'production' && state.warn(
        `v-once can only be used inside v-for that is keyed. `,
        el.rawAttrsMap['v-once']
      )
      return genElement(el, state)
    }
    // 返回结果 _o(_c(xxx), number, key)
    return `_o(${genElement(el, state)},${state.onceId++},${key})`
  } else {
    // 按静态节点方式处理
    return genStatic(el, state)
  }
}

// 处理 v-if 指令，最终得到一个 三元表达式
export function genIf (
  el: any,
  state: CodegenState,
  altGen?: Function,
  altEmpty?: string
): string {
  el.ifProcessed = true // avoid recursion
  return genIfConditions(el.ifConditions.slice(), state, altGen, altEmpty)
}

function genIfConditions (
  conditions: ASTIfConditions,
  state: CodegenState,
  altGen?: Function,
  altEmpty?: string
): string {
  // 空数组时 会渲染一个 _e() 空节点
  if (!conditions.length) {
    return altEmpty || '_e()'
  }

  // 取出第一个
  const condition = conditions.shift()
  if (condition.exp) {
    // 最终返回的是一个 三元表达式： exp ? render1 : render2
    return `(${condition.exp})?${
      genTernaryExp(condition.block)
    }:${
      genIfConditions(conditions, state, altGen, altEmpty)
    }`
  } else {
    return `${genTernaryExp(condition.block)}`
  }

  // v-if with v-once should generate code like (a)?_m(0):_m(1)
  function genTernaryExp (el) {
    return altGen
      ? altGen(el, state)
      : el.once
        ? genOnce(el, state)
        : genElement(el, state)
  }
}

// 处理 v-for 指令 _l(exp, function(alias, iterator1, iterator2) { return _c(xxx) })
export function genFor (
  el: any,
  state: CodegenState,
  altGen?: Function,
  altHelper?: string
): string {
  // v-for = "(item, index) in arr"
  // exp = arr
  const exp = el.for
  // alias = item
  const alias = el.alias
  // index
  const iterator1 = el.iterator1 ? `,${el.iterator1}` : ''
  const iterator2 = el.iterator2 ? `,${el.iterator2}` : ''

  // 提示 v-for 指令时 组件需要 key
  if (process.env.NODE_ENV !== 'production' &&
    state.maybeComponent(el) &&
    el.tag !== 'slot' &&
    el.tag !== 'template' &&
    !el.key
  ) {
    state.warn(
      `<${el.tag} v-for="${alias} in ${exp}">: component lists rendered with ` +
      `v-for should have explicit keys. ` +
      `See https://vuejs.org/guide/list.html#key for more info.`,
      el.rawAttrsMap['v-for'],
      true /* tip */
    )
  }

  // 标记 已处理
  el.forProcessed = true // avoid recursion
  // v-for 指令的处理结果 得到 _l(exp, function(alias, iterator1, iterator2) return{ _c(tag, data, children) ]})
  return `${altHelper || '_l'}((${exp}),` +
    `function(${alias}${iterator1}${iterator2}){` +
      `return ${(altGen || genElement)(el, state)}` +
    '})'
}

// 处理节点上的所有属性，得到一个 JSON 字符串
export function genData (el: ASTElement, state: CodegenState): string {
  // 节点属性组成的 JSON 字符串
  let data = '{'

  // directives first.
  // directives may mutate the el's other properties before they are generated.
  // 指令可以对 el 其他属性被生成之前改变它们
  const dirs = genDirectives(el, state)
  if (dirs) data += dirs + ','

  // key
  // data = { key: xxx }
  if (el.key) {
    data += `key:${el.key},`
  }
  // ref
  // data = { ref: xxx }
  if (el.ref) {
    data += `ref:${el.ref},`
  }
  // 带有 ref 指令 属性的节点，如果被包含在 v-for 指令节点内部 data = { refInFor: true }
  if (el.refInFor) {
    data += `refInFor:true,`
  }
  // pre
  // v-pre 指令， data = { pre: true }
  if (el.pre) {
    data += `pre:true,`
  }
  // record original tag name for components using "is" attribute
  // 动态组件 data = { tag: component }
  if (el.component) {
    data += `tag:"${el.tag}",`
  }
  // module data generation functions
  // 执行模块 { class、style } 的 genData 方法，处理节点上的 style 和 class 
  // 最终得到 data = { staticClass: xx, class: xx, staticStyle: xx, style: xx }
  for (let i = 0; i < state.dataGenFns.length; i++) {
    data += state.dataGenFns[i](el)
  }
  // attributes
  // 处理属性
  if (el.attrs) {
    data += `attrs:${genProps(el.attrs)},`
  }
  // DOM props
  if (el.props) {
    data += `domProps:${genProps(el.props)},`
  }
  // event handlers
  // 处理不带 native 事件
  if (el.events) {
    data += `${genHandlers(el.events, false)},`
  }
  // 处理带有 native 事件
  if (el.nativeEvents) {
    data += `${genHandlers(el.nativeEvents, true)},`
  }
  // slot target
  // only for non-scoped slots
  // 处理非作用域插槽
  if (el.slotTarget && !el.slotScope) {
    data += `slot:${el.slotTarget},`
  }
  // scoped slots
  // 处理作用域插槽  data = { scopedSlots: _u:(xx) }
  if (el.scopedSlots) {
    data += `${genScopedSlots(el, el.scopedSlots, state)},`
  }
  // component v-model
  // 处理带有 v-model 指令的组件  data = { model: value, callback, expression }
  if (el.model) {
    data += `model:{value:${
      el.model.value
    },callback:${
      el.model.callback
    },expression:${
      el.model.expression
    }},`
  }
  // inline-template
  // 处理内联模板
  if (el.inlineTemplate) {
    const inlineTemplate = genInlineTemplate(el, state)
    if (inlineTemplate) {
      data += `${inlineTemplate},`
    }
  }
  data = data.replace(/,$/, '') + '}'
  // v-bind dynamic argument wrap
  // v-bind with dynamic arguments must be applied using the same v-bind object
  // merge helper so that class/style/mustUseProp attrs are handled correctly.
  if (el.dynamicAttrs) {
    // 存在动态属性 data = '_b(data, tag, 静态属性 或 _d(静态属性， 动态属性))'
    data = `_b(${data},"${el.tag}",${genProps(el.dynamicAttrs)})`
  }
  // v-bind data wrap
  if (el.wrapData) {
    data = el.wrapData(data)
  }
  // v-on data wrap
  if (el.wrapListeners) {
    data = el.wrapListeners(data)
  }
  return data
}

// 编译指令，如果指令存在运行时任务，则 return 指令信息出去
function genDirectives (el: ASTElement, state: CodegenState): string | void {
  // 所有指令
  const dirs = el.directives
  if (!dirs) return
  // 最终处理返回的结果
  let res = 'directives:['
  // 标记当前指令是否存在运行时的任务
  let hasRuntime = false
  let i, l, dir, needRuntime
  for (i = 0, l = dirs.length; i < l; i++) {
    dir = dirs[i]
    needRuntime = true
    // 获取当前指令的处理方法，比如 web 平台的 v-html、v-text、v-model
    const gen: DirectiveFunction = state.directives[dir.name]
    if (gen) {
      // compile-time directive that manipulates AST.
      // returns true if it also needs a runtime counterpart.
      // 执行 gen 方法，编译当前指令，比如 v-text、v-model
      // 返回结果为 Boolean，标记当前指令是否存在运行时的任务
      needRuntime = !!gen(el, dir, state.warn)
    }
    if (needRuntime) {
      // 该指令在运行时还有任务
      // res = directives: [{name, rawName, value, expression, arg, modifiers},...]
      hasRuntime = true
      res += `{name:"${dir.name}",rawName:"${dir.rawName}"${
        dir.value ? `,value:(${dir.value}),expression:${JSON.stringify(dir.value)}` : ''
      }${
        dir.arg ? `,arg:${dir.isDynamicArg ? dir.arg : `"${dir.arg}"`}` : ''
      }${
        dir.modifiers ? `,modifiers:${JSON.stringify(dir.modifiers)}` : ''
      }},`
    }
  }
  if (hasRuntime) {
    // 指令存在运行时任务时，才会返回 res
    return res.slice(0, -1) + ']'
  }
}

function genInlineTemplate (el: ASTElement, state: CodegenState): ?string {
  const ast = el.children[0]
  if (process.env.NODE_ENV !== 'production' && (
    el.children.length !== 1 || ast.type !== 1
  )) {
    state.warn(
      'Inline-template components must have exactly one child element.',
      { start: el.start }
    )
  }
  if (ast && ast.type === 1) {
    const inlineRenderFns = generate(ast, state.options)
    return `inlineTemplate:{render:function(){${
      inlineRenderFns.render
    }},staticRenderFns:[${
      inlineRenderFns.staticRenderFns.map(code => `function(){${code}}`).join(',')
    }]}`
  }
}

function genScopedSlots (
  el: ASTElement,
  slots: { [key: string]: ASTElement },
  state: CodegenState
): string {
  // by default scoped slots are considered "stable", this allows child
  // components with only scoped slots to skip forced updates from parent.
  // but in some cases we have to bail-out of this optimization
  // for example if the slot contains dynamic names, has v-if or v-for on them...
  let needsForceUpdate = el.for || Object.keys(slots).some(key => {
    const slot = slots[key]
    return (
      slot.slotTargetDynamic ||
      slot.if ||
      slot.for ||
      containsSlotChild(slot) // is passing down slot from parent which may be dynamic
    )
  })

  // #9534: if a component with scoped slots is inside a conditional branch,
  // it's possible for the same component to be reused but with different
  // compiled slot content. To avoid that, we generate a unique key based on
  // the generated code of all the slot contents.
  let needsKey = !!el.if

  // OR when it is inside another scoped slot or v-for (the reactivity may be
  // disconnected due to the intermediate scope variable)
  // #9438, #9506
  // TODO: this can be further optimized by properly analyzing in-scope bindings
  // and skip force updating ones that do not actually use scope variables.
  if (!needsForceUpdate) {
    let parent = el.parent
    while (parent) {
      if (
        (parent.slotScope && parent.slotScope !== emptySlotScopeToken) ||
        parent.for
      ) {
        needsForceUpdate = true
        break
      }
      if (parent.if) {
        needsKey = true
      }
      parent = parent.parent
    }
  }

  const generatedSlots = Object.keys(slots)
    .map(key => genScopedSlot(slots[key], state))
    .join(',')

  return `scopedSlots:_u([${generatedSlots}]${
    needsForceUpdate ? `,null,true` : ``
  }${
    !needsForceUpdate && needsKey ? `,null,false,${hash(generatedSlots)}` : ``
  })`
}

function hash(str) {
  let hash = 5381
  let i = str.length
  while(i) {
    hash = (hash * 33) ^ str.charCodeAt(--i)
  }
  return hash >>> 0
}

function containsSlotChild (el: ASTNode): boolean {
  if (el.type === 1) {
    if (el.tag === 'slot') {
      return true
    }
    return el.children.some(containsSlotChild)
  }
  return false
}

function genScopedSlot (
  el: ASTElement,
  state: CodegenState
): string {
  const isLegacySyntax = el.attrsMap['slot-scope']
  if (el.if && !el.ifProcessed && !isLegacySyntax) {
    return genIf(el, state, genScopedSlot, `null`)
  }
  if (el.for && !el.forProcessed) {
    return genFor(el, state, genScopedSlot)
  }
  const slotScope = el.slotScope === emptySlotScopeToken
    ? ``
    : String(el.slotScope)
  const fn = `function(${slotScope}){` +
    `return ${el.tag === 'template'
      ? el.if && isLegacySyntax
        ? `(${el.if})?${genChildren(el, state) || 'undefined'}:undefined`
        : genChildren(el, state) || 'undefined'
      : genElement(el, state)
    }}`
  // reverse proxy v-slot without scope on this.$slots
  const reverseProxy = slotScope ? `` : `,proxy:true`
  return `{key:${el.slotTarget || `"default"`},fn:${fn}${reverseProxy}}`
}

// 遍历 AST 的 children 属性中的元素，根据元素属性的不同生成不同的 VNode 创建函数调用字符串
export function genChildren (
  el: ASTElement,
  state: CodegenState,
  checkSkip?: boolean,
  altGenElement?: Function,
  altGenNode?: Function
): string | void {
  // 拿到当前节点的所有子节点
  const children = el.children
  if (children.length) {
    const el: any = children[0]
    // optimize single v-for
    // 优化 v-for
    if (children.length === 1 &&
      el.for &&
      el.tag !== 'template' &&
      el.tag !== 'slot'
    ) {
      // 只有一个子节点 && 子节点有 v-for 指令 && 节点标签名不是 template 或 slot
      const normalizationType = checkSkip
        ? state.maybeComponent(el) ? `,1` : `,0`
        : ``
        // 直接调用 genElement 方法得到结果，不需要调用 genNode
      return `${(altGenElement || genElement)(el, state)}${normalizationType}`
    }
    // 得到节点规范化类型， 结果为 0、1、2
    const normalizationType = checkSkip
      ? getNormalizationType(children, state.maybeComponent)
      : 0
      // 生成代码的函数
    const gen = altGenNode || genNode
    // 返回一个数组，数组的每个元素都是一个子节点的渲染函数
    return `[${children.map(c => gen(c, state)).join(',')}]${
      normalizationType ? `,${normalizationType}` : ''
    }`
  }
}

// determine the normalization needed for the children array.
// 0: no normalization needed
// 1: simple normalization needed (possible 1-level deep nested array)
// 2: full normalization needed
function getNormalizationType (
  children: Array<ASTNode>,
  maybeComponent: (el: ASTElement) => boolean
): number {
  let res = 0
  for (let i = 0; i < children.length; i++) {
    const el: ASTNode = children[i]
    if (el.type !== 1) {
      continue
    }
    if (needsNormalization(el) ||
        (el.ifConditions && el.ifConditions.some(c => needsNormalization(c.block)))) {
      res = 2
      break
    }
    if (maybeComponent(el) ||
        (el.ifConditions && el.ifConditions.some(c => maybeComponent(c.block)))) {
      res = 1
    }
  }
  return res
}

function needsNormalization (el: ASTElement): boolean {
  return el.for !== undefined || el.tag === 'template' || el.tag === 'slot'
}

// 根据不同的节点类型
function genNode (node: ASTNode, state: CodegenState): string {
  if (node.type === 1) {
    return genElement(node, state)
  } else if (node.type === 3 && node.isComment) {
    return genComment(node)
  } else {
    return genText(node)
  }
}

// 文本节点
export function genText (text: ASTText | ASTExpression): string {
  return `_v(${text.type === 2
    // 动态文本
    ? text.expression // no need for () because already wrapped in _s()
    // 静态文本
    : transformSpecialNewlines(JSON.stringify(text.text))
  })`
}

// 注释节点
export function genComment (comment: ASTText): string {
  return `_e(${JSON.stringify(comment.text)})`
}

// 生成插槽的渲染函数，得到 _t(slotName, children, attrs, bind)
function genSlot (el: ASTElement, state: CodegenState): string {
  // 获取插槽名
  const slotName = el.slotName || '"default"'
  // 获取所有的子节点
  const children = genChildren(el, state)
  // 结果 res = '_t(slotName, children, attrs, bind)'
  let res = `_t(${slotName}${children ? `,function(){return ${children}}` : ''}`
  const attrs = el.attrs || el.dynamicAttrs
    ? genProps((el.attrs || []).concat(el.dynamicAttrs || []).map(attr => ({
        // slot props are camelized
        name: camelize(attr.name),
        value: attr.value,
        dynamic: attr.dynamic
      })))
    : null
  const bind = el.attrsMap['v-bind']
  if ((attrs || bind) && !children) {
    res += `,null`
  }
  if (attrs) {
    res += `,${attrs}`
  }
  if (bind) {
    res += `${attrs ? '' : ',null'},${bind}`
  }
  return res + ')'
}

// componentName is el.component, take it as argument to shun flow's pessimistic refinement
// 处理动态组件，得到 _c(componentName, data, children)
function genComponent (
  componentName: string,
  el: ASTElement,
  state: CodegenState
): string {
  // 生成所有子节点渲染函数
  const children = el.inlineTemplate ? null : genChildren(el, state, true)
  // _c(componentName, data, children)
  return `_c(${componentName},${genData(el, state)}${
    children ? `,${children}` : ''
  })`
}

/**
 * 遍历属性数组 props，得到所有属性组成的字符串
 * 动态： _d(静态属性，动态属性)
 * 静态： 'attrName, attrValue'
*/
function genProps (props: Array<ASTAttr>): string {
  // 静态属性
  let staticProps = ``
  // 动态属性
  let dynamicProps = ``
  for (let i = 0; i < props.length; i++) {
    const prop = props[i]
    const value = __WEEX__
      ? generateValue(prop.value)
      : transformSpecialNewlines(prop.value)
    if (prop.dynamic) {
      // 动态属性
      dynamicProps += `${prop.name},${value},`
    } else {
      staticProps += `"${prop.name}":${value},`
    }
  }
  // 去掉属性最后的逗号
  staticProps = `{${staticProps.slice(0, -1)}}`
  if (dynamicProps) {
    // 动态属性 _d(staticProps, [])
    return `_d(${staticProps},[${dynamicProps.slice(0, -1)}])`
  } else {
    return staticProps
  }
}

/* istanbul ignore next */
function generateValue (value) {
  if (typeof value === 'string') {
    return transformSpecialNewlines(value)
  }
  return JSON.stringify(value)
}

// #3895, #4268
function transformSpecialNewlines (text: string): string {
  return text
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}
