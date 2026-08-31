# 03 — ROADMAP (phases à suivre dans l'ordre)

Règle : une phase = une branche = tests verts + build OK + screenshot de démo + merge. On ne commence pas la phase suivante avant.

## Phase 0 — Socle ✦ « le squelette qui marche »
- Repo Vite + React + TS + Tailwind + vitest + react-router. ESLint/Prettier.
- Copie postinstall de Stockfish dans `public/engine/` + page /debug qui affiche `uciok` (preuve que le worker tourne).
- `src/lib/repertoire.ts` : chargement de `data/repertoire-noir.evals.json`, types, `buildTree`, tests.
- Supabase : projet existant branché, auth magic-link (une page login minimaliste), migrations SQL de `docs/02-ARCHITECTURE.md`, seed du répertoire noir en base.
- Design tokens (palette/typos du CLAUDE.md) posés dans Tailwind + les deux thèmes.
**Done quand** : `npm test` vert, page /debug montre « moteur prêt » + « répertoire : 17 chapitres, 241 lignes », login fonctionne.

## Phase 1 — Répertoire viewer ✦ « je vois mes lignes »
- Layout 3 zones : chapitres | échiquier (chessground, orienté selon la couleur du répertoire) | arbre de variantes.
- Arbre cliquable style lichess (variantes indentées, coup courant surligné), navigation clavier ←/→, commentaires sous l'échiquier, flèches/cercles de l'étude, annotations colorées sur les cases (+ pastille), éval précalculée en petit badge.
- Sélecteur Blancs/Noirs (les Blancs affichent « à importer » tant que les données n'existent pas).
**Done quand** : je peux parcourir n'importe quelle ligne des 17 chapitres au clavier, avec les flèches et commentaires de mon étude, en light et dark.

## Phase 2 — Entraînement + SRS ✦ « je retiens »
- Mode « devine le coup » (porter la logique de l'artifact v1) : l'adversaire joue une branche aléatoire, je joue mon coup par drag&drop chessground ; alternatives du répertoire acceptées ; indice = flèche après 2 erreurs.
- SM-2 par ligne (`src/lib/srs.ts` + table `training_lines`) : la session du jour propose les lignes dues ; réussite sans faute = grade 5, avec indice = 3, échec = 1.
- Tableau de bord : lignes dues aujourd'hui, séries, progression par chapitre (barres).
**Done quand** : une session quotidienne complète fonctionne et la progression persiste en base.

## Phase 3 — Mes parties ✦ « la réalité vs la théorie »
- Port du Labo v1 : collage PGN multi-parties, détection couleur (« Shogistyle »), matcher de déviation (lib pure + tests, y compris les cas pièges du CLAUDE.md), liste des parties, vue analyse (board + coups colorés livre/déviation + encart explicatif).
- Stats : score par chapitre, sorties moi/adversaire, écarts récurrents, « trous du répertoire » (sorties adverses fréquentes).
- Migration des données existantes de la table `chess_games` v1.
**Done quand** : je colle 5 PGN chess.com d'un coup et chaque partie affiche son diagnostic correct.

## Phase 4 — Stockfish partout ✦ « l'œil du moteur »
- Barre d'éval + meilleure ligne + flèche moteur sur toute position (viewer, analyse de partie).
- Analyse de partie en tâche de fond (movetime 300/coup) → gaffes/erreurs/imprécisions marquées dans la liste de coups (couleurs standard), stockées dans `games.analysis`.
- Croisement avec la déviation : « ta sortie de théorie au coup 8 coûte 0.9 pion ».
**Done quand** : j'ouvre une partie importée et je vois mes gaffes annotées sans rien lancer à la main.

## Phase 5 — Parties de maîtres ✦ « comment les GM jouent MA ligne »
- Sur toute position du répertoire : panneau explorer (coups GM + %), et liste de parties de référence (API masters, cache).
- Clic sur une partie GM → elle se charge dans le viewer (board + coups), avec le point où elle rejoint/quitte mon répertoire marqué.
**Done quand** : depuis la position après 9.Qd2 du chapitre Fe2, je liste des parties GM et j'en rejoue une dans l'app.

## Phase 6 — Mémorisation visuelle ✦ « sortir de l'ordinaire »
- Vue « carte du chapitre » : graphe de l'arbre entier (d3 ou layout maison) + heatmap des cases d'arrivée + trajets de pièces animés.
- Cartes d'idées par chapitre (extraites des commentaires + éditables), révisables en flashcards.
- Quiz « points critiques » (positions avec ! ou pièges) et mode blindfold progressif.
**Done quand** : chaque chapitre a sa carte visuelle et au moins 3 cartes d'idées, intégrées à la session SRS.

## Phase 7 — Coach YouTube ✦ « mes vidéos me parlent »
- Table `videos`/`video_notes`, script transcription, mapping coups→positions (voir 02-ARCHITECTURE).
- Panneau « 🎥 » sur les positions couvertes + page coaching par chapitre avec liens horodatés.
**Done quand** : je donne une URL de vidéo sur la Benko, et la position concernée affiche les conseils horodatés.

## Backlog (plus tard, pas maintenant)
Import auto lichess/chess.com (tokens), notation française dans l'UI, PWA mobile, export Chessable, multithread SF (headers COOP/COEP), partage lecture seule d'un chapitre à un ami.
