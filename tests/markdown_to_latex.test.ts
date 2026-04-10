/**
 * Markdown → LaTeX conversion tests.
 * Uses fixtures and explicit cases; no string regex hacks.
 */

import { describe, it, expect } from 'vitest'
import { markdownToLatex, markdownToAST } from '../src/index'
import * as fs from 'fs'
import * as path from 'path'

const FIXTURES_DIR = path.join(__dirname, 'fixtures')

function loadFixture(name: string): { markdown: string; latex: string } {
  const p = path.join(FIXTURES_DIR, `${name}.json`)
  const raw = fs.readFileSync(p, 'utf-8')
  return JSON.parse(raw) as { markdown: string; latex: string }
}

describe('Markdown → LaTeX', () => {
  it('heading: # Hello → \\section{Hello}', () => {
    const { markdown, latex } = loadFixture('heading')
    expect(markdownToLatex(markdown)).toBe(latex)
  })

  it('subsection: ## World → \\subsection{World}', () => {
    const { markdown, latex } = loadFixture('subsection')
    expect(markdownToLatex(markdown)).toBe(latex)
  })

  it('bold: **bold** → \\textbf{bold}', () => {
    const { markdown, latex } = loadFixture('bold')
    expect(markdownToLatex(markdown)).toBe(latex)
  })

  it('italic: *italic* → \\textit{italic}', () => {
    const { markdown, latex } = loadFixture('italic')
    expect(markdownToLatex(markdown)).toBe(latex)
  })

  it('inline code: `code` → \\texttt{code}', () => {
    const { markdown, latex } = loadFixture('inline_code')
    expect(markdownToLatex(markdown)).toBe(latex)
  })

  it('link: [text](url) → \\href{url}{text}', () => {
    const { markdown, latex } = loadFixture('link')
    expect(markdownToLatex(markdown)).toBe(latex)
  })

  it('image: ![alt](url) → \\includegraphics{url}', () => {
    const { markdown, latex } = loadFixture('image')
    expect(markdownToLatex(markdown)).toBe(latex)
  })

  it('heading with inline bold', () => {
    const md = '# Hello **world**'
    const ast = markdownToAST(md)
    expect(ast.children).toHaveLength(1)
    expect(ast.children[0].type).toBe('heading')
    const heading = ast.children[0] as { level: number; children: unknown[] }
    expect(heading.level).toBe(1)
    expect(heading.children.length).toBeGreaterThan(0)
    expect(markdownToLatex(md)).toBe('\\section{Hello \\textbf{world}}')
  })

  it('paragraph only (plain text)', () => {
    expect(markdownToLatex('Hello world')).toBe('Hello world')
  })

  it('code block → verbatim', () => {
    const md = '```\ncode\nline\n```'
    expect(markdownToLatex(md)).toBe(
      '\\begin{verbatim}\ncode\nline\n\\end{verbatim}'
    )
  })

  it('math block $$...$$ → \\[...\\]', () => {
    const md = '$$\nE=mc^2\n$$'
    expect(markdownToLatex(md)).toBe('\\[\nE=mc^2\n\\]')
  })

  it('inline math preserved as $...$', () => {
    const md = 'Say $E=mc^2$ here'
    expect(markdownToLatex(md)).toContain('$E=mc^2$')
  })

  it('unordered list → itemize', () => {
    const md = '- item1\n- item2'
    const out = markdownToLatex(md)
    expect(out).toContain('\\begin{itemize}')
    expect(out).toContain('\\end{itemize}')
    expect(out).toContain('\\item item1')
    expect(out).toContain('\\item item2')
  })

  it('GFM table → tabular', () => {
    const markdown = '## T\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n| 3 | 4 |\n'
    const latex =
      '\\subsection{T}\n\n\\begin{tabular}{l l}\n\\hline\nA & B \\\\\n\\hline\n1 & 2 \\\\\n3 & 4 \\\\\n\\hline\n\\end{tabular}'
    expect(markdownToLatex(markdown)).toBe(latex)
  })

  it('ordered list → enumerate', () => {
    const md = '1. first\n2. second'
    const out = markdownToLatex(md)
    expect(out).toContain('\\begin{enumerate}')
    expect(out).toContain('\\end{enumerate}')
    expect(out).toContain('\\item first')
    expect(out).toContain('\\item second')
  })

  it('thematic break → \\hrulefill', () => {
    expect(markdownToLatex('---')).toBe('\\hrulefill')
  })

  it('blockquote → quote environment', () => {
    const md = '> quoted'
    const out = markdownToLatex(md)
    expect(out).toContain('\\begin{quote}')
    expect(out).toContain('\\end{quote}')
  })

  it('empty input → empty body', () => {
    expect(markdownToLatex('')).toBe('')
    expect(markdownToLatex('   \n\n  ')).toBe('')
  })

  it('escapes LaTeX special chars in text', () => {
    const md = 'Price: 100% & 50_2'
    const out = markdownToLatex(md)
    expect(out).toContain('\\%')
    expect(out).toContain('\\&')
    expect(out).toContain('\\_')
  })

  it('inline code with backslash: `\\section` → \\texttt{\\textbackslash{}section} (avoids undefined control sequence)', () => {
    expect(markdownToLatex('`\\section`')).toBe('\\texttt{\\textbackslash{}section}')
    expect(markdownToLatex('`\\textbf`')).toBe('\\texttt{\\textbackslash{}textbf}')
  })

  it('LaTeX feature list: backslash commands in inline code use \\textbackslash{} so LaTeX compiles', () => {
    const md = `**LaTeX**

* \`\\section\`
* \`\\textbf\`
* \`\\textit\`
* \`itemize\`
* \`enumerate\`
* \`verbatim\`
* \`\\href\`
* \`\\includegraphics\`
* \`\\[\` \`\\]\` 数学环境`
    const latex = markdownToLatex(md)
    // Backslash in \\texttt must be \\textbackslash{} so \\textbackslash + letter is not read as one macro
    expect(latex).toContain('\\textbackslash{}section')
    expect(latex).toContain('\\textbackslash{}textbf')
    expect(latex).toContain('\\textbackslash{}textit')
    expect(latex).toContain('\\textbackslash{}href')
    expect(latex).toContain('\\textbackslash{}includegraphics')
    expect(latex).toContain('\\textbackslash{}[')
    expect(latex).toContain('\\textbackslash{}]')
    // Plain words without backslash stay as-is in \\texttt
    expect(latex).toContain('\\texttt{itemize}')
    expect(latex).toContain('\\texttt{enumerate}')
    expect(latex).toContain('\\texttt{verbatim}')
  })

  it('performance: 5000+ lines under 400ms', () => {
    const lines = Array.from({ length: 5000 }, (_, i) => `# Heading ${i}\n\nParagraph with **bold** and *italic*.\n`)
    const md = lines.join('\n')
    const start = performance.now()
    const out = markdownToLatex(md)
    const elapsed = performance.now() - start
    expect(out.length).toBeGreaterThan(0)
    expect(elapsed).toBeLessThan(400)
  })
})
