import { describe, it, expect } from 'vitest'
import type { InlineNode } from '../src/ast/nodes'
import {
  latexToMarkdown,
  type InlineMacroHandler,
  type LatexToMarkdownOptions
} from '../src/index'

describe('LaTeX → Markdown: custom macro handlers', () => {
  it('keeps existing behaviour when no options provided', () => {
    const md = latexToMarkdown('\\myunknown{X}')
    expect(md).toContain('\\myunknown{X}')
  })

  it('handles simple custom macro to bold inner text (string result)', () => {
    const options: LatexToMarkdownOptions = {
      inlineMacros: {
        mybold: (m) => {
          return m.arg ? `**${m.arg}**` : m.raw
        }
      }
    }
    const md = latexToMarkdown('\\mybold{自定义宏}', options)
    expect(md).toBe('**自定义宏**')
  })

  it('handler receives name / arg / optionalArg / hasStar', () => {
    const seen: {
      name?: string
      arg?: string
      optionalArg?: string
      hasStar?: boolean
    } = {}

    const options: LatexToMarkdownOptions = {
      inlineMacros: {
        colorbox: (m) => {
          seen.name = m.name
          seen.arg = m.arg
          seen.optionalArg = m.optionalArg
          seen.hasStar = m.hasStar
          return `[${m.optionalArg}](${m.arg})`
        }
      }
    }

    const md = latexToMarkdown('\\colorbox*[RGB]{red}{X}', options)
    expect(md).toContain('[RGB](red)')
    expect(seen.name).toBe('colorbox')
    expect(seen.arg).toBe('red')
    expect(seen.optionalArg).toBe('RGB')
    expect(seen.hasStar).toBe(true)
  })

  it('handler can return InlineNode[] for complex inline composition', () => {
    const options: LatexToMarkdownOptions = {
      inlineMacros: {
        mypair: (m) => {
          const children: InlineNode[] = [
            { type: 'text', value: '[' },
            { type: 'strong', children: [{ type: 'text', value: m.arg || '' }] },
            { type: 'text', value: ']' }
          ]
          return children
        }
      }
    }

    const md = latexToMarkdown('Value: \\mypair{X}', options)
    expect(md).toBe('Value: [**X**]')
  })

  it('supports multiple custom macros configured in batch', () => {
    const options: LatexToMarkdownOptions = {
      inlineMacros: {
        macroA: (m) => `<<${m.arg || ''}>>`,
        macroB: (m) => `[[${m.arg || ''}]]`
      }
    }

    const md = latexToMarkdown(
      '\\macroA{foo} and \\macroB{bar} and \\macroC{baz}',
      options
    )
    expect(md).toContain('<<foo>>')
    expect(md).toContain('[[bar]]')
    expect(md).toContain('\\macroC{baz}')
  })

  it('handler returning null falls back to raw output', () => {
    const options: LatexToMarkdownOptions = {
      inlineMacros: {
        ignoreme: () => null
      }
    }
    const md = latexToMarkdown('a \\ignoreme{X} b', options)
    expect(md).toContain('\\ignoreme{X}')
  })

  it('macro without braces is still passed to handler', () => {
    const options: LatexToMarkdownOptions = {
      inlineMacros: {
        foo: (m) => `FOO(${m.raw})`
      }
    }
    const md = latexToMarkdown('test \\foo more', options)
    expect(md).toBe('test FOO(\\foo) more')
  })

  it('nested content inside arg is not broken (best-effort brace parsing)', () => {
    const options: LatexToMarkdownOptions = {
      inlineMacros: {
        wrap: (m) => `«${m.arg}»`
      }
    }
    const md = latexToMarkdown('\\wrap{a {b} c}', options)
    expect(md).toBe('«a {b} c»')
  })

  it('combines built-in inline nodes with custom macros in one paragraph', () => {
    const options: LatexToMarkdownOptions = {
      inlineMacros: {
        emphX: (m) => {
          return {
            type: 'emphasis',
            children: [{ type: 'text', value: m.arg || '' }]
          }
        }
      }
    }
    const md = latexToMarkdown('前缀 \\emphX{内容} 后缀', options)
    expect(md).toBe('前缀 *内容* 后缀')
  })

  it('custom macro in list item content', () => {
    const options: LatexToMarkdownOptions = {
      inlineMacros: {
        badge: (m) => `[[${m.arg || ''}]]`
      }
    }
    const md = latexToMarkdown(
      '\\begin{itemize}\n\\item Task \\badge{done}\n\\end{itemize}',
      options
    )
    expect(md).toContain('- Task [[done]]')
  })

  describe('built-in macro override (regression: default unchanged)', () => {
    it('\\textbf{} → **bold** by default', () => {
      expect(latexToMarkdown('\\textbf{bold}')).toBe('**bold**')
    })
    it('\\textit{} and \\emph{} → *italic* by default', () => {
      expect(latexToMarkdown('\\textit{italic}')).toBe('*italic*')
      expect(latexToMarkdown('\\emph{emph}')).toBe('*emph*')
    })
    it('\\texttt{} → `code` by default', () => {
      expect(latexToMarkdown('\\texttt{code}')).toBe('`code`')
    })
    it('\\sout{} → ~~strikethrough~~ by default', () => {
      expect(latexToMarkdown('\\sout{del}')).toBe('~~del~~')
    })
    it('\\href{url}{text} → [text](url) by default', () => {
      expect(latexToMarkdown('\\href{https://x.com}{link}')).toBe('[link](https://x.com)')
    })
    it('\\includegraphics{path} → ![](path) by default', () => {
      const md = latexToMarkdown('\\includegraphics{img.png}')
      expect(md).toMatch(/!\[.*\]\(img\.png\)/)
    })
  })

  describe('built-in macro override (user overrides)', () => {
    it('override textbf to HTML strong', () => {
      const options: LatexToMarkdownOptions = {
        inlineMacros: {
          textbf: (m) => `<strong>${m.arg ?? ''}</strong>`
        }
      }
      expect(latexToMarkdown('\\textbf{bold}', options)).toBe('<strong>bold</strong>')
    })
    it('override emph to underline-like span', () => {
      const options: LatexToMarkdownOptions = {
        inlineMacros: {
          emph: (m) => `[${m.arg ?? ''}]{.underline}`
        }
      }
      expect(latexToMarkdown('\\emph{important}', options)).toBe('[important]{.underline}')
    })
    it('override texttt to code block style', () => {
      const options: LatexToMarkdownOptions = {
        inlineMacros: {
          texttt: (m) => `\`\`${m.arg ?? ''}\`\``
        }
      }
      expect(latexToMarkdown('\\texttt{var}', options)).toBe('``var``')
    })
    it('override sout to remove strikethrough', () => {
      const options: LatexToMarkdownOptions = {
        inlineMacros: {
          sout: (m) => m.arg ?? ''
        }
      }
      expect(latexToMarkdown('\\sout{removed}', options)).toBe('removed')
    })
    it('override href to custom link format', () => {
      const options: LatexToMarkdownOptions = {
        inlineMacros: {
          href: (m) => `→ ${m.arg2 ?? ''} (${m.arg ?? ''})`
        }
      }
      expect(latexToMarkdown('\\href{https://a.com}{Click}', options)).toBe(
        '→ Click (https://a.com)'
      )
    })
    it('override includegraphics to custom image syntax', () => {
      const options: LatexToMarkdownOptions = {
        inlineMacros: {
          includegraphics: (m) => `{{${m.arg ?? ''}}}`
        }
      }
      const md = latexToMarkdown('\\includegraphics{fig.png}', options)
      expect(md).toBe('{{fig.png}}')
    })
  })
})

