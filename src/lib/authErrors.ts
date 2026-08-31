/**
 * Traduction des erreurs Supabase Auth en messages français exploitables.
 * Fonction pure — testée dans tests/authErrors.test.ts.
 */
export function authErrorMessage(raw: string): string {
  const message = raw.toLowerCase()

  if (message.includes('invalid login credentials')) {
    return 'E-mail ou mot de passe incorrect.'
  }
  if (message.includes('email not confirmed')) {
    return "Ce compte n'est pas confirmé. Désactive « Confirm email » dans Supabase → Authentication → Providers → Email."
  }
  if (message.includes('user already registered') || message.includes('already been registered')) {
    return 'Ce compte existe déjà — connecte-toi au lieu de le créer.'
  }
  if (message.includes('signups not allowed') || message.includes('signup is disabled')) {
    return 'Les inscriptions sont désactivées dans Supabase. Réactive-les le temps de créer le compte.'
  }
  if (message.includes('password should be at least')) {
    return 'Mot de passe trop court (6 caractères minimum).'
  }
  if (message.includes('rate limit') || message.includes('too many requests')) {
    return 'Trop de tentatives. Attends une minute avant de réessayer.'
  }
  if (message.includes('failed to fetch') || message.includes('networkerror')) {
    return 'Supabase injoignable. Vérifie VITE_SUPABASE_URL et ta connexion.'
  }
  return raw
}
