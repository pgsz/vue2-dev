/* @flow */

/**
 * 虚拟 DOM：以 JS 的计算性能来换取操作真实 DOM 所消耗的性能
 * 不同类型的节点本质都是 VNode 类的实例,只是实例化时传入的属性参数不同
 * 注释节点
 * 文本节点
 * 元素节点
 * 组件节点
 * 函数式组件节点
 * 克隆节点
*/
export default class VNode {
  tag: string | void;
  data: VNodeData | void;
  children: ?Array<VNode>;
  text: string | void;
  elm: Node | void;
  ns: string | void;
  context: Component | void; // rendered in this component's scope
  key: string | number | void;
  componentOptions: VNodeComponentOptions | void;
  componentInstance: Component | void; // component instance
  parent: VNode | void; // component placeholder node

  // strictly internal
  raw: boolean; // contains raw HTML? (server only)
  isStatic: boolean; // hoisted static node
  isRootInsert: boolean; // necessary for enter transition check
  isComment: boolean; // empty comment placeholder?
  isCloned: boolean; // is a cloned node?
  isOnce: boolean; // is a v-once node?
  asyncFactory: Function | void; // async component factory function
  asyncMeta: Object | void;
  isAsyncPlaceholder: boolean;
  ssrContext: Object | void;
  fnContext: Component | void; // real context vm for functional nodes
  fnOptions: ?ComponentOptions; // for SSR caching
  devtoolsMeta: ?Object; // used to store functional render context for devtools
  fnScopeId: ?string; // functional scope id support

  constructor (
    tag?: string,
    data?: VNodeData,
    children?: ?Array<VNode>,
    text?: string,
    elm?: Node,
    context?: Component,
    componentOptions?: VNodeComponentOptions,
    asyncFactory?: Function
  ) {
    // 当前节点的标签名
    this.tag = tag
    // 当前节点对应的对象，包含了具体的一些数据信息，是一个 VNodeData 类型
    this.data = data
    // 当前节点的子节点，是一个数组
    this.children = children
    // 当前节点的文本
    this.text = text
    // 当前虚拟节点对应的真实 dom 节点
    this.elm = elm
    // 当前节点的名字空间
    this.ns = undefined
    // 当前组件节点对应的 Vue 实例
    this.context = context
    // 函数式组件对应的 Vue 实例
    this.fnContext = undefined
    this.fnOptions = undefined
    this.fnScopeId = undefined
    // 节点的 key 属性，别当作节点的标志，用于优化
    this.key = data && data.key
    // 组件的 option 选项
    this.componentOptions = componentOptions
    // 当前节点对应的组件的实例
    this.componentInstance = undefined
    // 当前节点的父节点
    this.parent = undefined
    // 是否为原生 HTML 或 只是普通文本，innerHTML 的时候为 true，textContent 的时候为 false
    this.raw = false
    // 静态节点标志
    this.isStatic = false
    // 是否作为根节点插入
    this.isRootInsert = true
    // 注释节点标志
    this.isComment = false
    // 克隆节点标志
    this.isCloned = false
    // 是否有 v-once 指令
    this.isOnce = false
    this.asyncFactory = asyncFactory
    this.asyncMeta = undefined
    this.isAsyncPlaceholder = false
  }

  // DEPRECATED: alias for componentInstance for backwards compat.
  /* istanbul ignore next */
  get child (): Component | void {
    return this.componentInstance
  }
}

// 注释节点
export const createEmptyVNode = (text: string = '') => {
  const node = new VNode()
  // 注释的具体信息
  node.text = text
  // 注释节点的标志
  node.isComment = true
  return node
}

// 文本节点
export function createTextVNode (val: string | number) {
  return new VNode(undefined, undefined, undefined, String(val))
}

// optimized shallow clone
// used for static nodes and slot nodes because they may be reused across
// multiple renders, cloning them avoids errors when DOM manipulations rely
// on their elm reference.
// 克隆节点: 把已有节点的属性全部复制到新节点中;先有节点和克隆节点唯一不同: isCloned
export function cloneVNode (vnode: VNode): VNode {
  const cloned = new VNode(
    vnode.tag,
    vnode.data,
    // #7975
    // clone children array to avoid mutating original in case of cloning
    // a child.
    vnode.children && vnode.children.slice(),
    vnode.text,
    vnode.elm,
    vnode.context,
    vnode.componentOptions,
    vnode.asyncFactory
  )
  cloned.ns = vnode.ns
  cloned.isStatic = vnode.isStatic
  cloned.key = vnode.key
  cloned.isComment = vnode.isComment
  cloned.fnContext = vnode.fnContext
  cloned.fnOptions = vnode.fnOptions
  cloned.fnScopeId = vnode.fnScopeId
  cloned.asyncMeta = vnode.asyncMeta
  cloned.isCloned = true
  return cloned
}
