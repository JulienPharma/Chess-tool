import { useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { ThemeToggle } from '@/components/ThemeToggle'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setStatus('sending')
    setError('')
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (authError) {
      setError(authError.message)
      setStatus('error')
    } else {
      setStatus('sent')
    }
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
          <h1 className="mb-1 text-2xl font-semibold">Connexion</h1>
          <p className="mb-6 text-sm text-muted">
            Un lien magique t’est envoyé par e-mail. Pas de mot de passe.
          </p>

          {status === 'sent' ? (
            <p className="rounded-lg border border-green/40 bg-green/10 p-4 text-sm">
              Lien envoyé à <strong className="font-mono">{email}</strong>. Ouvre-le depuis ce
              navigateur.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="julien@exemple.fr"
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 font-mono text-sm outline-none focus:border-accent"
              />
              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full rounded-lg bg-accent px-4 py-2 font-medium text-white transition disabled:opacity-50"
              >
                {status === 'sending' ? 'Envoi…' : 'Recevoir le lien'}
              </button>
              {error && <p className="text-sm text-red">{error}</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
