/**
 * Preuve de vie du moteur (critère de sortie Phase 0).
 *
 * Piège CLAUDE.md #3 : le worker DOIT être same-origin et le `.wasm` est
 * résolu relativement au script — d'où `public/engine/` alimenté par
 * `scripts/copy-engine.mjs`. La variante « lite-single » est mono-thread et
 * ne réclame aucun header COOP/COEP.
 *
 * Le protocole UCI complet (file d'analyse, parsing des `info … score …`)
 * arrive en Phase 4 ; ici on se contente de `uci` → `uciok`.
 */

export const ENGINE_URL = '/engine/stockfish-18-lite-single.js'

export interface EngineProbeResult {
  ready: boolean
  /** Ligne `id name …` renvoyée par le moteur. */
  name: string
  /** Millisecondes entre le lancement du worker et `uciok`. */
  ms: number
}

export function probeEngine(timeoutMs = 15_000): Promise<EngineProbeResult> {
  return new Promise((resolve, reject) => {
    const started = performance.now()
    let worker: Worker
    try {
      worker = new Worker(ENGINE_URL)
    } catch (cause) {
      reject(new Error(`Worker non démarrable depuis ${ENGINE_URL}`, { cause }))
      return
    }

    let name = ''
    const done = (fn: () => void) => {
      clearTimeout(timer)
      worker.terminate()
      fn()
    }
    const timer = setTimeout(
      () => done(() => reject(new Error(`Pas de « uciok » après ${timeoutMs} ms`))),
      timeoutMs,
    )

    worker.onerror = (event) =>
      done(() => reject(new Error(event.message || 'erreur du worker moteur')))

    worker.onmessage = (event: MessageEvent) => {
      const line = typeof event.data === 'string' ? event.data : String(event.data)
      if (line.startsWith('id name')) name = line.slice('id name'.length).trim()
      if (line.trim() === 'uciok') {
        done(() => resolve({ ready: true, name, ms: Math.round(performance.now() - started) }))
      }
    }

    worker.postMessage('uci')
  })
}
