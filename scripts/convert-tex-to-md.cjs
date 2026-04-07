/**
 * Convert all .tex files under tests/fixtures/tex (recursively) to Markdown under tests/fixtures/tex-to-md,
 * preserving subdirectory structure.
 * Run: npm run convert-tex  (builds first, then converts)
 * Or:  node scripts/convert-tex-to-md.cjs  (after npm run build)
 */

const path = require('path')
const fs = require('fs')

const repoRoot = path.join(__dirname, '..')
const inputDir = path.join(repoRoot, 'tests', 'fixtures', 'tex')
const outputDir = path.join(repoRoot, 'tests', 'fixtures', 'tex-to-md')

/** Collect paths relative to `root` for every `.tex` file under `root`. */
function collectTexFilesRelative(root) {
  const results = []
  function walk(currentAbs, relFromRoot) {
    let entries
    try {
      entries = fs.readdirSync(currentAbs, { withFileTypes: true })
    } catch {
      return
    }
    for (const ent of entries) {
      const name = ent.name
      const rel = relFromRoot ? path.join(relFromRoot, name) : name
      const full = path.join(currentAbs, name)
      if (ent.isDirectory()) {
        walk(full, rel)
      } else if (ent.isFile() && name.endsWith('.tex')) {
        results.push(rel)
      }
    }
  }
  walk(root, '')
  return results
}

function main() {
  if (!fs.existsSync(inputDir)) {
    fs.mkdirSync(inputDir, { recursive: true })
    const readme = `# LaTeX test files

Put your .tex files here (nested subfolders are OK), then run:

  npm run convert-tex

Converted Markdown will be written to tests/fixtures/tex-to-md/ mirroring this folder tree (.md per .tex).
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

  const relPaths = collectTexFilesRelative(inputDir)
  if (relPaths.length === 0) {
    console.log('No .tex files under tests/fixtures/tex. Add some and run again.')
    return
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  for (const rel of relPaths) {
    const inputPath = path.join(inputDir, rel)
    const tex = fs.readFileSync(inputPath, 'utf8')
    const md = latexToMarkdown(tex)
    const outRel = rel.replace(/\.tex$/i, '.md')
    const outPath = path.join(outputDir, outRel)
    fs.mkdirSync(path.dirname(outPath), { recursive: true })
    fs.writeFileSync(outPath, md, 'utf8')
    console.log('Converted', path.relative(repoRoot, inputPath), '->', path.relative(repoRoot, outPath))
  }
  console.log('Done. Output folder:', path.relative(repoRoot, outputDir))
}

main()
