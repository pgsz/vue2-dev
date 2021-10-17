/* @flow */

import { parse } from './parser/index'
import { optimize } from './optimizer'
import { generate } from './codegen/index'
import { createCompilerCreator } from './create-compiler'

// `createCompilerCreator` allows creating compilers that use alternative
// parser/optimizer/codegen, e.g the SSR optimizing compiler.
// Here we just export a default compiler using the default parts.
/**
 * 在这之前所有的事情，唯一目的：构建平台持有的编译选项（options）
 *   1.将 html 模板解析成 ast  --->  解析器
 *   2.对 ast 树进行静态标记  --->  优化器
 *   3.将 ast 生成渲染函数  --->  代码生成器
 *     静态渲染函数放到 code.staticRenderFns 数组中
 *     code.render 为动态渲染函数
 *     在将来渲染时执行渲染函数得到 vnode
*/
// 把用户所写的模板转化成供 Vue 实例在挂载时可调用的 render 函数
export const createCompiler = createCompilerCreator(function baseCompile (
  template: string,
  options: CompilerOptions
): CompiledResult {
  // 模板编译阶段
  // 将模板解析为 AST，每个节点的 ast 对象上都设置了元素的所有信息，比如 标签信息、属性信息、插槽信息、父节点、子节点等
  // 具体有哪些属性，查看 start 和 end 这两个处理开始和结束标签的方法
  const ast = parse(template.trim(), options)
  // 优化阶段
  // 优化，遍历 AST，为每个节点做静态标记
  // 标记每个节点是否为静态节点，然后进一步标记静态根节点
  // 这样在后续更新中就可以跳过这些静态节点，减少比较过程，优化 patch 的性能
  // 标记静态根节点，用于生成渲染函数节点，生成静态根节点的渲染函数
  if (options.optimize !== false) {
    optimize(ast, options)
  }
  // 代码生成阶段
  // 从 AST 生成渲染函数
  const code = generate(ast, options)
  return {
    // 抽象语法树
    ast,
    // 渲染函数
    render: code.render,
    // 静态渲染函数
    staticRenderFns: code.staticRenderFns
  }
})
