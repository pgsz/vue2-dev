/* @flow */

/**
 * Expand input[v-model] with dynamic type bindings into v-if-else chains
 * Turn this:
 *   <input v-model="data[type]" :type="type">
 * into this:
 *   <input v-if="type === 'checkbox'" type="checkbox" v-model="data[type]">
 *   <input v-else-if="type === 'radio'" type="radio" v-model="data[type]">
 *   <input v-else :type="type" v-model="data[type]">
 */

import {
  addRawAttr,
  getBindingAttr,
  getAndRemoveAttr
} from 'compiler/helpers'

import {
  processFor,
  processElement,
  addIfCondition,
  createASTElement
} from 'compiler/parser/index'

/**
 * 处理包含 v-model 指令的 input 标签，但没处理 v-model 属性
 * 分别处理 input 为 checkbox、radio 和 其他的情况
 * input 具体为哪种情况由 el.ifConditions 中的条件判断
*/
function preTransformNode (el: ASTElement, options: CompilerOptions) {
  // <input v-model='xxx' type='xxx' />
  if (el.tag === 'input') {
    const map = el.attrsMap
    if (!map['v-model']) {
      // 没有 v-model 属性，直接返回
      return
    }

    // 获取 type 的值
    let typeBinding
    if (map[':type'] || map['v-bind:type']) {
      // 得到对应属性的值
      typeBinding = getBindingAttr(el, 'type')
    }
    if (!map.type && !typeBinding && map['v-bind']) {
      typeBinding = `(${map['v-bind']}).type`
    }

    if (typeBinding) {
      // 得到 v-if 的值
      // <input v-model='xxx' v-if='xx' />
      // ifCondition = xx
      const ifCondition = getAndRemoveAttr(el, 'v-if', true)
      // 拼接 &&xx
      const ifConditionExtra = ifCondition ? `&&(${ifCondition})` : ``
      const hasElse = getAndRemoveAttr(el, 'v-else', true) != null
      const elseIfCondition = getAndRemoveAttr(el, 'v-else-if', true)
      // 1. checkbox
      // <input type='checkbox' />
      // 克隆新的 el 对象
      const branch0 = cloneASTElement(el)
      // process for on the main node
      // 处理 v-for = " item in arr "
      processFor(branch0)
      // 给 el 对象添加 type 属性，置为 checkbox
      addRawAttr(branch0, 'type', 'checkbox')
      // 处理标签上的众多属性
      processElement(branch0, options)
      // 标记当前对象已经被处理过啦
      branch0.processed = true // prevent it from double-processed
      branch0.if = `(${typeBinding})==='checkbox'` + ifConditionExtra
      addIfCondition(branch0, {
        exp: branch0.if,
        block: branch0
      })
      // 2. add radio else-if condition
      const branch1 = cloneASTElement(el)
      getAndRemoveAttr(branch1, 'v-for', true)
      addRawAttr(branch1, 'type', 'radio')
      processElement(branch1, options)
      addIfCondition(branch0, {
        exp: `(${typeBinding})==='radio'` + ifConditionExtra,
        block: branch1
      })
      // 3. other
      const branch2 = cloneASTElement(el)
      getAndRemoveAttr(branch2, 'v-for', true)
      addRawAttr(branch2, ':type', typeBinding)
      processElement(branch2, options)
      addIfCondition(branch0, {
        exp: ifCondition,
        block: branch2
      })

      // 设置 else 或 else if 条件
      if (hasElse) {
        branch0.else = true
      } else if (elseIfCondition) {
        branch0.elseif = elseIfCondition
      }

      return branch0
    }
  }
}

function cloneASTElement (el) {
  return createASTElement(el.tag, el.attrsList.slice(), el.parent)
}

export default {
  preTransformNode
}
