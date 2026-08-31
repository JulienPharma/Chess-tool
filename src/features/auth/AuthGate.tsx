import type { ReactNode } from 'react'
import { useAuth } from './AuthProvider'
import { LoginPage } from '@/pages/LoginPage'

export function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) {
    return <div className="grid min-h-full place-items-center text-sm text-muted">Chargement…</div>
  }
  return session ? <>{children}</> : <LoginPage />
}
