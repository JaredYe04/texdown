import type { InlineNode } from '../ast/nodes'

export interface ParsedLatexMacro {
  /** 原始宏调用字符串，例如 `\foo{bar}` 或 `\foo*[opt]{bar}` */
  raw: string
  /** 宏名称（不含反斜杠），例如 `foo` */
  name: string
  /** 是否带星号形式，例如 `\section*` */
  hasStar: boolean
  /** 第一个可选参数内容（如果存在），不含方括号 */
  optionalArg?: string
  /** 第一个花括号参数内容（如果存在），不含大括号 */
  arg?: string
  /** 第二个花括号参数（如 \href{url}{text} 的 text） */
  arg2?: string
}

export type InlineMacroHandlerResult =
  | string
  | InlineNode
  | InlineNode[]
  | null
  | undefined

export type InlineMacroHandler = (macro: ParsedLatexMacro) => InlineMacroHandlerResult

export interface LatexToMarkdownOptions {
  /**
   * 自定义行内宏处理器映射。
   * key 为宏名（不带 `\`），例如 `mybold` 对应 `\mybold{...}`。
   * 用户提供的处理器会覆盖内置处理器（textbf, textit, emph, texttt, sout, href, includegraphics, ref, cite）。
   */
  inlineMacros?: Record<string, InlineMacroHandler>
}

/** 内置宏处理器（默认行为）。用户可通过 inlineMacros 覆盖。 */
export const builtInInlineMacroHandlers: Record<string, InlineMacroHandler> = {
  textbf: (m) => (m.arg != null ? `**${m.arg}**` : m.raw),
  textit: (m) => (m.arg != null ? `*${m.arg}*` : m.raw),
  emph: (m) => (m.arg != null ? `*${m.arg}*` : m.raw),
  texttt: (m) => (m.arg != null ? `\`${m.arg}\`` : m.raw),
  sout: (m) => (m.arg != null ? `~~${m.arg}~~` : m.raw),
  href: (m) =>
    m.arg != null && m.arg2 != null ? `[${m.arg2}](${m.arg})` : m.raw,
  includegraphics: (m) =>
    m.arg != null ? `![${m.optionalArg ?? ''}](${m.arg})` : m.raw,
  ref: (m) => '[ref]',
  cite: (m) =>
    m.arg != null ? `[${m.arg}](#ref-${m.arg})` : '[ref]'
}

/** 合并内置处理器与用户配置，用户配置优先。 */
export function getEffectiveInlineMacroHandlers(
  userMacros?: Record<string, InlineMacroHandler>
): Record<string, InlineMacroHandler> {
  return { ...builtInInlineMacroHandlers, ...userMacros }
}

/** 简单解析未知 LaTeX 宏调用，提取名称、可选参数和第一个花括号参数。 */
export function parseLatexMacroInvocation(raw: string): ParsedLatexMacro | null {
  if (!raw || raw[0] !== '\\') return null

  const headerMatch = raw.match(/^\\([a-zA-Z@]+)(\*)?(\[[^[\]]*\])?/)
  if (!headerMatch) return null

  const name = headerMatch[1]
  const hasStar = !!headerMatch[2]
  const optionalBracket = headerMatch[3]
  let idx = headerMatch[0].length

  let optionalArg: string | undefined
  if (optionalBracket) {
    optionalArg = optionalBracket.slice(1, -1)
  }

  let arg: string | undefined
  let arg2: string | undefined
  if (idx < raw.length && raw[idx] === '{') {
    const brace = extractBalancedBraces(raw, idx)
    if (brace) {
      arg = brace.content
      idx = brace.end
      if (idx < raw.length && raw[idx] === '{') {
        const brace2 = extractBalancedBraces(raw, idx)
        if (brace2) arg2 = brace2.content
      }
    }
  }

  return { raw, name, hasStar, optionalArg, arg, arg2 }
}

/** 解析从给定位置起的单个成对花括号 `{...}`，支持简单嵌套和转义。 */
function extractBalancedBraces(
  s: string,
  start: number
): { content: string; end: number } | null {
  if (s[start] !== '{') return null
  let depth = 1
  let i = start + 1
  while (i < s.length) {
    const ch = s[i]
    if (ch === '\\' && i + 1 < s.length) {
      i += 2
      continue
    }
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) {
        return { content: s.slice(start + 1, i), end: i + 1 }
      }
    }
    i++
  }
  return null
}

