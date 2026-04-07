/**
 * LaTeX → Markdown conversion tests.
 */

import { describe, it, expect } from 'vitest'
import { latexToMarkdown, latexToAST } from '../src/index'
import * as fs from 'fs'
import * as path from 'path'

const FIXTURES_DIR = path.join(__dirname, 'fixtures')

function loadFixture(name: string): { markdown: string; latex: string } {
  const p = path.join(FIXTURES_DIR, `${name}.json`)
  const raw = fs.readFileSync(p, 'utf-8')
  return JSON.parse(raw) as { markdown: string; latex: string }
}

describe('LaTeX → Markdown', () => {
  it('\\section{Hello} → # Hello', () => {
    const { markdown, latex } = loadFixture('heading')
    expect(latexToMarkdown(latex)).toBe(markdown)
  })

  it('\\subsection{World} → ## World', () => {
    const { markdown, latex } = loadFixture('subsection')
    expect(latexToMarkdown(latex)).toBe(markdown)
  })

  it('\\textbf{bold} → **bold**', () => {
    const { markdown, latex } = loadFixture('bold')
    expect(latexToMarkdown(latex)).toBe(markdown)
  })

  it('\\textit{italic} → *italic*', () => {
    const { markdown, latex } = loadFixture('italic')
    expect(latexToMarkdown(latex)).toBe(markdown)
  })

  it('\\texttt{code} → `code`', () => {
    const { markdown, latex } = loadFixture('inline_code')
    expect(latexToMarkdown(latex)).toBe(markdown)
  })

  it('\\texttt{\\textbackslash} → `\\` (backslash in code)', () => {
    expect(latexToMarkdown('\\texttt{\\textbackslash}')).toBe('`\\`')
  })

  it('\\texttt{\\textbackslash{}} → `\\` (backslash in code, brace form)', () => {
    expect(latexToMarkdown('\\texttt{\\textbackslash{}}')).toBe('`\\`')
  })

  it('\\textbackslash alone → \\ (plain backslash)', () => {
    expect(latexToMarkdown('\\textbackslash')).toBe('\\')
  })

  it('\\verb|\\| → \\ (verb backslash)', () => {
    expect(latexToMarkdown('\\verb|\\|')).toBe('\\')
  })

  it('\\href{url}{text} → [text](url)', () => {
    const { markdown, latex } = loadFixture('link')
    expect(latexToMarkdown(latex)).toBe(markdown)
  })

  it('\\includegraphics{url} → ![](url)', () => {
    const out = latexToMarkdown('\\includegraphics{img.png}')
    expect(out).toContain('](img.png)')
    expect(out).toMatch(/!\[.*\]\(img\.png\)/)
  })

  it('verbatim → code block', () => {
    const latex = '\\begin{verbatim}\ncode\n\\end{verbatim}'
    const md = latexToMarkdown(latex)
    expect(md).toContain('```')
    expect(md).toContain('code')
  })

  it('\\[ E=mc^2 \\] → math block', () => {
    const latex = '\\[\nE=mc^2\n\\]'
    const md = latexToMarkdown(latex)
    expect(md).toContain('$$')
    expect(md).toContain('E=mc^2')
  })

  it('itemize → unordered list', () => {
    const latex = '\\begin{itemize}\n\\item a\n\\item b\n\\end{itemize}'
    const md = latexToMarkdown(latex)
    expect(md).toContain('- a')
    expect(md).toContain('- b')
  })

  it('enumerate → ordered list', () => {
    const latex = '\\begin{enumerate}\n\\item x\n\\item y\n\\end{enumerate}'
    const md = latexToMarkdown(latex)
    expect(md).toContain('1. x')
    expect(md).toContain('2. y')
  })

  it('\\eqref{eq:x} → [eq:x]', () => {
    const md = latexToMarkdown(String.raw`\eqref{eq:x} and \ref{eq:x}`)
    expect(md).toContain('[eq:x]')
    expect(md).not.toContain('\\eqref')
  })

  it('\\hrulefill → ---', () => {
    expect(latexToMarkdown('\\hrulefill')).toContain('---')
  })

  it('\\title{...} \\author{...} \\date{\\today} → heading + paragraphs', () => {
    const latex = `\\title{C# 语言全面解析：从入门到精通}
\\author{科技博客}
\\date{\\today}`
    const md = latexToMarkdown(latex)
    expect(md).toContain('# C# 语言全面解析：从入门到精通')
    expect(md).toContain('科技博客')
    expect(md).toContain('today')
    expect(md).not.toMatch(/\\\\title|\\\\author|\\\\date/)
  })

  it('strips \\begin{document} body only', () => {
    const full = '\\documentclass{article}\n\\begin{document}\n\\section{Hi}\n\\end{document}'
    const ast = latexToAST(full)
    expect(ast.children.length).toBeGreaterThanOrEqual(1)
    expect(latexToMarkdown(full)).toContain('Hi')
  })

  it('does not crash on unknown command (returns AST with unknown or safe node)', () => {
    const ast = latexToAST('\\unknowncommand{xyz}')
    expect(ast.type).toBe('document')
    expect(ast.children).toBeDefined()
  })

  it('empty input → empty string', () => {
    expect(latexToMarkdown('')).toBe('')
  })

  it('\\begin{table} with tabular → markdown table', () => {
    const latex = `\\begin{table}[H]
\\centering
\\caption{Notations}
\\begin{tabular}{c l c}
\\toprule[2pt]
\\multicolumn{1}{m{3cm}}{\\centering Symbol} & \\multicolumn{1}{l}{\\centering Unit} \\\\
\\midrule
$x$ & Sample matrix & - \\\\
$R$ & Sample correlation & -
\\end{tabular}
\\end{table}`
    const md = latexToMarkdown(latex)
    expect(md).toContain('|')
    expect(md).toContain('Symbol')
    expect(md).toContain('Sample matrix')
    expect(md).toContain('$x$')
    expect(md).not.toMatch(/\\\\begin\{table\}/)
  })

  it('\\\\ and \\qquad → line break and space', () => {
    const latex = 'Task 1\\\\\n\\qquad We use the method.'
    const md = latexToMarkdown(latex)
    expect(md).toContain('Task 1')
    expect(md).toContain('We use the method')
    expect(md).not.toMatch(/\\\\\\\\|\\\\qquad/)
  })

  it('\\begin{appendices} → ## Appendices + content', () => {
    const latex = `\\begin{appendices}
\\textbf{Code}
\\end{appendices}`
    const md = latexToMarkdown(latex)
    expect(md).toContain('## Appendices')
    expect(md).toContain('Code')
    expect(md).not.toMatch(/\\\\begin\{appendices\}/)
  })

  it('multi-line inline math in paragraph', () => {
    const latex = 'rate $\\frac{\\lambda_i}{x}$ and more'
    const md = latexToMarkdown(latex)
    expect(md).toContain('rate')
    expect(md).toContain('and more')
    expect(md).toMatch(/\$.*\\frac.*\$/);
  })

  it('table header row strips \\toprule[2pt], cells have Symbol not literal', () => {
    const latex = `\\begin{table}[H]
\\begin{tabular}{c l c}
\\toprule[2pt]
\\multicolumn{1}{m{3cm}}{\\centering Symbol} & \\multicolumn{1}{l}{\\centering Definitions} & \\multicolumn{1}{m{3cm}}{\\centering Unit} \\\\
\\midrule
$x$ & Sample matrix & -
\\end{tabular}
\\end{table}`
    const md = latexToMarkdown(latex)
    expect(md).toContain('Symbol')
    expect(md).toContain('Definitions')
    expect(md).toContain('Unit')
    expect(md).not.toMatch(/\\\\toprule|toprule\[2pt\]/)
    expect(md).toContain('$x$')
  })

  it('standalone \\begin{tabular} without table wrapper → markdown table', () => {
    const latex = `\\section{表格测试}
\\begin{tabular}{|l|c|r|}
\\hline
左对齐 & 居中 & 右对齐 \\\\
\\hline
A & B & C \\\\
\\hline
X & Y & Z \\\\
\\hline
\\end{tabular}`
    const md = latexToMarkdown(latex)
    expect(md).toContain('表格测试')
    expect(md).toContain('|')
    expect(md).toContain('左对齐')
    expect(md).toContain('居中')
    expect(md).toContain('右对齐')
    expect(md).toContain('A')
    expect(md).toContain('B')
    expect(md).toContain('C')
    expect(md).toContain('X')
    expect(md).toContain('Y')
    expect(md).toContain('Z')
    expect(md).not.toMatch(/\\\\begin\{tabular\}/)
    expect(md).not.toMatch(/\\\\end\{tabular\}/)
  })

  it('table cell with display math $$ R $$', () => {
    const latex = `\\begin{table}[H]
\\begin{tabular}{c c}
A & B \\\\
$$R$$ & Sample correlation \\\\
\\end{tabular}
\\end{table}`
    const md = latexToMarkdown(latex)
    expect(md).toMatch(/\$\$.*R.*\$\$/)
    expect(md).toContain('Sample correlation')
    expect(md).not.toMatch(/KaTeX|parse error/)
  })

  it('table cell $$x$$ and $$ P $$ not corrupted to $x or $P', () => {
    const latex = `\\begin{table}[H]
\\begin{tabular}{c c}
\\toprule[2pt]
Symbol & Def \\\\
\\midrule
$$x$$ & Sample matrix \\\\
$$P$$ & Posibility \\\\
\\end{tabular}
\\end{table}`
    const md = latexToMarkdown(latex)
    expect(md).toMatch(/\$\$[^$]*x[^$]*\$\$/)
    expect(md).toMatch(/\$\$[^$]*P[^$]*\$\$/)
    expect(md).not.toMatch(/\|\s*\$\s*x\s*\||\|\s*\$\s*P\s*\|/)
  })

  it('$\\\\#$ in text outputs backslash so KaTeX can render', () => {
    const latex = 'Team $\\#$2405186'
    const md = latexToMarkdown(latex)
    expect(md).toContain('Team')
    expect(md).toContain('2405186')
    expect(md).toMatch(/\\#/)
  })

  it('\\\\ and comment then \\qquad on next line', () => {
    const latex = `Task 1\\\\
%% comment line
\\qquad We use the weighted assignment method.`
    const md = latexToMarkdown(latex)
    expect(md).toContain('Task 1')
    expect(md).toContain('We use the weighted assignment method')
    expect(md).not.toMatch(/\\\\\\\\|\\\\qquad|%%/)
  })

  it('\\begin{flushleft} with \\textbf → converted not literal', () => {
    const latex = `\\begin{flushleft}
\\textbf{To: Tennis Coaches}
\\textbf{From: Team \\# 2405186}
\\end{flushleft}`
    const md = latexToMarkdown(latex)
    expect(md).toContain('To: Tennis Coaches')
    expect(md).toContain('From: Team # 2405186')
    expect(md).not.toMatch(/\\\\begin\{flushleft\}|\\\\end\{flushleft\}/)
  })

  it('\\hfill and $\\#$ in letter', () => {
    const latex = `\\begin{letter}{Memo}
\\hfill Yours Sincerely,
\\hfill Team $\\#$2405186
\\end{letter}`
    const md = latexToMarkdown(latex)
    expect(md).toContain('Yours Sincerely')
    expect(md).toContain('Team')
    expect(md).toContain('2405186')
    expect(md).not.toMatch(/\\\\hfill/)
    expect(md).toMatch(/\\$\\\\#\\$|#/) // $\#$ or # preserved
  })

  it('strips \\bibliographystyle and \\bibliography', () => {
    const latex = `Text.
\\bibliographystyle{plain}
\\bibliography{ref.bib}
More.`
    const md = latexToMarkdown(latex)
    expect(md).toContain('Text')
    expect(md).toContain('More')
    expect(md).not.toMatch(/\\\\bibliographystyle|\\\\bibliography/)
  })
})
