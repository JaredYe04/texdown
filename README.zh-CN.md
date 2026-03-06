中文 | [English](README.md)

# texdown

基于统一 AST 的 Markdown ⇄ LaTeX 转换库。对支持的子集（标题、段落、列表、代码块、数学、链接、图片、表格、引用及行内格式）可安全往返转换。

## 安装

```bash
npm install texdown
```

## API

- **`markdownToLatex(markdown: string): string`** — 将 Markdown 转为 LaTeX 正文（不含 `\documentclass` 或前言）。
- **`latexToMarkdown(latex: string): string`** — 将 LaTeX 正文转为 Markdown。
- **`markdownToAST(markdown: string): AST`** — 将 Markdown 解析为统一 AST。
- **`latexToAST(latex: string): AST`** — 将 LaTeX 解析为统一 AST。
- **`normalizeAST(ast: AST): AST`** — 规范化 AST，用于往返比较。
- **`escapeLatex(str: string): string`** — 转义 LaTeX 特殊字符（用于前言、标题页等）。

### 类型

- **`AST`** — 文档根节点。
- **`BlockNode`** — 块级节点联合类型（heading、paragraph、list、code_block、math_block 等）。
- **`InlineNode`** — 行内节点联合类型（text、strong、emphasis、link、image、math_inline 等）。

## 示例

```ts
import { markdownToLatex, latexToMarkdown, escapeLatex } from 'texdown'

const latexBody = markdownToLatex('# Hello **world**\n\n- item')
// => "\\section{Hello \\textbf{world}}\n\n\\begin{itemize}\n\\item \n\\end{itemize}"

const md = latexToMarkdown('\\section{Foo}\n\nBar.')
// => "# Foo\n\nBar."

const safe = escapeLatex('Price: 100% & "quoted"')
// => "Price: 100\\% \\& \"quoted\""
```

## 仓库

[https://github.com/JaredYe04/texdown](https://github.com/JaredYe04/texdown)

## 许可证

见仓库中的许可证信息。
