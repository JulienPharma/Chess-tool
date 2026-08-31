/**
 * Seed du répertoire en base.
 *
 * Exécuté depuis l'app pendant que Julien est connecté : les policies RLS
 * `owner_id = auth.uid()` s'appliquent et aucune `service_role_key` n'a
 * besoin d'exister côté client.
 *
 * Chaque seed crée une NOUVELLE version (le doc : « le répertoire doit rester
 * versionné et resynchronisable depuis un PGN d'étude lichess »). On n'écrase
 * jamais une version existante.
 */
import { supabase } from './supabase'
import type { Repertoire } from './repertoire'

export interface SeedResult {
  version: number
  chapters: number
}

export async function currentVersion(color: 'w' | 'b'): Promise<number | null> {
  const { data, error } = await supabase
    .from('repertoires')
    .select('version')
    .eq('color', color)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data?.version ?? null
}

export async function seedRepertoire(
  repertoire: Repertoire,
  color: 'w' | 'b',
  source?: string,
): Promise<SeedResult> {
  const previous = await currentVersion(color)
  const version = (previous ?? 0) + 1

  const { error } = await supabase.from('repertoires').insert({
    color,
    name: repertoire.study,
    source: source ?? null,
    version,
    data: repertoire as unknown as Record<string, unknown>,
  })
  if (error) throw error

  return { version, chapters: repertoire.chapters.length }
}
