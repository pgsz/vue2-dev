/* @flow */

import { cached } from 'shared/util'
import { parseFilters } from './filter-parser'

const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g
const regexEscapeRE = /[-.*+?^${}()|[\]\/\\]/g

const buildRegex = cached(delimiters => {
  const open = delimiters[0].replace(regexEscapeRE, '\\$&')
  const close = delimiters[1].replace(regexEscapeRE, '\\$&')
  return new RegExp(open + '((?:.|\\n)+?)' + close, 'g')
})

type TextParseResult = {
  expression: string,
  tokens: Array<string | { '@binding': string }>
}

/**
 * HTML 解析器得到的文本内容 text 传给文本解析器 parseText 函数
 *   1：判断传入的文本是否包含变量
 *   2：构造 expression
 *   3：构造 tokens
*/
export function parseText (
  // 待解析的文本内容
  text: string,
  // 包裹变量的符号
  delimiters?: [string, string]
): TextParseResult | void {
  // 没有传入 delimiters,则是用 {{ }} 检测;有则用传入的来检测,例如:传入 %,就是用 %name% 来包裹变量
  const tagRE = delimiters ? buildRegex(delimiters) : defaultTagRE
  // 不包含直接返回
  if (!tagRE.test(text)) {
    return
  }
  const tokens = []
  const rawTokens = []
  let lastIndex = tagRE.lastIndex = 0
  let match, index, tokenValue
  // 开启循环
  /**
   * tagRE.exec("hello {{name}}，I am {{age}}")
   * 返回：["{{name}}", "name", index: 6, input: "hello {{name}}，I am {{age}}", groups: undefined]
   * 匹配上时: 
   *    第一个元素:字符串中第一个完整的带有包裹的变量
   *    第二个元素：第一个被包裹的变量名
   *    带三个元素：第一个变量在字符串中的起始位置
   *    
   * tagRE.exec("hello")
   * 返回：null
  */
  while ((match = tagRE.exec(text))) {
    index = match.index
    // push text token
    if (index > lastIndex) {
      // 先把 '{{' 前面的文本放入 tokens
      rawTokens.push(tokenValue = text.slice(lastIndex, index))
      tokens.push(JSON.stringify(tokenValue))
    }
    // tag token
    // 取出 '{{ }}' 中间的变量 exp
    const exp = parseFilters(match[1].trim())
    // 把变量 exp 改成 _s(exp) 形式放入 tokens中
    tokens.push(`_s(${exp})`)
    rawTokens.push({ '@binding': exp })
    // 设置 lastIndex 以保证下一轮循环时，从 '}}' 后面再开始匹配正则
    lastIndex = index + match[0].length
  }
  // 当剩下的 text 不再被正则匹配上时，表示所有变量已经处理完毕
  // lastIndex < text.length: 表示最后一个变量后面还有文本
  // 将最后的文本放入 token
  if (lastIndex < text.length) {
    rawTokens.push(tokenValue = text.slice(lastIndex))
    tokens.push(JSON.stringify(tokenValue))
  }
  // 把数组 token 中所有元素用 '+' 拼接并抛出对象
  return {
    expression: tokens.join('+'),
    tokens: rawTokens
  }
}
