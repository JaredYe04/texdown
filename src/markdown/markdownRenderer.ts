/**
 * AST → Markdown renderer.
 */

import type { AST, BlockNode, InlineNode } from '../ast/nodes'
import {
  isHeadingNode,
  isParagraphNode,
  isListNode,
  isListItemNode,
  isCodeBlockNode,
  isMathBlockNode,
  isBlockquoteNode,
  isThematicBreakNode,
  isTableNode,
  isUnknownBlockNode,
  isTextNode,
  isStrongNode,
  isEmphasisNode,
  isInlineCodeNode,
  isLinkNode,
  isImageNode,
  isMathInlineNode,
  isStrikethroughNode
} from '../ast/nodes'
import type {
  InlineMacroHandlerResult,
  LatexToMarkdownOptions
} from '../latex/latexToMarkdownOptions'
import {
  getEffectiveInlineMacroHandlers,
  parseLatexMacroInvocation
} from '../latex/latexToMarkdownOptions'

export function renderMarkdown(ast: AST, options?: LatexToMarkdownOptions): string {
  return ast.children.map((b) => renderBlock(b, options)).filter(Boolean).join('\n\n')
}

function renderBlock(node: BlockNode, options?: LatexToMarkdownOptions): string {
  if (isHeadingNode(node)) {
    const prefix = '#'.repeat(node.level)
    return `${prefix} ${renderInlineSequence(node.children, options)}`
  }
  if (isParagraphNode(node)) {
    return renderInlineSequence(node.children, options)
  }
  if (isListNode(node)) {
    return node.items
      .map((item, idx) => {
        const bullet = node.ordered ? `${idx + 1}.` : '-'
        const first = item.children[0]
        const text =
          first && first.type === 'paragraph'
            ? renderInlineSequence((first as { children: InlineNode[] }).children, options)
            : ''
        return `${bullet} ${text}`
      })
      .join('\n')
  }
  if (isCodeBlockNode(node)) {
    const lang = node.lang ? ` ${node.lang}` : ''
    return `\`\`\`${lang}\n${node.content}\n\`\`\``
  }
  if (isMathBlockNode(node)) {
    // Space after/before $$ for compatibility with common Markdown math extensions (KaTeX, MathJax)
    return `$$ ${node.content.trim()} $$`
  }
  if (isBlockquoteNode(node)) {
    const inner = node.children.map((b) => renderBlock(b, options)).join('\n\n')
    return inner
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n')
  }
  if (isThematicBreakNode(node)) {
    return '---'
  }
  if (isTableNode(node)) {
    const header = '| ' + node.headerRow.join(' | ') + ' |'
    const sep = '| ' + node.headerRow.map(() => '---').join(' | ') + ' |'
    const body = node.rows.map((row) => '| ' + row.join(' | ') + ' |').join('\n')
    return [header, sep, body].filter(Boolean).join('\n')
  }
  if (isUnknownBlockNode(node)) {
    return node.raw
  }
  return ''
}

function renderInlineSequence(
  nodes: InlineNode[],
  options?: LatexToMarkdownOptions
): string {
  return nodes.map((n) => renderInline(n, options)).join('')
}

function renderInline(node: InlineNode, options?: LatexToMarkdownOptions): string {
  const handlers = getEffectiveInlineMacroHandlers(options?.inlineMacros)

  if (isTextNode(node)) return node.value

  if (isStrongNode(node)) {
    const inner = renderInlineSequence(node.children, options)
    const result = handlers['textbf']?.({ raw: `\\textbf{${inner}}`, name: 'textbf', hasStar: false, arg: inner })
    if (result != null) return renderInlineHandlerResult(result, options)
    return `**${inner}**`
  }

  if (isEmphasisNode(node)) {
    const inner = renderInlineSequence(node.children, options)
    const result =
      handlers['emph']?.({ raw: `\\emph{${inner}}`, name: 'emph', hasStar: false, arg: inner }) ??
      handlers['textit']?.({ raw: `\\textit{${inner}}`, name: 'textit', hasStar: false, arg: inner })
    if (result != null) return renderInlineHandlerResult(result, options)
    return `*${inner}*`
  }

  if (isInlineCodeNode(node)) {
    const result = handlers['texttt']?.({ raw: `\\texttt{${node.value}}`, name: 'texttt', hasStar: false, arg: node.value })
    if (result != null) return renderInlineHandlerResult(result, options)
    return `\`${node.value}\``
  }

  if (isLinkNode(node)) {
    const inner = renderInlineSequence(node.children, options)
    const result = handlers['href']?.({
      raw: `\\href{${node.url}}{${inner}}`,
      name: 'href',
      hasStar: false,
      arg: node.url,
      arg2: inner
    })
    if (result != null) return renderInlineHandlerResult(result, options)
    return `[${inner}](${node.url})`
  }

  if (isImageNode(node)) {
    const result = handlers['includegraphics']?.({
      raw: `\\includegraphics${node.alt ? `[${node.alt}]` : ''}{${node.url}}`,
      name: 'includegraphics',
      hasStar: false,
      optionalArg: node.alt,
      arg: node.url
    })
    if (result != null) return renderInlineHandlerResult(result, options)
    return `![${node.alt || ''}](${node.url})`
  }

  if (isMathInlineNode(node)) return `$${node.content}$`

  if (isStrikethroughNode(node)) {
    const inner = renderInlineSequence(node.children, options)
    const result = handlers['sout']?.({ raw: `\\sout{${inner}}`, name: 'sout', hasStar: false, arg: inner })
    if (result != null) return renderInlineHandlerResult(result, options)
    return `~~${inner}~~`
  }

  if (node.type === 'unknown_inline') {
    const handled = handleUnknownInline(node.raw, options)
    if (handled !== null) return handled
    return node.raw
  }
  return ''
}

function handleUnknownInline(
  raw: string,
  options?: LatexToMarkdownOptions
): string | null {
  const handlers = getEffectiveInlineMacroHandlers(options?.inlineMacros)
  const parsed = parseLatexMacroInvocation(raw)
  if (!parsed) return null
  const handler = handlers[parsed.name]
  if (!handler) return null
  const result = handler(parsed)
  return renderInlineHandlerResult(result, options)
}

function renderInlineHandlerResult(
  result: InlineMacroHandlerResult,
  options?: LatexToMarkdownOptions
): string | null {
  if (result == null) return null
  if (typeof result === 'string') return result
  if (Array.isArray(result)) return renderInlineSequence(result, options)
  return renderInline(result, options)
}

