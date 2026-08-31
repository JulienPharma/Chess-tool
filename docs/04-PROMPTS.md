# 04 — PROMPTS pour Claude Code

Comment s'en servir : ouvre Claude Code dans le repo (qui contient déjà CLAUDE.md, docs/, data/, scripts/, reference/), puis colle le prompt de la phase en cours. Un prompt = une phase. Entre deux phases, fais `/clear` pour repartir propre — CLAUDE.md et les docs suffisent comme mémoire.

## Conseils de pilotage
- Toujours exiger : « lis CLAUDE.md et docs/0X avant de commencer, et propose-moi ton plan AVANT de coder » (ou lance la phase en Plan Mode : Maj+Tab).
- Demander des **tests d'abord** sur la lib pure (déviation, SRS, arbre) — les bugs échecs sont sournois.
- En fin de phase : « lance les tests, le build, fais-moi un screenshot de la page, puis commit ».
- Si Claude propose de changer la stack ou de recoder l'échiquier à la main : refuser, c'est déjà tranché dans CLAUDE.md.

---

## Prompt 0 — Kickoff (Phase 0)
```
Lis CLAUDE.md, docs/01-VISION.md, docs/02-ARCHITECTURE.md et docs/03-ROADMAP.md.
On démarre la Phase 0 (Socle) exactement comme décrite dans la roadmap.
Avant de coder, donne-moi ton plan détaillé (arborescence, dépendances avec versions, migrations SQL, étapes) et attends ma validation.
Contraintes : stack imposée par CLAUDE.md, données déjà fournies dans data/, pièges connus dans CLAUDE.md section « Pièges ».
Le code de référence de la v1 est dans reference/le-labo-v1.html — tu peux t'en inspirer pour la logique, pas pour la structure.
```

## Prompt Phase 1 — Répertoire viewer
```
Phase 0 terminée et mergée. Lis docs/03-ROADMAP.md Phase 1.
Objectif : le viewer de répertoire complet (chapitres | chessground | arbre de variantes) avec les flèches [%cal], cercles [%csl], commentaires français, annotations colorées (couleurs dans CLAUDE.md) et évals précalculées de data/repertoire-noir.evals.json.
Commence par src/lib/repertoire.ts + tests (chargement de l'arbre, nodeAtPath, comptage: 17 chapitres / 241 feuilles attendus).
Plan d'abord, code ensuite. Termine par un screenshot light + dark.
```

## Prompt Phase 2 — Entraînement + SRS
```
Lis docs/03-ROADMAP.md Phase 2. Implémente le mode « devine le coup » puis le SRS SM-2.
Règles métier précises :
- l'adversaire joue un enfant ALÉATOIRE de l'arbre à chaque nœud où c'est son trait ;
- tout coup de MOI présent dans l'arbre est accepté (mes alternatives comptent juste) ;
- 2 erreurs sur un coup => bouton indice (flèche du coup principal), la ligne compte « avec aide » ;
- fin de ligne (feuille atteinte) => grade SM-2 : 5 sans faute, 3 avec indice/erreur, 1 si abandonnée.
Écris src/lib/srs.ts avec tests AVANT l'UI (cas : première réussite, échec après 3 reps, ease plancher 1.3).
```

## Prompt Phase 3 — Mes parties
```
Lis docs/03-ROADMAP.md Phase 3. Porte la logique de reference/le-labo-v1.html (import PGN collé, matcher de déviation, stats) dans src/lib + features/games, en TypeScript testé.
Cas de test OBLIGATOIRES pour deviation.ts (issus de CLAUDE.md « Pièges ») :
1. partie qui suit le chapitre Fe2 puis 8...a6 => dev_ply 15, dev_by 'me', book 'd6 / d5' ;
2. partie 100% dans une ligne jusqu'à une feuille => bookEnd, PAS de déviation ;
3. l'adversaire sort le premier => dev_by 'opp' ;
4. partie 1.d4 d5 (aucun chapitre) => match null ;
5. transposition : la partie doit matcher le chapitre le plus PROFOND, pas le premier trouvé.
Migre ensuite les lignes existantes de la table chess_games.
```

## Prompt Phase 4 — Stockfish partout
```
Lis docs/03-ROADMAP.md Phase 4 et CLAUDE.md sections Stockfish/Pièges.
1) Hook useEngine (Worker, file d'analyse, stop avant nouvelle position, parsing UCI testé dans src/lib/engine/uci.ts — attention : score POV du trait, à convertir POV Blancs).
2) EvalBar + meilleure ligne + flèche moteur dans le viewer et la vue partie.
3) Analyse de partie en tâche de fond (movetime 300/coup), classification imprécision/erreur/gaffe, stockage dans games.analysis, coups colorés dans la MoveList.
```

## Prompt Phase 5 — Parties de maîtres
```
Lis docs/03-ROADMAP.md Phase 5 et docs/02-ARCHITECTURE.md section « API lichess ».
Panneau masters sur toute position du répertoire : coups GM avec stats, top parties, chargement d'une partie GM dans le viewer avec le point de contact avec mon répertoire marqué. Cache agressif (les mêmes FEN reviennent tout le temps) + gestion douce du rate-limit (429 => backoff).
```

## Prompt Phase 6 — Mémorisation visuelle
```
Lis docs/01-VISION.md module B et docs/03-ROADMAP.md Phase 6.
Livrables : carte visuelle d'un chapitre (arbre entier + heatmap des cases d'arrivée de MES pièces + trajets animés d'une pièce choisie), cartes d'idées éditables extraites des commentaires (data/repertoire-noir.evals.json champ c), quiz points critiques (nœuds avec NAG 1/3 ou commentaire contenant « piège »), mode blindfold progressif.
Propose-moi 2 directions visuelles (croquis en HTML) avant d'implémenter la carte.
```

## Prompt Phase 7 — Coach YouTube
```
Lis docs/02-ARCHITECTURE.md section « Coach YouTube » et docs/03-ROADMAP.md Phase 7.
Implémente : tables videos/video_notes, script scripts/fetch_transcript.py (youtube-transcript-api, fallback : je colle la transcription), mapping transcription -> positions (détection de séquences de coups SAN fr/en dans le texte, reconstruction chess.js, correspondance avec l'arbre), UI panneau 🎥 par position + page coaching par chapitre avec liens horodatés https://youtu.be/ID?t=SECONDES.
Commence par le mapping en lib pure avec tests sur un extrait de transcription que je te fournirai.
```

## Prompt utilitaire — Import du répertoire blanc
```
Voici l'export PGN de mon étude lichess « Répertoire Blanc » (fichier joint).
Passe-le dans scripts/study_to_lines.py puis scripts/bake_evals.py, commit le résultat dans data/,
seed-le en base (repertoires, color 'w'), et vérifie que le viewer bascule correctement en orientation Blancs.
```
