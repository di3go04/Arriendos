/**
 * fix-encoding.mjs — Elimina BOM y fuerza UTF-8 sin BOM en todos los JSON de messages
 * Uso: node scripts/fix-encoding.mjs
 */
import { readdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const DIR = 'src/messages'
const BOM = '\uFEFF'

let fixed = 0
let ok = 0

for (const file of readdirSync(DIR)) {
  if (!file.endsWith('.json')) continue
  const filepath = join(DIR, file)
  const content = readFileSync(filepath, 'utf-8')

  if (content.startsWith(BOM)) {
    // Remove BOM and re-save as UTF-8 without BOM
    writeFileSync(filepath, content.slice(1), 'utf-8')
    console.log(`✅ BOM eliminado: ${file}`)
    fixed++
  } else {
    // Already clean, re-save to ensure UTF-8
    writeFileSync(filepath, content, 'utf-8')
    console.log(`✓ Sin BOM: ${file}`)
    ok++
  }
}

console.log(`\nResumen: ${fixed} corregidos, ${ok} ya limpios`)
