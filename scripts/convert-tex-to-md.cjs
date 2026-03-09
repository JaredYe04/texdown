/**
 * Convert all .tex files in tests/fixtures/tex to Markdown and write to tests/fixtures/tex-to-md.
 * Run: npm run convert-tex  (builds first, then converts)
 * Or:  node scripts/convert-tex-to-md.cjs  (after npm run build)
 */

const path = require('path')
const fs = require('fs')

const repoRoot = path.join(__dirname, '..')
const inputDir = path.join(repoRoot, 'tests', 'fixtures', 'tex')
const outputDir = path.join(repoRoot, 'tests', 'fixtures', 'tex-to-md')

function main() {
  if (!fs.existsSync(inputDir)) {
    fs.mkdirSync(inputDir, { recursive: true })
    const readme = `# LaTeX test files

Put your .tex files here, then run:

  npm run convert-tex

Converted Markdown will be written to tests/fixtures/tex-to-md/ with the same base name (.md).
`
    fs.writeFileSync(path.join(inputDir, 'README.md'), readme, 'utf8')
    console.log('Created', inputDir)
    console.log('Add .tex files there and run: npm run convert-tex')
    return
  }

  let latexToMarkdown
  try {
    latexToMarkdown = require(path.join(repoRoot, 'dist', 'index.js')).latexToMarkdown
  } catch (e) {
    console.error('Build required. Run: npm run build')
    console.error(e.message)
    process.exit(1)
  }
  const files = fs.readdirSync(inputDir).filter((f) => f.endsWith('.tex'))
  if (files.length === 0) {
    console.log('No .tex files in tests/fixtures/tex. Add some and run again.')
    return
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  for (const f of files) {
    const inputPath = path.join(inputDir, f)
    const tex = fs.readFileSync(inputPath, 'utf8')
    const md = latexToMarkdown(tex)
    const base = path.basename(f, '.tex')
    const outPath = path.join(outputDir, base + '.md')
    fs.writeFileSync(outPath, md, 'utf8')
    console.log('Converted', f, '->', path.relative(repoRoot, outPath))
  }
  console.log('Done. Output folder:', path.relative(repoRoot, outputDir))
}

main()
