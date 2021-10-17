/**
 * Not type-checking this file because it's mostly vendor code.
 */

/*!
 * HTML Parser By John Resig (ejohn.org)
 * Modified by Juriy "kangax" Zaytsev
 * Original code by Erik Arvidsson (MPL-1.1 OR Apache-2.0 OR GPL-2.0-or-later)
 * http://erik.eae.net/simplehtmlparser/simplehtmlparser.js
 */

import { makeMap, no } from 'shared/util'
import { isNonPhrasingTag } from 'web/compiler/util'
import { unicodeRegExp } from 'core/util/lang'

// Regular Expressions for parsing tags and attributes
// 解析 标签属性
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
const dynamicArgAttribute = /^\s*((?:v-[\w-]+:|@|:|#)\[[^=]+?\][^\s"'<>\/=]*)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
// 开始标签
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z${unicodeRegExp.source}]*`
const qnameCapture = `((?:${ncname}\\:)?${ncname})`
const startTagOpen = new RegExp(`^<${qnameCapture}`)
// 自闭合标签
const startTagClose = /^\s*(\/?)>/
// 结束标签
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`)
// DOCTYPE
const doctype = /^<!DOCTYPE [^>]+>/i
// #7298: escape - to avoid being passed as HTML comment when inlined in page
// 注释 <!--< ![endif] -->
const comment = /^<!\--/
// 条件注释 <!-- [if !IE]> -->
const conditionalComment = /^<!\[/

// Special Elements (can contain anything)
export const isPlainTextElement = makeMap('script,style,textarea', true)
const reCache = {}

const decodingMap = {
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&amp;': '&',
  '&#10;': '\n',
  '&#9;': '\t',
  '&#39;': "'"
}
const encodedAttr = /&(?:lt|gt|quot|amp|#39);/g
const encodedAttrWithNewLines = /&(?:lt|gt|quot|amp|#39|#10|#9);/g

// #5992
const isIgnoreNewlineTag = makeMap('pre,textarea', true)
const shouldIgnoreFirstNewline = (tag, html) => tag && isIgnoreNewlineTag(tag) && html[0] === '\n'

function decodeAttr (value, shouldDecodeNewlines) {
  const re = shouldDecodeNewlines ? encodedAttrWithNewLines : encodedAttr
  return value.replace(re, match => decodingMap[match])
}

// 解析不同内容并调用对应的钩子函数生成对应的 AST 节点，最终完成整个模板字符串转化成 AST
/**
 * @description: 通过循环遍历 html 模板字符串，依次处理其中的各个标签，以及标签上的属性
 * @param {*} html html模板
 * @param {*} options 配置项
 * @return {*}
 */
export function parseHTML (html, options) {
  const stack = []
  const expectHTML = options.expectHTML
  // 是否是自闭合标签
  const isUnaryTag = options.isUnaryTag || no
  // 检测标签是否是可以省略闭合标签的非自闭合标签，即是否可以只有开始标签
  const canBeLeftOpenTag = options.canBeLeftOpenTag || no
  // 解析游标，标记当前从何处解析，即记录当前在原始 html 字符串中开始的位置
  let index = 0
  // last：存储剩余还未解析的模板字符串 lastTag：存储位于 stack 栈顶的元素
  let last, lastTag
  // 开启 while 循环，解析 html
  while (html) {
    // 存储 html
    last = html
    // Make sure we're not in a plaintext content element like script/style
    // !lastTag：当前 html 字符串没有父节点
    // 确保即将 parse 的内容不是在纯文本标签里 script、style、textarea
    if (!lastTag || !isPlainTextElement(lastTag)) {
      let textEnd = html.indexOf('<')
      /**
       * 字符串以 '<' 开头：
       *    开始标签：<div>
       *    结束标签：</div>
       *    注释：<!-- 我是注释 -->
       *    条件注释：<!-- [if !IE]> <![endif] -->
       *    DOCTYPE：<!DOCTYPE html>
       * 每处理完一种情况，就会截断循环（continue），并且重置 html 字符串
       * 将处理过的标签截掉，下一次循环处理剩余的 html 字符串模版
      */
      if (textEnd === 0) {
        // Comment:
        // 解析是否为注释
        if (comment.test(html)) {
          // 若为注释，则继续查找是否存在 '-->' 的结束索引
          const commentEnd = html.indexOf('-->')

          if (commentEnd >= 0) {
            // 若存在，继续判断 options 中是否保留注释
            if (options.shouldKeepComment) {
              // '<!--' 长度为 4，开始截取，直到 '-->'
              // 得到注释内容、注释的开始索引、结束索引
              options.comment(html.substring(4, commentEnd), index, index + commentEnd + 3)
            }
            // 将游标移动到 '-->' 之后，继续解析
            advance(commentEnd + 3)
            continue
          }
        }

        // http://en.wikipedia.org/wiki/Conditional_comment#Downlevel-revealed_conditional_comment
        // 解析是否为条件注释
        if (conditionalComment.test(html)) {
          // 继续查找是否存在 ']>' 结束位置
          const conditionalEnd = html.indexOf(']>')

          // 条件注释不存在于真正的 DOM 树
          if (conditionalEnd >= 0) {
            // 将原本的 html 字符串把条件注释截掉，剩下内容，继续匹配
            advance(conditionalEnd + 2)
            continue
          }
        }

        // Doctype:
        // 解析 DOCTYPE，同条件注释
        const doctypeMatch = html.match(doctype)
        if (doctypeMatch) {
          advance(doctypeMatch[0].length)
          continue
        }

        // 核心：
        
        /**
         * 处理开始标签和结束标签是整个函数的核心部分
         * 这两部分在构造 element ast
        */
        // End tag:
        // '</div>'.match(endTag)  // ["</div>", "div", index: 0, input: "</div>", groups: undefined]
        // '<div>'.match(endTag)  // null   
        const endTagMatch = html.match(endTag)
        if (endTagMatch) {
          const curIndex = index
          advance(endTagMatch[0].length)
          // 处理结束标签
          parseEndTag(endTagMatch[1], curIndex, index)
          continue
        }

        // Start tag:
        // 处理开始标签
        const startTagMatch = parseStartTag()
        if (startTagMatch) {
          // 进一步解析，并调用 options.start 方法
          // 真正的解析工作都是在此方法中
          handleStartTag(startTagMatch)
          if (shouldIgnoreFirstNewline(startTagMatch.tagName, html)) {
            advance(1)
          }
          continue
        }
      }

      let text, rest, next
      /**
       * 走到这一步，说明虽然 html 中匹配到 < 但不属于上述几种情况，只是一段普通文本
      */
      // 文本
      if (textEnd >= 0) {
        // 1<2<3</div>
        // html 字符串不是以 '<' 开头，说明前面都是纯文本，直接截取
        // 截取 html 模板字符串中 textEnd 之后的内容 <2<3</div>
        rest = html.slice(textEnd)
        // 循环处理，找到上述几种情况的标签
        while (
          !endTag.test(rest) &&
          !startTagOpen.test(rest) &&
          !comment.test(rest) &&
          !conditionalComment.test(rest)
        ) {
          // < in plain text, be forgiving and treat it as text
          // 用 '<' 以后的内容 rest 匹配 endTag、startTagOpen、comment、conditionalComment
          // 都无法匹配，说明 '<' 是属于文本本身的内容
          // 继续在后面的内容中找 <
          next = rest.indexOf('<', 1)
          // 没有找到，表示后面也是文本，直接结束循环
          if (next < 0) break
          // 在后续的字符串中找到 < 的索引位置为 textEnd
          textEnd += next
          // 截取之后继续下一轮的循环匹配
          rest = html.slice(textEnd)
        }
        // 遍历结束，两种情况： 
        //   1：< 之后都是纯文本
        //   2：找到有效标签，截取文本
        text = html.substring(0, textEnd)
      }

      // 整个模板字符串都没有 '<'，整个都是文本
      if (textEnd < 0) {
        text = html
      }

      // 将文本内容从 html 模板字符串上截取
      if (text) {
        advance(text.length)
      }

      // 处理文本
      // 将截取出来的 text 转化成 textAST
      // 将该 ast 放到父元素中，即 currentParent.children 数组中
      if (options.chars && text) {
        options.chars(text, index - text.length, index)
      }
    } else {
      // 处理 script、style、textarea 标签的闭合标签
      let endTagLength = 0
      // 开始标签小写形式
      const stackedTag = lastTag.toLowerCase()
      const reStackedTag = reCache[stackedTag] || (reCache[stackedTag] = new RegExp('([\\s\\S]*?)(</' + stackedTag + '[^>]*>)', 'i'))
      // 匹配并处理开始标签和结束之间的所有文本，例如： <script>xxxx</script>
      const rest = html.replace(reStackedTag, function (all, text, endTag) {
        endTagLength = endTag.length
        if (!isPlainTextElement(stackedTag) && stackedTag !== 'noscript') {
          text = text
            .replace(/<!\--([\s\S]*?)-->/g, '$1') // #7298
            .replace(/<!\[CDATA\[([\s\S]*?)]]>/g, '$1')
        }
        if (shouldIgnoreFirstNewline(stackedTag, text)) {
          text = text.slice(1)
        }
        if (options.chars) {
          options.chars(text)
        }
        return ''
      })
      index += html.length - rest.length
      html = rest
      parseEndTag(stackedTag, index - endTagLength, index)
    }

    // 如果处理之后，html 字符串没有变化，将整个字符串作为文本对待
    if (html === last) {
      // 解析文本
      options.chars && options.chars(html)
      if (process.env.NODE_ENV !== 'production' && !stack.length && options.warn) {
        options.warn(`Mal-formatted tag at end of template: "${html}"`, { start: index + html.length })
      }
      break
    }
  }

  // Clean up any remaining tags
  // 避免跳出 while 循环，执行其抛出警告并将标签闭合
  parseEndTag()

  /**
   * 重置 html，html = 索引 n 位置开始的向后的所有字符串
   * index 为 html 在原始模板字符串中的开始索引，也就是下次处理的字符串的开始位置
  */
  function advance (n) {
    // n：解析游标
    index += n
    html = html.substring(n)
  }

  // 解析开始标签
  function parseStartTag () {
    const start = html.match(startTagOpen)
    // '<div></div>'.match(startTagOpen)  => ['<div', 'div', index: 0, input: '<div></div>']
    if (start) {
      // 处理结果
      const match = {
        // 标签名
        tagName: start[1],
        // 属性，占位符
        attrs: [],
        // 标签开始位置
        start: index
      }
      // 截取 html
      advance(start[0].length)
      let end, attr
      // <div a=1 b=2 c=3></div>
      // 循环提取标签属性，从 <div 之后开始到 > 之前，匹配属性 attrs
      // 剩下字符串 不符合开始标签的结束特征，即不是以 '>' 或 '/>'（自闭合）；并且 符合属性标签的特征
      while (!(end = html.match(startTagClose)) && (attr = html.match(dynamicArgAttribute) || html.match(attribute))) {
        // <div id='app'></div> : attr =  [" id="app"", "id", "=", "app", undefined, undefined, index: 0, input: " id="app"></div>", groups: undefined]
        attr.start = index
        advance(attr[0].length)
        attr.end = index
        match.attrs.push(attr)
      }
      // '></div>'.match(startTagClose) // [">", "", index: 0, input: "></div>", groups: undefined]
      // '/>'.match(startTagClose) // ["/>", "/", index: 0, input: "/><div></div>", groups: undefined]
      if (end) {
        // 通过 end[1] 判断非自闭合为 ""，自闭合为 "/"
        match.unarySlash = end[1]
        advance(end[0].length)
        match.end = index
        return match
      }
    }
  }

  // 处理 parseStartTag 的结果
  /**
   * 进一步处理 match 对象
   *   处理属性 attrs，不是闭合标签，则将标签信息放到 stack 数组，待将来处理到它的闭合标签时再将其弹出 stack，表示该标签处理完毕，这是该标签的所有信息都在 ast 对象上 
   *   调用 options.start 方法处理标签，并根据标签信息生成 ast
   *   以及处理开始标签上的属性和指令，最后将 ast 放入 stack 数组
  */
  function handleStartTag (match) {
    // 开始标签的标签名
    const tagName = match.tagName
    // 是否为自闭合标签
    const unarySlash = match.unarySlash

    if (expectHTML) {
      if (lastTag === 'p' && isNonPhrasingTag(tagName)) {
        parseEndTag(lastTag)
      }
      if (canBeLeftOpenTag(tagName) && lastTag === tagName) {
        parseEndTag(tagName)
      }
    }

    // 是否为自闭合标签 布尔值
    const unary = isUnaryTag(tagName) || !!unarySlash

    // match.attrs 数组的长度
    const l = match.attrs.length
    // 与 l 长度相等的数组
    const attrs = new Array(l)
    for (let i = 0; i < l; i++) {
      // const args = ["class="a"", "class", "=", "a", undefined, undefined, index: 0, input: "class="a" id="b"></div>", groups: undefined]
      const args = match.attrs[i]
      // 存储标签属性的属性值
      const value = args[3] || args[4] || args[5] || ''
      // 兼容性处理 对 a 标签属性的 href 属性值中的 换行符或制表符做兼容性处理
      const shouldDecodeNewlines = tagName === 'a' && args[1] === 'href'
        ? options.shouldDecodeNewlinesForHref
        : options.shouldDecodeNewlines
      attrs[i] = {
        // 标签属性的属性名，如 class
        name: args[1],
        // 标签属性的属性值，如 class 对应的 a
        value: decodeAttr(value, shouldDecodeNewlines)
      }
      // 非生产环境，记录属性的开始和结束索引
      if (process.env.NODE_ENV !== 'production' && options.outputSourceRange) {
        attrs[i].start = args.start + args[0].match(/^\s*/).length
        attrs[i].end = args.end
      }
    }

    // 非自闭合，推入 stack 数组栈中，待将来处理到它额闭合标签时再将其弹出
    // 自闭合标签，则没必要进入 stack；直接处理众多属性，将他们都设置到 ast 对象上；没有结束标签的那一步
    if (!unary) {
      stack.push({ tag: tagName, lowerCasedTag: tagName.toLowerCase(), attrs: attrs, start: match.start, end: match.end })
      // 表示当前标签的结束标签为 tagName
      lastTag = tagName
    }

    // 调用 start 钩子函数
    /**
     * stat 方法，6件事
     * 1：创建 AST 对象
     * 2：处理存在 v-model 指令的 input 标签，分别处理 input 为checkbox、radio、其他情况
     * 3：处理标签上众多指令，如：v-pre、v-for、v-if、v-once
     * 4：如果根节点 root 不存在则设置当前元素为根节点
     * 5：如果当前元素为非闭合标签，则将自己 push 到 stack 数组，并记录 currentParent，在接下来处理子元素时用来告诉子元素自己的父节点是谁
     * 6：如果当前元素为闭合标签，则表示改标签要处理结束了，让自己和父元素产生关系，以及设置自己的子元素
    */
    if (options.start) {
      options.start(tagName, attrs, unary, match.start, match.end)
    }
  }

  /**
   * @description: 解析结束标签
   *                  1：处理 stack 数组，从 stack 数组中找到当前结束标签对应的开始标签，然后调用 options.end 方法
   *                  2：处理完结束标签之后调整 stack 数组
   *                  3：处理异常情况
   * @param {*} tagName 标签名
   * @param {*} start 结束标签开始的索引 
   * @param {*} end 结束标签结束的索引
   */
  function parseEndTag (tagName, start, end) {
    let pos, lowerCasedTagName
    if (start == null) start = index
    if (end == null) end = index

    // Find the closest opened tag of the same type
    if (tagName) {
      lowerCasedTagName = tagName.toLowerCase()
      // 从后往前遍历，在栈中寻找相同的标签并记录所在的位置
      // 理论上不出异常，stack 数组中的最后一个元素就是当前结束标签的开始标签的描述对象
      for (pos = stack.length - 1; pos >= 0; pos--) {
        if (stack[pos].lowerCasedTag === lowerCasedTagName) {
          break
        }
      }
    } else {
      // If no tag name is provided, clean shop
      pos = 0
    }

    //  >= 0 说明找到相同的标签名
    if (pos >= 0) {
      // Close all the open elements, up the stack
      for (let i = stack.length - 1; i >= pos; i--) {
        // 缺少闭合标签  pos 应该是栈顶位置，后面不应该有元素
        if (process.env.NODE_ENV !== 'production' &&
          (i > pos || !tagName) &&
          options.warn
        ) {
          options.warn(
            `tag <${stack[i].tag}> has no matching end tag.`,
            { start: stack[i].start, end: stack[i].end }
          )
        }
        if (options.end) {
          // 将其闭合，为保证解析结果的准确性
          options.end(stack[i].tag, start, end)
        }
      }

      // Remove the open elements from the stack
      // pos 位置以后的元素从 stack 栈中弹出，将刚才处理的那些标签从数组中移除，保证数组的最后一个元素就是下一个结束标签对应的开始标签
      stack.length = pos
      // 把 lastTag 更新为栈顶元素，即记录 stack 数组中未处理的最后一个开始标签
      lastTag = pos && stack[pos - 1].tag
    } else if (lowerCasedTagName === 'br') {
      // 如果没找到对应开始的标签；单独处理 br 和 p 标签
      // </br> 浏览器解析为正常的 <br> 标签 
      // </p> 浏览器会自动补全
      if (options.start) {
        // 创建 <br> AST 节点
        options.start(tagName, [], true, start, end)
      }
    } else if (lowerCasedTagName === 'p') {
      if (options.start) {
        // 补全 p 标签并创建 AST 节点 
        options.start(tagName, [], false, start, end)
      }
      if (options.end) {
        options.end(tagName, start, end)
      }
    }
  }
}
