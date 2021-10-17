/* @flow */

import { makeMap, isBuiltInTag, cached, no } from 'shared/util'

let isStaticKey
let isPlatformReservedTag

const genStaticKeysCached = cached(genStaticKeys)

/**
 * Goal of the optimizer: walk the generated template AST tree
 * and detect sub-trees that are purely static, i.e. parts of
 * the DOM that never needs to change.
 *
 * Once we detect these sub-trees, we can:
 *
 * 1. Hoist them into constants, so that we no longer need to
 *    create fresh nodes for them on each re-render;
 * 2. Completely skip them in the patching process.
 */
/**
 * 1：在 AST 中找出所有静态节点并打上标记
 * 2：在 AST 中找出所有静态根节点并打上标记
*/
export function optimize (root: ?ASTElement, options: CompilerOptions) {
  if (!root) return
  // 优化，获取静态 key，比如 staticStyle、staticClass
  isStaticKey = genStaticKeysCached(options.staticKeys || '')
  // 是否是平台保留标签
  isPlatformReservedTag = options.isReservedTag || no
  // first pass: mark all non-static nodes.
  // 标记静态节点
  markStatic(root)
  // second pass: mark static roots.
  // 标记静态根节点
  markStaticRoots(root, false)
}

function genStaticKeys (keys: string): Function {
  return makeMap(
    'type,tag,attrsList,attrsMap,plain,parent,children,attrs,start,end,rawAttrsMap' +
    (keys ? ',' + keys : '')
  )
}

// 标记静态节点，通过 static 属性来标记
function markStatic (node: ASTNode) {
  // 是否为静态节点
  node.static = isStatic(node)
  if (node.type === 1) {
    // do not make component slot content static. this avoids
    // 1. components not able to mutate slot nodes
    // 2. static slot content fails for hot-reloading
    // 不要让 组件槽位内容设置为静态节点，避免
    // 组件无法改变槽位节点
    // 静态槽位内容热加载失败
    if (
      // 非平台保留标签 && 不是 slot 标签 没有 inline-template 属性，直接结束
      !isPlatformReservedTag(node.tag) &&
      node.tag !== 'slot' &&
      node.attrsMap['inline-template'] == null
    ) {
      return
    }
    // 循环判断子节点
    for (let i = 0, l = node.children.length; i < l; i++) {
      const child = node.children[i]
      // 递归判断子节点
      markStatic(child)
      // 从上往下遍历判断，当前节点的子节点有不是静态节点，将当前节点设置为非静态节点
      if (!child.static) {
        node.static = false
      }
    }
    // v-if、v-else-if、v-else 等指令时，子节点只渲染一个，其余没渲染的存在 ifConditions 中
    if (node.ifConditions) {
      for (let i = 1, l = node.ifConditions.length; i < l; i++) {
        // 对 block 属性进行静态标记
        const block = node.ifConditions[i].block
        markStatic(block)
        if (!block.static) {
          node.static = false
        }
      }
    }
  }
}

// 标记静态根节点
// isInFor： 当前节点是否被包裹在 v-for 指令所在的节点内
function markStaticRoots (node: ASTNode, isInFor: boolean) {
  if (node.type === 1) {
    if (node.static || node.once) {
      // 节点是静态 或 节点上有 v-once 指令
      node.staticInFor = isInFor
    }
    // For a node to qualify as a static root, it should have children that
    // are not just static text. Otherwise the cost of hoisting out will
    // outweigh the benefits and it's better off to just always render it fresh.
    // 为了使节点有资格作为静态根节点，它应具有不只是静态文本的子节点。 否则，优化的成本将超过收益，最好始终将其更新。
    // 节点本身是静态节点，拥有子节点，子节点不能只有一个文本节点
    if (node.static && node.children.length && !(
      node.children.length === 1 &&
      node.children[0].type === 3
    )) {
      // 节点是静态节点 && 存在子节点 && 子节点不能只有一个文本节点   标记为静态根节点
      node.staticRoot = true
      return
    } else {
      node.staticRoot = false
    }
    // 递归遍历子节点
    if (node.children) {
      for (let i = 0, l = node.children.length; i < l; i++) {
        markStaticRoots(node.children[i], isInFor || !!node.for)
      }
    }
    // 节点存在 v-if、v-else-if、v-else 时，对 block 做静态根节点标记
    if (node.ifConditions) {
      for (let i = 1, l = node.ifConditions.length; i < l; i++) {
        markStaticRoots(node.ifConditions[i].block, isInFor)
      }
    }
  }
}

// 判断节点是否为静态节点
function isStatic (node: ASTNode): boolean {
  // 包含变量的动态文本节点
  if (node.type === 2) { // expression
    return false
  }
  // 不包含变量的纯文本节点
  if (node.type === 3) { // text
    return true
  }
  // 元素节点
  return !!(
    // 使用 v-pre 指令，断定是静态节点
    node.pre || (
      // 不能动态绑定语法，标签上不能有 v-、@、： 开头的属性
    !node.hasBindings && // no dynamic bindings
    // 不能使用 v-if、v-for、v-else 指令
    !node.if && !node.for && // not v-if or v-for or v-else
    // 不能是内置组件，标签名不能是 slot 和 component
    !isBuiltInTag(node.tag) && // not a built-in
    // 标签名必须是平台保留标签，不能是组件
    isPlatformReservedTag(node.tag) && // not a component
    // 当前节点的父节点不能是带有 v-for 的 template 标签
    !isDirectChildOfTemplateFor(node) &&
    // 节点的所有属性的 key 都必须是静态节点才有的 key； 
    // 只能是 type、tag、attrsList、attrsMap、plain、parent、children、attrs 之一
    Object.keys(node).every(isStaticKey)
  ))
}

function isDirectChildOfTemplateFor (node: ASTElement): boolean {
  while (node.parent) {
    node = node.parent
    if (node.tag !== 'template') {
      return false
    }
    if (node.for) {
      return true
    }
  }
  return false
}
