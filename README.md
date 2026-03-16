<!-- 语言切换：点击下方链接跳转到对应语言区块 -->
<p align="center">
  <strong>View in</strong> · <a href="#en">🇺🇸 English</a> · <a href="#zh">🇨🇳 中文</a>
</p>

<details id="en" open>
<summary><strong>🇺🇸 English</strong></summary>

# 📄 markdown-tex

> **Markdown ⇄ LaTeX** conversion library with a unified AST. Round-trip safe for headings, paragraphs, lists, code blocks, math, links, images, tables, blockquotes, and inline formatting.

[![npm](https://img.shields.io/npm/v/@jared-ye/markdown-tex)](https://www.npmjs.com/package/@jared-ye/markdown-tex)
[![GitHub](https://img.shields.io/badge/GitHub-JaredYe04%2Fmarkdown-tex-blue)](https://github.com/JaredYe04/markdown-tex)

---

## 🚀 Install

```bash
npm install @jared-ye/markdown-tex
```

---

## ✨ Features

- **🔄 Bidirectional** — Convert Markdown → LaTeX body and LaTeX body → Markdown
- **🌳 Unified AST** — Single intermediate representation for both directions
- **✅ Round-trip safe** — Supported constructs survive MD → LaTeX → MD
- **📦 Zero config** — Works out of the box, no document preamble (use your own `\documentclass` and packages)

---

## 📖 API

| Method | Description |
|--------|-------------|
| `markdownToLatex(md)` | Markdown string → LaTeX **body** (no `\documentclass`) |
| `latexToMarkdown(latex, options?)` | LaTeX body → Markdown string (with optional custom macro handling) |
| `markdownToAST(md)` | Markdown → unified AST |
| `latexToAST(latex)` | LaTeX → unified AST |
| `normalizeAST(ast)` | Normalize AST for round-trip comparison |
| `escapeLatex(str)` | Escape `# $ % & _ { }` etc. for preamble/titlepage |

**Types:** `AST`, `BlockNode`, `InlineNode`, `LatexToMarkdownOptions`, `ParsedLatexMacro`, `InlineMacroHandler` (exported for TypeScript).  
**Advanced:** `builtInInlineMacroHandlers`, `getEffectiveInlineMacroHandlers` for extending defaults.

---

## 💡 Examples

### Basic conversion

```ts
import { markdownToLatex, latexToMarkdown } from '@jared-ye/markdown-tex'

// Markdown → LaTeX body
const latex = markdownToLatex('# Hello **world**\n\n- item one\n- item two')
// → \section{Hello \textbf{world}}
//   \begin{itemize}
//   \item item one
//   \item item two
//   \end{itemize}

// LaTeX → Markdown
const md = latexToMarkdown('\\section{Foo}\n\nBar with \\textbf{bold}.')
// → # Foo
//   Bar with **bold**.
```

### Math & code

```ts
const latex = markdownToLatex('Inline $E=mc^2$ and block:\n\n$$\n\\int_0^1 x\\,dx\n$$')
// Inline math → $...$; block math → \[ ... \]

const code = markdownToLatex('```js\nconst x = 1\n```')
// → \begin{verbatim} ... \end{verbatim}
```

### Escape for titlepage / headers

```ts
import { escapeLatex } from '@jared-ye/markdown-tex'

const title = escapeLatex('Price: 100% & "quoted"')
// → Price: 100\% \& \"quoted\"
// Use in \title{}, \lhead{}, etc.
```

### Custom LaTeX macro handling (latex → markdown)

`latexToMarkdown` accepts `inlineMacros` to handle custom macros and to **override built-in handlers**. Built-in macros: `textbf`, `textit`, `emph`, `texttt`, `sout`, `href`, `includegraphics`, `ref`, `cite`.

```ts
import {
  latexToMarkdown,
  type LatexToMarkdownOptions,
  type ParsedLatexMacro
} from '@jared-ye/markdown-tex'

const options: LatexToMarkdownOptions = {
  inlineMacros: {
    // Custom macro: \mybold{X} → **X**
    mybold: (macro: ParsedLatexMacro) => {
      return macro.arg ? `**${macro.arg}**` : macro.raw
    },
    // Override built-in: \textbf{X} → <strong>X</strong>
    textbf: (macro) => `<strong>${macro.arg ?? ''}</strong>`,
    // \badge[green]{Done} → [Done]{.badge .green}
    badge: (macro) => {
      const label = macro.arg ?? ''
      const color = macro.optionalArg ?? 'default'
      return `[${label}]{.badge .${color}}`
    }
  }
}

latexToMarkdown('\\textbf{bold} and \\mybold{Hello}', options)
// → <strong>bold</strong> and **Hello**
```

---

## 🔗 Links

- **Repository:** [github.com/JaredYe04/markdown-tex](https://github.com/JaredYe04/markdown-tex)
- **npm:** [@jared-ye/markdown-tex](https://www.npmjs.com/package/@jared-ye/markdown-tex)

</details>

<details id="zh">
<summary><strong>🇨🇳 中文</strong></summary>

# 📄 markdown-tex

> 基于**统一 AST** 的 **Markdown ⇄ LaTeX** 转换库。支持标题、段落、列表、代码块、数学、链接、图片、表格、引用及行内格式的往返转换。

[![npm](https://img.shields.io/npm/v/@jared-ye/markdown-tex)](https://www.npmjs.com/package/@jared-ye/markdown-tex)
[![GitHub](https://img.shields.io/badge/GitHub-JaredYe04%2Fmarkdown-tex-blue)](https://github.com/JaredYe04/markdown-tex)

---

## 🚀 安装

```bash
npm install @jared-ye/markdown-tex
```

---

## ✨ 特性

- **🔄 双向转换** — Markdown → LaTeX 正文、LaTeX 正文 → Markdown
- **🌳 统一 AST** — 单一中间表示，双向共用
- **✅ 往返安全** — 支持的语法在 MD → LaTeX → MD 后保持一致
- **📦 开箱即用** — 仅输出正文，不包含 `\documentclass` 与宏包（可自建前言）

---

## 📖 API

| 方法 | 说明 |
|------|------|
| `markdownToLatex(md)` | Markdown 字符串 → LaTeX **正文**（无 `\documentclass`） |
| `latexToMarkdown(latex, options?)` | LaTeX 正文 → Markdown 字符串（可选自定义宏处理配置） |
| `markdownToAST(md)` | Markdown → 统一 AST |
| `latexToAST(latex)` | LaTeX → 统一 AST |
| `normalizeAST(ast)` | 规范化 AST，用于往返比较 |
| `escapeLatex(str)` | 转义 `# $ % & _ { }` 等，用于前言/标题页 |

**类型：** `AST`、`BlockNode`、`InlineNode`、`LatexToMarkdownOptions`、`ParsedLatexMacro`、`InlineMacroHandler`（TypeScript 导出）。  
**进阶：** `builtInInlineMacroHandlers`、`getEffectiveInlineMacroHandlers` 用于扩展默认行为。

---

## 💡 示例

### 基础转换

```ts
import { markdownToLatex, latexToMarkdown } from '@jared-ye/markdown-tex'

// Markdown → LaTeX 正文
const latex = markdownToLatex('# 你好 **世界**\n\n- 第一项\n- 第二项')
// → \section{你好 \textbf{世界}}
//   \begin{itemize}
//   \item 第一项
//   \item 第二项
//   \end{itemize}

// LaTeX → Markdown
const md = latexToMarkdown('\\section{标题}\n\n内容与\\textbf{加粗}。')
// → # 标题
//   内容与**加粗**。
```

### 数学与代码

```ts
const latex = markdownToLatex('行内 $E=mc^2$，块级：\n\n$$\n\\int_0^1 x\\,dx\n$$')
// 行内公式 → $...$；块级公式 → \[ ... \]

const code = markdownToLatex('```js\nconst x = 1\n```')
// → \begin{verbatim} ... \end{verbatim}
```

### 标题页/页眉转义

```ts
import { escapeLatex } from '@jared-ye/markdown-tex'

const title = escapeLatex('价格：100% & “引号”')
// → 价格：100\% \& \"引号\"
// 用于 \title{}、\lhead{} 等
```

### LaTeX 自定义宏处理（latex → markdown）

`latexToMarkdown` 支持 `inlineMacros` 处理自定义宏，并可**覆盖内置宏**。内置宏包括：`textbf`、`textit`、`emph`、`texttt`、`sout`、`href`、`includegraphics`、`ref`、`cite`。

```ts
import {
  latexToMarkdown,
  type LatexToMarkdownOptions,
  type ParsedLatexMacro
} from '@jared-ye/markdown-tex'

const options: LatexToMarkdownOptions = {
  inlineMacros: {
    // 自定义宏：\mybold{内容} → **内容**
    mybold: (macro: ParsedLatexMacro) => {
      return macro.arg ? `**${macro.arg}**` : macro.raw
    },
    // 覆盖内置：\textbf{内容} → <strong>内容</strong>
    textbf: (macro) => `<strong>${macro.arg ?? ''}</strong>`,
    // \badge[success]{已完成} → [已完成]{.badge .success}
    badge: (macro) => {
      const label = macro.arg ?? ''
      const color = macro.optionalArg ?? 'default'
      return `[${label}]{.badge .${color}}`
    }
  }
}

latexToMarkdown('\\textbf{加粗} 与 \\mybold{你好}', options)
// → <strong>加粗</strong> 与 **你好**
```

---

## 🔗 链接

- **仓库：** [github.com/JaredYe04/markdown-tex](https://github.com/JaredYe04/markdown-tex)
- **npm：** [@jared-ye/markdown-tex](https://www.npmjs.com/package/@jared-ye/markdown-tex)

</details>
