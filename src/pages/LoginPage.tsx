import { useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { authErrorMessage } from '@/lib/authErrors'
import { ThemeToggle } from '@/components/ThemeToggle'

type Mode = 'signin' | 'signup'

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')

    const { data, error: authError } =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    if (authError) {
      setError(authErrorMessage(authError.message))
    } else if (mode === 'signup' && !data.session) {
      // Supabase a créé le compte mais exige une confirmation par e-mail.
      setNotice(
        'Compte créé, mais Supabase attend une confirmation par e-mail. Désactive « Confirm email » dans Authentication → Providers → Email, puis connecte-toi.',
      )
      setMode('signin')
    }
    // Succès : onAuthStateChange bascule l'app, rien à faire ici.
    setBusy(false)
  }

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-between">
          <span className="font-mono text-xs tracking-widest text-muted uppercase">
            Ouvertures Lab
          </span>
          <ThemeToggle />
        </div>

        <div className="rounded-2xl border border-border bg-surface p-8">
          <h1 className="mb-1 text-2xl font-semibold">
            {mode === 'signin' ? 'Connexion' : 'Créer le compte'}
          </h1>
          <p className="mb-6 text-sm text-muted">
            {mode === 'signin'
              ? 'E-mail et mot de passe.'
              : 'À faire une seule fois, puis désactive les inscriptions dans Supabase.'}
          </p>

          <form onSubmit={onSubmit} className="space-y-3">
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="julien@exemple.fr"
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 font-mono text-sm outline-none focus:border-accent"
            />
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 font-mono text-sm outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-accent px-4 py-2 font-medium text-white transition disabled:opacity-50"
            >
              {busy ? '…' : mode === 'signin' ? 'Se connecter' : 'Créer le compte'}
            </button>
          </form>

          {error && (
            <p className="mt-4 rounded-lg border border-red/40 bg-red/10 p-3 text-sm">{error}</p>
          )}
          {notice && (
            <p className="mt-4 rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm">
              {notice}
            </p>
          )}

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin')
              setError('')
              setNotice('')
            }}
            className="mt-5 w-full text-center text-sm text-muted underline underline-offset-4 transition hover:text-accent"
          >
            {mode === 'signin' ? 'Créer le compte (première fois)' : 'J’ai déjà un compte'}
          </button>
        </div>
      </div>
    </div>
  )
}
