// scripts/strip-bom.js
// Strip Byte Order Mark (BOM, U+FEFF) from all JSON translation files.
// Next.js/Turbopack cannot parse JSON that starts with a BOM.
//
// Usage: node scripts/strip-bom.js

const fs = require('fs')
const path = require('path')

const SEARCH_DIRS = [
  path.join(__dirname, '..', 'src', 'messages'),
  path.join(__dirname, '..', 'src', 'locales'),
  path.join(__dirname, '..', 'public', 'locales'),
]

function findLocalesDir() {
  for (const dir of SEARCH_DIRS) {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'))
      if (files.length > 0) return dir
    }
  }
  return null
}

function stripBom(filePath) {
  const raw = fs.readFileSync(filePath)
  if (raw.length === 0) return false

  if (raw[0] === 0xEF && raw[1] === 0xBB && raw[2] === 0xBF) {
    const withoutBom = raw.slice(3)
    fs.writeFileSync(filePath, withoutBom, 'utf8')
    console.log(`  STRIPPED BOM — ${path.basename(filePath)}`)
    return true
  }

  if (raw.toString('utf8', 0, 1).charCodeAt(0) === 0xFEFF) {
    const withoutBom = raw.slice(3)
    fs.writeFileSync(filePath, withoutBom, 'utf8')
    console.log(`  STRIPPED BOM (U+FEFF) — ${path.basename(filePath)}`)
    return true
  }

  return false
}

function main() {
  const dir = findLocalesDir()
  if (!dir) {
    console.error('ERROR: Could not find locale directory.')
    console.error('Searched:')
    for (const d of SEARCH_DIRS) console.error(`  ${d}`)
    process.exit(1)
  }

  console.log(`Scanning: ${dir}\n`)

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'))
  if (files.length === 0) {
    console.log('No JSON files found.')
    return
  }

  console.log(`Checking ${files.length} file(s) for BOM...\n`)
  let stripped = 0
  for (const file of files) {
    const filePath = path.join(dir, file)
    if (stripBom(filePath)) stripped++
  }

  if (stripped === 0) {
    console.log('No BOM found. All files are clean.')
  } else {
    console.log(`\nDone. ${stripped}/${files.length} file(s) had BOM stripped.`)
  }
}

main()
