/* @flow */

/**
 * Runtime helper for rendering static trees.
 * 运行时负责生成静态树的 VNode 的帮助程序
 * _m(idx, true or '')
 * 1：执行 staticRenderFns 数组中指定下标的渲染函数，生成 VNode 并缓存
 * 2：为静态树的 VNode 打静态标记
 */
export function renderStatic (
  index: number,
  isInFor: boolean
): VNode | Array<VNode> {
  // 缓存
  const cached = this._staticTrees || (this._staticTrees = [])
  let tree = cached[index]
  // if has already-rendered static tree and not inside v-for,
  // we can reuse the same tree.
  // 当前静态树已被渲染且没有包裹在 v-for 指令，则直接返回 缓存的 VNode
  if (tree && !isInFor) {
    return tree
  }
  // otherwise, render a fresh tree.
  tree = cached[index] = this.$options.staticRenderFns[index].call(
    this._renderProxy,
    null,
    this // for render fns generated for functional component templates
  )
  // 对 VNode 做静态标记
  markStatic(tree, `__static__${index}`, false)
  return tree
}

/**
 * Runtime helper for v-once.
 * Effectively it means marking the node as static with a unique key.
 */
export function markOnce (
  tree: VNode | Array<VNode>,
  index: number,
  key: string
) {
  markStatic(tree, `__once__${index}${key ? `_${key}` : ``}`, true)
  return tree
}

function markStatic (
  tree: VNode | Array<VNode>,
  key: string,
  isOnce: boolean
) {
  if (Array.isArray(tree)) {
    // tree 为 VNode 数组，循环遍历其中的每个 VNode，为其做静态标记
    for (let i = 0; i < tree.length; i++) {
      if (tree[i] && typeof tree[i] !== 'string') {
        markStaticNode(tree[i], `${key}_${i}`, isOnce)
      }
    }
  } else {
    markStaticNode(tree, key, isOnce)
  }
}

// 标记静态 VNode
function markStaticNode (node, key, isOnce) {
  node.isStatic = true
  node.key = key
  node.isOnce = isOnce
}
