import type { ReactNode } from 'react'
import { useAuth } from './AuthProvider'
import { LoginPage } from '@/pages/LoginPage'
import { isSupabaseConfigured, missingSupabaseEnv } from '@/lib/supabase'

function ConfigError() {
  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="max-w-md rounded-2xl border border-red/40 bg-surface p-8">
        <h1 className="mb-2 text-xl font-semibold text-red">Configuration incomplète</h1>
        <p className="mb-4 text-sm text-muted">
          Variable{missingSupabaseEnv.length > 1 ? 's' : ''} d’environnement manquante
          {missingSupabaseEnv.length > 1 ? 's' : ''} :
        </p>
        <ul className="mb-4 space-y-1 font-mono text-sm">
          {missingSupabaseEnv.map((name) => (
            <li key={name}>· {name}</li>
          ))}
        </ul>
        <p className="text-sm text-muted">
          En local : copie <code className="font-mono">.env.local.example</code> en{' '}
          <code className="font-mono">.env.local</code>. Sur Vercel : Project Settings →
          Environment Variables, puis redéploie.
        </p>
      </div>
    </div>
  )
}

export function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  if (!isSupabaseConfigured) return <ConfigError />
  if (loading) {
    return <div className="grid min-h-full place-items-center text-sm text-muted">Chargement…</div>
  }
  return session ? <>{children}</> : <LoginPage />
}
