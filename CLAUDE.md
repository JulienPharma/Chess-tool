# CLAUDE.md — Ouvertures Lab (app échecs perso de Julien)

## Contexte
Application web 100% personnelle pour travailler MES ouvertures d'échecs.
Utilisateur unique : Julien (« Shogistyle » sur lichess et chess.com, ~1500 elo).
Répertoire noir : Sicilienne accélérée (dragon) + Benko. Répertoire blanc : à importer.
Langue de l'UI : **français**. Notation des coups : SAN anglaise (Nf3, Bxc4…) partout dans le code et les données ; l'UI peut afficher la notation française plus tard (option).

## Stack (décidée — ne pas en changer sans me demander)
- **Vite + React + TypeScript**, Tailwind CSS
- **Board : `chessground`** (la lib de lichess — animations, drag & drop, flèches, cercles intégrés). Ne PAS recoder un échiquier à la main.
- **Règles/PGN : `chess.js` v1.x** (attention : API 1.x = `loadPgn`, `new Chess()`; la 0.13 utilisait `load_pgn`. Toujours vérifier la version installée avant d'écrire du code).
- **Moteur : `stockfish` npm 18.x**, build `stockfish-18-lite-single.js` + son `.wasm` (single-thread, AUCUN header COOP/COEP requis) servis en **same-origin** dans `public/engine/`, lancé en Web Worker. Le build multithread nécessite COOP/COEP (possible sur Vercel via `vercel.json` headers) — seulement si la lite devient trop lente.
- **Backend : Supabase** — projet dédié **`sponqvqqfcedkkfvasfw`** (« Chess-tool », région **eu-west-2**). URL: `https://sponqvqqfcedkkfvasfw.supabase.co`. La clé publishable est publique par design (voir `.env.local.example`).
  ⚠️ L'ancien ID `zsfdbpoqwobewwghaqhv` (région ap-south-1) qui figurait ici est le projet **PharmaTalent de production** — le prototype v1 y avait été branché par erreur. Ne JAMAIS y écrire de données d'échecs. Sa table `chess_games` (vide) y subsiste avec une policy `FOR ALL / TO public / USING(true)` à supprimer.
  **Supabase Auth** en **e-mail + mot de passe** (PAS de magic link : le SMTP par défaut de Supabase est limité à quelques mails/heure, inutilisable). Aucun e-mail n'est envoyé : « Confirm email » désactivé, compte créé une fois, puis inscriptions désactivées. Les policies RLS filtrent quand même sur `owner_id = auth.uid()` — défense en profondeur si les inscriptions étaient rouvertes.
- **Déploiement : Vercel via l'intégration GitHub** (le MCP Vercel de Julien n'a pas les droits de création de projet ; passer par le dashboard ou `vercel` CLI la première fois).

## Données (fournies dans `data/` — source de vérité)
- `data/repertoire-noir.pgn` : l'étude lichess « Repertoire Noir » complète (17 chapitres, variantes imbriquées, commentaires français, flèches `[%cal]`, cercles `[%csl]`, annotations !? etc.).
- `data/repertoire-noir.lines.json` : la même chose aplatie — 241 lignes (une par feuille), format `{chapters:[{name, lines:["e4 c5 Nf3 …", …]}]}`.
- `data/repertoire-noir.evals.json` : l'arbre complet avec évals Stockfish 16 profondeur 13 précalculées par nœud (`e` = centipawns point de vue Blancs ou `"M3"`, `b` = meilleur coup uci, `f` = FEN, `a`/`k` = flèches/cercles lichess, `c` = commentaire, `n` = NAGs).
- Le répertoire **blanc** n'est pas encore importé : utiliser `scripts/study_to_lines.py` sur l'export PGN de l'étude lichess blanche quand Julien la fournit.
- En base, le répertoire doit rester **versionné et resynchronisable** depuis un PGN d'étude lichess (l'étude lichess reste l'éditeur de référence de Julien).

## Scripts fournis (`scripts/`, Python, dépendance `chess`)
- `study_to_lines.py` : PGN d'étude → JSON arbre + lignes feuilles (gère %cal/%csl/NAGs/commentaires).
- `bake_evals.py` : ajoute les évals Stockfish à chaque nœud (binaire `stockfish` requis).

## Pièges déjà rencontrés (ne pas re-tomber dedans)
1. **chess.js 0.13.4 est un module ESM** malgré son âge (`export const Chess`) — pas de global. En 1.x l'API a été renommée en camelCase.
2. **Grille échiquier CSS** : toujours `grid-template-columns` ET `grid-template-rows` en `repeat(8, minmax(0,1fr))`, sinon les rangées se dimensionnent au contenu (cases non carrées). (Non applicable si chessground.)
3. **Stockfish en Worker** : le worker doit être same-origin ; le `.wasm` est résolu relativement au script → garder `stockfish-18-lite-single.js` et son `.wasm` côte à côte dans `public/engine/`. Parser les lignes UCI `info … score cp/mate … pv …` ; le score est du point de vue du trait → convertir en point de vue Blancs.
4. **PGN chess.com** : headers `[Date "2025.05.17"]` avec points ; résultat parfois uniquement dans le header. Import multi-parties : découper sur `\n\n(?=\[)` puis regrouper headers+coups.
5. **Détection de déviation** : comparer la partie à CHAQUE chapitre (par uci), garder la correspondance la plus profonde ; à la divergence, `ply % 2` ne suffit pas — utiliser la couleur du coup joué. Si le nœud atteint n'a plus d'enfants → fin de théorie, PAS une déviation.
6. **chess.js 1.x lève au lieu de renvoyer null** : `move()` retourne `Move` (non-nullable) et jette sur coup illégal ; `loadPgn()` retourne `void` et jette sur PGN invalide. En 0.13 elles renvoyaient `null`/`false`. Le matcher de déviation et l'import multi-parties doivent être en `try/catch`, pas en `if (!move)`.
7. **`lines` n'a pas le même type dans les deux fichiers de données** : dans `*.evals.json` `chapter.lines` est un ENTIER (compte de feuilles) ; dans `*.lines.json` c'est un TABLEAU de chaînes. Le type `Chapter` expose `lineCount` pour éviter la confusion.
8. **La racine de chapitre n'a ni `s` ni `u`** (c'est la position de départ) ; en revanche `f`, `e` et `b` sont présents sur 100 % des nœuds, contrairement à ce que laissait entendre `02-ARCHITECTURE`.
9. **Études lichess privées** : l'export `https://lichess.org/study/{id}.pgn` renvoie 401 → il faut un token API personnel lichess (scope `study:read`) ou que Julien exporte le PGN à la main.

## APIs externes utiles (gratuites, sans clé)
- **Parties de maîtres par position** : `https://explorer.lichess.ovh/masters?fen={fen}&topGames=15` → coups joués + stats + parties GM (id de partie → PGN via `https://lichess.org/game/export/{id}`). C'est LA source pour le module « parties de grands maîtres sur ma ligne ».
- **Éval cloud lichess** : `https://lichess.org/api/cloud-eval?fen={fen}` (cache communautaire, complète Stockfish local).
- **chess.com pubapi** : `https://api.chess.com/pub/player/{user}/games/{YYYY}/{MM}` (archives mensuelles, si un jour on automatise l'import).

## Design (reprendre l'identité existante — voir `reference/le-labo-v1.html`)
Palette chaude « bois & parchemin », dark et light via tokens CSS :
sable `#f4efe6` / brun profond `#171310`, panneaux `#fdfaf3`/`#211c17`, accent ambre `#a86f14` (light) / `#d9a03f` (dark), vert `#3e7d4e`, rouge `#a33b2e`, bleu moteur `#3f6fb0`. Cases : `#f0d9b5` / `#b58863`.
Typo : **Fraunces** (titres), **Karla** (texte), **Spline Sans Mono** (coups/notation).
Pièces : SVG cburnett (paquet `react-chess-pieces` ou thème chessground par défaut).
Couleurs d'annotations : !! `#14957e` · ! `#4d8f3f` · !? `#af52c6` · ?! `#e0912a` · ? `#d0342c` · ?? `#9c1207`.

## Conventions de travail
- TypeScript strict, composants fonctionnels, état léger (zustand si besoin, pas de Redux).
- Le cœur métier (arbre de répertoire, matcher de déviation, SRS) = fonctions pures dans `src/lib/`, **testées avec vitest** (les cas de test des pièges ci-dessus existent déjà dans les docs).
- Chaque phase de la ROADMAP se termine par : tests verts + `npm run build` OK + une démo visuelle (screenshot) + commit.
- Ne jamais committer de secrets (la clé publishable Supabase est publique par design, OK).
- Petites PR/commits par fonctionnalité ; messages de commit en anglais, `feat:`/`fix:`.

## Docs
- `docs/01-VISION.md` — le produit, les modules, à quoi ressemble la réussite.
- `docs/02-ARCHITECTURE.md` — schéma DB, structure du code, intégrations.
- `docs/03-ROADMAP.md` — phases avec critères d'acceptation. **Suivre l'ordre.**
- `docs/04-PROMPTS.md` — les prompts de kickoff que Julien colle à chaque phase.
