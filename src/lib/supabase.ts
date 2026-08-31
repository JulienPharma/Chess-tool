import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL ?? ''
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''

/**
 * Faux si les variables d'env manquent (typiquement : déploiement Vercel sans
 * Environment Variables configurées). On NE lève PAS à l'import — sinon toute
 * l'app meurt avant le montage de React et l'utilisateur n'a qu'un écran blanc.
 * L'AuthGate affiche un message exploitable à la place.
 */
export const isSupabaseConfigured = url !== '' && key !== ''

export const missingSupabaseEnv = [
  url === '' ? 'VITE_SUPABASE_URL' : null,
  key === '' ? 'VITE_SUPABASE_PUBLISHABLE_KEY' : null,
].filter((v): v is string => v !== null)

export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  key || 'placeholder-key',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
)
