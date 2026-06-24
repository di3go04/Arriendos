// scripts/fix-encoding.js
// Fix mojibake in JSON translation files by reinterpreting latin1/windows-1252
// bytes as proper UTF-8.
//
// Usage: node scripts/fix-encoding.js

const fs = require('fs')
const path = require('path')

// Try to load iconv-lite (preferred for Windows-1252 support)
let iconv
try {
  iconv = require('iconv-lite')
} catch {
  console.error('ERROR: iconv-lite is required. Run: npm install iconv-lite')
  process.exit(1)
}

// Search directories in order of precedence
const SEARCH_DIRS = [
  path.join(__dirname, '..', 'src', 'messages'),
  path.join(__dirname, '..', 'src', 'locales'),
  path.join(__dirname, '..', 'public', 'locales'),
]

function findLocalesDir() {
  for (const dir of SEARCH_DIRS) {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'))
      if (files.length > 0) {
        return dir
      }
    }
  }
  return null
}

function hasMojibake(str) {
  const suspicious = new Set([
    0x0192, 0x20AC, 0x2122, 0x201A, 0x201E, 0x2026,
    0x2020, 0x2021, 0x2030, 0x0160, 0x0152, 0x017D,
    0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2013,
    0x2014, 0x02DC, 0x0161, 0x203A, 0x0153, 0x017E, 0x0178,
  ])
  let count = 0
  let c3pattern = 0
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i)
    if (suspicious.has(c)) count++
    if (c === 0x00C3 && i + 1 < str.length && str.charCodeAt(i + 1) > 0x7F) c3pattern++
  }
  return count > 20 || c3pattern > 50
}

function fixFile(filePath) {
  const raw = fs.readFileSync(filePath)
  const original = raw.toString('utf8')

  if (!hasMojibake(original)) {
    console.log(`  SKIP: no mojibake detected — ${path.basename(filePath)}`)
    return false
  }

  // Iterative fix: decode as UTF-8, encode as Windows-1252, repeat
  let current = original
  const rounds = []
  for (let r = 1; r <= 12; r++) {
    const prev = current
    const encoded = iconv.encode(current, 'win1252')
    current = Buffer.from(encoded).toString('utf8')
    rounds.push({ round: r, text: current, repCount: (current.match(/\uFFFD/g) || []).length })
    if (current === prev) break
  }

  // Pick the best round: minimize (highChars + repCount)
  let best = rounds[0]
  let bestScore = Infinity
  for (const r of rounds) {
    let highChars = 0
    for (let i = 0; i < r.text.length; i++) {
      if (r.text.charCodeAt(i) > 0x7F) highChars++
    }
    const score = highChars + r.repCount
    if (score < bestScore) {
      bestScore = score
      best = r
    }
  }

  // Only write if the text improved
  let origHigh = 0
  for (let i = 0; i < original.length; i++) {
    if (original.charCodeAt(i) > 0x7F) origHigh++
  }
  if (origHigh <= bestScore) {
    console.log(`  SKIP: already correct — ${path.basename(filePath)}`)
    return false
  }

  let output = best.text
  // Strip BOM
  if (output.charCodeAt(0) === 0xFEFF) {
    output = output.slice(1)
  }

  fs.writeFileSync(filePath, output, 'utf8')
  console.log(`  FIXED (${best.round} round(s)) — ${path.basename(filePath)}`)
  return true
}

function main() {
  const dir = findLocalesDir()
  if (!dir) {
    console.error('ERROR: Could not find locale directory.')
    console.error('Searched:')
    for (const d of SEARCH_DIRS) console.error(`  ${d}`)
    console.error('Create one of these directories with your JSON files and re-run.')
    process.exit(1)
  }

  console.log(`Found locale directory: ${dir}\n`)

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'))
  if (files.length === 0) {
    console.log('No JSON files found.')
    return
  }

  console.log(`Processing ${files.length} file(s)...\n`)
  let fixed = 0
  for (const file of files) {
    const filePath = path.join(dir, file)
    if (fixFile(filePath)) fixed++
  }
  console.log(`\nDone. ${fixed}/${files.length} file(s) fixed.`)
}

main()
