// Garde-fou de build : `public/engine/` est généré (gitignoré), donc un
// postinstall bloqué ou une copie ratée produirait un déploiement qui BUILD
// mais dont le moteur renvoie 404 à l'exécution. On échoue ici plutôt qu'en prod.
import { existsSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const required = [
  'index.html',
  'engine/stockfish-18-lite-single.js',
  'engine/stockfish-18-lite-single.wasm',
]

const missing = required.filter((f) => !existsSync(join(dist, f)))
if (missing.length > 0) {
  console.error('\n[build] Fichiers absents de dist/ :')
  for (const f of missing) console.error(`  - ${f}`)
  console.error('\nLance `npm run engine:copy` puis rebuild.\n')
  process.exit(1)
}

const wasm = statSync(join(dist, 'engine/stockfish-18-lite-single.wasm'))
if (wasm.size < 100_000) {
  console.error(`[build] wasm suspect : ${wasm.size} octets`)
  process.exit(1)
}
console.log(`[build] OK — moteur présent (${(wasm.size / 1e6).toFixed(1)} Mo)`)
