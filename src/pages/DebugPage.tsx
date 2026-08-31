import { useEffect, useState } from 'react'
import { probeEngine, type EngineProbeResult } from '@/lib/engine/probe'
import { repertoireNoir } from '@/lib/loadRepertoire'
import { repertoireStats } from '@/lib/repertoire'
import { currentVersion, seedRepertoire } from '@/lib/seedRepertoire'
import { useAuth } from '@/features/auth/AuthProvider'
import { ThemeToggle } from '@/components/ThemeToggle'

type Status = 'pending' | 'ok' | 'error'

function Light({ status }: { status: Status }) {
  const color =
    status === 'ok' ? 'bg-green' : status === 'error' ? 'bg-red' : 'bg-muted animate-pulse'
  return <span className={`inline-block size-2.5 rounded-full ${color}`} />
}

function Card({
  title,
  status,
  children,
}: {
  title: string
  status: Status
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
        <Light status={status} />
        {title}
      </h2>
      <div className="space-y-1 font-mono text-sm">{children}</div>
    </section>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-muted">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  )
}

export function DebugPage() {
  const { session, signOut } = useAuth()
  const stats = repertoireStats(repertoireNoir)

  const [engine, setEngine] = useState<EngineProbeResult | null>(null)
  const [engineError, setEngineError] = useState('')

  const [dbVersion, setDbVersion] = useState<number | null | 'loading'>('loading')
  const [dbError, setDbError] = useState('')
  const [seeding, setSeeding] = useState(false)

  useEffect(() => {
    probeEngine()
      .then(setEngine)
      .catch((e: Error) => setEngineError(e.message))
  }, [])

  useEffect(() => {
    currentVersion('b')
      .then(setDbVersion)
      .catch((e: Error) => {
        setDbError(e.message)
        setDbVersion(null)
      })
  }, [])

  async function onSeed() {
    setSeeding(true)
    setDbError('')
    try {
      const result = await seedRepertoire(repertoireNoir, 'b', 'étude lichess « Répertoire Noir »')
      setDbVersion(result.version)
    } catch (e) {
      setDbError((e as Error).message)
    } finally {
      setSeeding(false)
    }
  }

  const engineStatus: Status = engine ? 'ok' : engineError ? 'error' : 'pending'
  const repertoireStatus: Status =
    stats.chapters === 17 && stats.lines === 241 ? 'ok' : 'error'
  const dbStatus: Status =
    dbVersion === 'loading' ? 'pending' : dbError ? 'error' : dbVersion ? 'ok' : 'pending'

  return (
    <div className="mx-auto max-w-3xl p-6">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Ouvertures Lab</h1>
          <p className="font-mono text-xs tracking-widest text-muted uppercase">
            Phase 0 — socle · /debug
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm transition hover:border-accent"
          >
            Déconnexion
          </button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card title="Moteur" status={engineStatus}>
          {engine ? (
            <>
              <Row label="état" value={<strong className="text-green">moteur prêt</strong>} />
              <Row label="uciok en" value={`${engine.ms} ms`} />
              <Row label="build" value={engine.name || 'stockfish 18 lite'} />
            </>
          ) : engineError ? (
            <p className="text-red">{engineError}</p>
          ) : (
            <p className="text-muted">démarrage du worker…</p>
          )}
        </Card>

        <Card title="Répertoire" status={repertoireStatus}>
          <Row
            label="chargé"
            value={
              <strong className="text-green">
                {stats.chapters} chapitres, {stats.lines} lignes
              </strong>
            }
          />
          <Row label="étude" value={stats.study} />
          <Row label="nœuds" value={stats.nodes} />
          <Row label="positions uniques" value={stats.uniquePositions} />
          <Row label="profondeur max" value={`${stats.maxDepth} demi-coups`} />
        </Card>

        <Card title="Session" status={session ? 'ok' : 'pending'}>
          <Row label="connecté" value={session ? 'oui' : 'non'} />
          <Row label="e-mail" value={session?.user.email ?? '—'} />
        </Card>

        <Card title="Base Supabase" status={dbStatus}>
          <Row
            label="répertoire noir"
            value={
              dbVersion === 'loading'
                ? '…'
                : dbVersion
                  ? `version ${dbVersion}`
                  : 'absent de la base'
            }
          />
          {dbError && <p className="text-red">{dbError}</p>}
          <button
            type="button"
            onClick={() => void onSeed()}
            disabled={seeding}
            className="mt-2 w-full rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition disabled:opacity-50"
          >
            {seeding ? 'Envoi…' : dbVersion && dbVersion !== 'loading' ? 'Resynchroniser' : 'Seed'}
          </button>
        </Card>

        <Card title="Annotations de l’étude" status="ok">
          <Row label="nœuds avec flèches" value={stats.withArrows} />
          <Row label="nœuds avec cercles" value={stats.withCircles} />
          <Row label="nœuds avec NAGs" value={stats.withNags} />
          <Row label="nœuds commentés" value={stats.withComment} />
        </Card>
      </div>
    </div>
  )
}
