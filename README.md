# Ouvertures Lab

Application perso pour travailler mes ouvertures d'échecs.
Voir `CLAUDE.md` et `docs/` pour la vision, l'architecture et la roadmap.

## Démarrer

```bash
npm install                  # copie aussi Stockfish dans public/engine/
cp .env.local.example .env.local
npm run dev                  # http://localhost:5173/debug
```

## Scripts

| commande | effet |
|---|---|
| `npm run dev` | serveur de dev |
| `npm test` | vitest (lib pure) |
| `npm run build` | typecheck + build de prod |
| `npm run lint` | eslint |
| `npm run engine:copy` | recopie Stockfish depuis `node_modules` |

## État : Phase 0 (Socle) terminée

- Vite + React 19 + TS strict + Tailwind 4 + vitest + react-router
- Stockfish 18 lite single-thread en Web Worker same-origin, page `/debug`
- `src/lib/repertoire.ts` : chargement, types, parcours, `buildTree` — 21 tests
- Supabase : 5 tables, RLS `owner_id = auth.uid()`, auth magic-link
- Design tokens « bois & parchemin », thèmes clair et sombre

## Base de données

Projet Supabase **`sponqvqqfcedkkfvasfw`** (« Chess-tool », eu-west-2).
Migrations dans `supabase/migrations/`, déjà appliquées.

> ⚠️ Ne pas confondre avec `zsfdbpoqwobewwghaqhv`, qui est le projet
> PharmaTalent de production. Aucune donnée d'échecs ne doit y aller.

## Déploiement Vercel

Projet `chess-tool` (équipe `pharma-talent-ai`). Le build est piloté par
`vercel.json` : framework `vite`, sortie dans `dist/`.

Variables d'environnement à définir dans Project Settings → Environment
Variables, pour **Production, Preview et Development** :

| nom | valeur |
|---|---|
| `VITE_SUPABASE_URL` | `https://sponqvqqfcedkkfvasfw.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_dJVYMQug0aV4Hh6SaFTWIw_6aW5Gjd-` |

⚠️ Le préfixe `VITE_` est **obligatoire** : Vite n'expose au bundle client que
les variables ainsi préfixées. Sans lui, `import.meta.env` renvoie `undefined`
et l'app affiche l'écran « Configuration incomplète ».

Penser aussi à ajouter l'URL de déploiement dans Supabase → Authentication →
URL Configuration → Redirect URLs, sinon le magic link renvoie sur localhost.

## Manquant

- `reference/le-labo-v1.html` — code de référence v1, nécessaire en Phase 3
- `scripts/study_to_lines.py` et `scripts/bake_evals.py` — nécessaires pour
  importer le répertoire blanc et resynchroniser le noir
