English | [中文](README.zh-CN.md)

# texdown

Markdown ⇄ LaTeX conversion library with a unified AST. Round-trip safe for the supported subset (headings, paragraphs, lists, code blocks, math, links, images, tables, blockquotes, and inline formatting).

## Install

```bash
npm install texdown
```

## API

- **`markdownToLatex(markdown: string): string`** — Convert Markdown to LaTeX body (no `\documentclass` or preamble).
- **`latexToMarkdown(latex: string): string`** — Convert LaTeX body to Markdown.
- **`markdownToAST(markdown: string): AST`** — Parse Markdown into the unified AST.
- **`latexToAST(latex: string): AST`** — Parse LaTeX into the unified AST.
- **`normalizeAST(ast: AST): AST`** — Normalize AST for round-trip comparison.
- **`escapeLatex(str: string): string`** — Escape LaTeX special characters (for use in preamble, titlepage, etc.).

### Types

- **`AST`** — Root document node.
- **`BlockNode`** — Union of block node types (heading, paragraph, list, code_block, math_block, etc.).
- **`InlineNode`** — Union of inline node types (text, strong, emphasis, link, image, math_inline, etc.).

## Example

```ts
import { markdownToLatex, latexToMarkdown, escapeLatex } from 'texdown'

const latexBody = markdownToLatex('# Hello **world**\n\n- item')
// => "\\section{Hello \\textbf{world}}\n\n\\begin{itemize}\n\\item \n\\end{itemize}"

const md = latexToMarkdown('\\section{Foo}\n\nBar.')
// => "# Foo\n\nBar."

const safe = escapeLatex('Price: 100% & "quoted"')
// => "Price: 100\\% \\& \"quoted\""
```

## Repository

[https://github.com/JaredYe04/texdown](https://github.com/JaredYe04/texdown)

## License

See repository for license information.
