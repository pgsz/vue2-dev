/* @flow */

import { emptyNode } from 'core/vdom/patch'
import { resolveAsset, handleError } from 'core/util/index'
import { mergeVNodeHook } from 'core/vdom/helpers/index'

export default {
  create: updateDirectives,
  update: updateDirectives,
  destroy: function unbindDirectives (vnode: VNodeWithData) {
    updateDirectives(vnode, emptyNode)
  }
}

// 新旧 VNode 中有一方涉及到了指令
// 让指令生效，就是在合适的时机执行定义指令时所设置的钩子函数
function updateDirectives (oldVnode: VNodeWithData, vnode: VNodeWithData) {
  if (oldVnode.data.directives || vnode.data.directives) {
    _update(oldVnode, vnode)
  }
}

function _update (oldVnode, vnode) {
  // 判断当前节点 VNode 对应的旧节点是不是一个空节点；如果是，表示当前节点是一个新创建的节点
  const isCreate = oldVnode === emptyNode
  // 判断当前节点 VNode 是不是空节点；如果是，表示当前节点对应的旧节点将要被销毁
  const isDestroy = vnode === emptyNode
  // 旧的指令集合
  const oldDirs = normalizeDirectives(oldVnode.data.directives, oldVnode.context)
  // 新的指令集合
  const newDirs = normalizeDirectives(vnode.data.directives, vnode.context)

  // 保存需要触发 inserted 指令钩子函数的指令列表 
  const dirsWithInsert = []
  // 保存需要触发 componentUpdated 指令钩子函数的指令列表 
  const dirsWithPostpatch = []

  let key, oldDir, dir
  for (key in newDirs) {
    oldDir = oldDirs[key]
    dir = newDirs[key]
    // 判断当前的指令名 key 在旧的指令列表中是否存在；不存在，首次绑定到元素上的新指令
    if (!oldDir) {
      // new directive, bind
      // 触发指令中的 bind 钩子函数
      callHook(dir, 'bind', vnode, oldVnode)
      // 如果定义 inserted 时的钩子函数
      if (dir.def && dir.def.inserted) {
        // 添加到 dirsWithInsert 中
        dirsWithInsert.push(dir)
      }
    } else {
      // existing directive, update
      // 保存上一次指令的 value 和 arg 属性值
      dir.oldValue = oldDir.value
      dir.oldArg = oldDir.arg
      // 触发指令中的 update 钩子函数
      callHook(dir, 'update', vnode, oldVnode)
      if (dir.def && dir.def.componentUpdated) {
        dirsWithPostpatch.push(dir)
      }
    }
  }

  if (dirsWithInsert.length) {
    const callInsert = () => {
      for (let i = 0; i < dirsWithInsert.length; i++) {
        // 循环执行 inserted 钩子函数
        callHook(dirsWithInsert[i], 'inserted', vnode, oldVnode)
      }
    }
    if (isCreate) {
      mergeVNodeHook(vnode, 'insert', callInsert)
    } else {
      callInsert()
    }
  }

  if (dirsWithPostpatch.length) {
    mergeVNodeHook(vnode, 'postpatch', () => {
      for (let i = 0; i < dirsWithPostpatch.length; i++) {
        callHook(dirsWithPostpatch[i], 'componentUpdated', vnode, oldVnode)
      }
    })
  }

  if (!isCreate) {
    for (key in oldDirs) {
      // 旧的指令列表有，新的指令列表没有，该指令是被废弃的
      if (!newDirs[key]) {
        // no longer present, unbind
        // 触发 unbind 进行解绑
        callHook(oldDirs[key], 'unbind', oldVnode, oldVnode, isDestroy)
      }
    }
  }
}

const emptyModifiers = Object.create(null)

function normalizeDirectives (
  dirs: ?Array<VNodeDirective>,
  vm: Component
): { [key: string]: VNodeDirective } {
  const res = Object.create(null)
  if (!dirs) {
    // $flow-disable-line
    return res
  }
  let i, dir
  for (i = 0; i < dirs.length; i++) {
    dir = dirs[i]
    if (!dir.modifiers) {
      // $flow-disable-line
      dir.modifiers = emptyModifiers
    }
    res[getRawDirName(dir)] = dir
    dir.def = resolveAsset(vm.$options, 'directives', dir.name, true)
  }
  // $flow-disable-line
  return res
}

function getRawDirName (dir: VNodeDirective): string {
  return dir.rawName || `${dir.name}.${Object.keys(dir.modifiers || {}).join('.')}`
}

function callHook (dir, hook, vnode, oldVnode, isDestroy) {
  const fn = dir.def && dir.def[hook]
  if (fn) {
    try {
      fn(vnode.elm, dir, vnode, oldVnode, isDestroy)
    } catch (e) {
      handleError(e, vnode.context, `directive ${dir.name} ${hook} hook`)
    }
  }
}
