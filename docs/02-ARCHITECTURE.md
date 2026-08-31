# 02 — ARCHITECTURE

## Vue d'ensemble
SPA Vite/React/TS servie par Vercel. Supabase = auth + Postgres + (plus tard) storage.
Tout le calcul échecs (règles, arbre, moteur) tourne dans le navigateur.
Le cœur métier est isolé dans `src/lib/` en fonctions pures testables.

```
src/
├── lib/                    # PUR, testé vitest, zéro dépendance React
│   ├── repertoire.ts       # arbre: types Node {s,u,f?,e?,b?,c?,a?,k?,n?,v[]}, buildTree(lines), walk, nodeAtPath
│   ├── deviation.ts        # matchGame(ucis, repertoire) -> {chapter, depth, bookEnd, devBy, bookMoves}
│   ├── pgn.ts              # découpage multi-parties, parsing headers, couleur de Julien
│   ├── srs.ts              # SM-2: schedule(line, grade) -> next due date
│   ├── engine/
│   │   ├── uci.ts          # parseInfo(line), score POV blanc, file d'analyse
│   │   └── useEngine.ts    # hook Worker (init, analyze(fen), stop)
│   ├── mnemo.ts            # heatmap de cases, trajets de pièces, extraction points critiques (NAGs)
│   └── masters.ts          # client explorer.lichess.ovh + cache
├── components/             # Board (wrapper chessground), MoveTree, EvalBar, MoveList, Badge, …
├── features/               # repertoire/  training/  games/  masters/  coach/  stats/
├── pages/                  # routing (react-router)
└── state/                  # zustand stores légers (répertoire chargé, session d'entraînement)
public/engine/              # stockfish-18-lite-single.js + .wasm (copiés depuis node_modules à l'install)
scripts/                    # pipelines python (voir plus bas)
data/                       # sources versionnées du répertoire (PGN + JSON générés)
```

## Modèle de données (Supabase / Postgres)

```sql
-- Répertoires importés (versionnés)
create table repertoires (
  id uuid primary key default gen_random_uuid(),
  color char(1) not null check (color in ('w','b')),
  name text not null,                  -- « Répertoire Noir »
  source text,                         -- URL étude lichess
  version int not null default 1,
  data jsonb not null,                 -- l'arbre complet (format evals.json)
  created_at timestamptz default now()
);

-- Parties de Julien (existe déjà en v1 sous le nom chess_games — migrer/renommer en games)
create table games (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  pgn text not null,
  white text, black text, result text, played_on date,
  color char(1) not null,              -- couleur de Julien
  chapter text, dev_ply int, dev_by text, dev_san text, book_san text,
  analysis jsonb                       -- évals par coup une fois la partie analysée (phase 4)
);

-- Progression SRS (une ligne = une feuille du répertoire)
create table training_lines (
  id uuid primary key default gen_random_uuid(),
  repertoire_color char(1) not null,
  chapter text not null,
  line_key text not null,              -- hash de la suite de coups uci
  ease float default 2.5, interval_days float default 0, reps int default 0, lapses int default 0,
  due_at timestamptz default now(),
  unique (repertoire_color, chapter, line_key)
);

-- Coach vidéo
create table videos (
  id uuid primary key default gen_random_uuid(),
  url text not null, title text, chapter_hint text,
  transcript text,                     -- récupérée/collée
  created_at timestamptz default now()
);
create table video_notes (
  id uuid primary key default gen_random_uuid(),
  video_id uuid references videos(id) on delete cascade,
  fen_key text,                        -- position du répertoire concernée (4 premiers champs FEN)
  t_seconds int,                       -- horodatage dans la vidéo
  note text not null                   -- conseil synthétique
);
```
RLS : toutes les tables `authenticated only` (un seul utilisateur : Julien). Remplacer la policy permissive héritée de la v1 sur `chess_games`.

## Intégrations

### Stockfish (local, navigateur)
- Worker `new Worker('/engine/stockfish-18-lite-single.js')` (fichiers copiés en postinstall depuis `node_modules/stockfish/bin/`).
- Protocole UCI : `uci` → `isready` → `position fen X` → `go depth 20` (ou `go movetime`).
- Parser `info depth D score (cp|mate) N pv …` ; score POV du trait → convertir POV Blancs.
- File d'analyse : une position à la fois, `stop` avant chaque nouvelle position.
- Analyse de partie complète (phase 4) : itérer les FENs à `movetime 300`, delta d'éval → catégorie (imprécision/erreur/gaffe, seuils lichess : 50/100/300 cp winning-chance adaptés).

### API lichess (sans clé)
- `GET https://explorer.lichess.ovh/masters?fen={fen}&topGames=15` → `{moves:[{san,white,draws,black,averageRating}], topGames:[{id,white,black,year,winner}]}`.
- `GET https://lichess.org/game/export/{id}?pgnInJson=true` → PGN de la partie GM.
- `GET https://lichess.org/api/cloud-eval?fen={fen}&multiPv=2` → éval cache.
- Respecter le rate-limit : mise en cache locale (IndexedDB ou table Supabase `masters_cache`).

### Coach YouTube (phase 7)
1. Julien colle une URL (+ éventuellement la transcription si récupération auto indisponible).
2. Script `scripts/fetch_transcript.py` (lib `youtube-transcript-api`) → texte horodaté.
3. Mapping : détecter dans le texte les coups en notation (regex SAN fr/en + numéros de coups), reconstituer la séquence, la faire correspondre à un chemin du répertoire → créer des `video_notes` (fen_key + t_seconds + phrase nettoyée).
4. UI : sur une position, panneau « 🎥 Conseils » ; par chapitre, page « Coaching » agrégée. Claude Code peut faire la synthèse des notes (le mapping est déterministe, la reformulation peut être faite par Julien+Claude dans l'éditeur).

## Pipelines de données (`scripts/`)
- `study_to_lines.py in.pgn out.json` : étude lichess → arbre JSON complet (commentaires, %cal/%csl, NAGs) + lignes feuilles. Sert pour le répertoire blanc et pour chaque resync du noir.
- `bake_evals.py tree.json` : ajoute `e` (éval) et `b` (meilleur coup) à chaque nœud via le binaire stockfish local (profondeur 13 ≈ 80 s pour 1 500 positions, cache par FEN, transpositions dédupliquées).
- Le JSON produit est committé dans `data/` puis chargé en base via un petit script de seed (`scripts/seed.ts`).

## Décisions actées
- chessground pour le board (pas de board maison) ; le rendu maison de la v1 reste en référence.
- L'étude lichess est l'éditeur maître du répertoire ; l'app ne modifie jamais l'arbre.
- Import de parties par collage uniquement (pas d'OAuth chess.com/lichess en v1).
- Un seul environnement Supabase (le projet perso existant) ; pas de staging pour une app perso.
