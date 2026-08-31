// Copie le build Stockfish lite single-thread depuis node_modules vers public/engine/.
// Piège CLAUDE.md #3 : le .wasm est résolu RELATIVEMENT au script -> les deux fichiers
// doivent rester côte à côte, servis en same-origin. La variante "lite-single" ne
// requiert aucun header COOP/COEP.
import { copyFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'node_modules', 'stockfish', 'bin')
const dest = join(root, 'public', 'engine')
const files = ['stockfish-18-lite-single.js', 'stockfish-18-lite-single.wasm']

if (!existsSync(src)) {
  console.warn('[engine] node_modules/stockfish absent, copie ignorée.')
  process.exit(0)
}
mkdirSync(dest, { recursive: true })
for (const f of files) {
  const from = join(src, f)
  if (!existsSync(from)) {
    console.error(`[engine] introuvable: ${from}`)
    process.exit(1)
  }
  copyFileSync(from, join(dest, f))
  console.log(`[engine] ${f} -> public/engine/`)
}
