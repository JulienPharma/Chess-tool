# 01 — VISION : Ouvertures Lab

## Le problème
Julien travaille ses ouvertures sur 4 outils différents (lichess studies, Chessable, chess.com, YouTube) et rien ne se parle. Il veut UN endroit, fait pour lui, où :
1. il **voit** ses deux répertoires (blanc + noir) de façon visuelle et mémorable,
2. il **s'entraîne** dessus avec des méthodes qui sortent de l'ordinaire (pas juste du drill de coups),
3. il **confronte** ses vraies parties à sa théorie (où est-ce que je dévie ? où est-ce que l'adversaire m'emmène hors de mes lignes ?),
4. il **explore** ce que les grands maîtres jouent dans SES lignes,
5. il **analyse** tout ça avec Stockfish, dans le navigateur,
6. il se fait **coacher** à partir de vidéos YouTube qu'il fournit sur ses lignes.

Principe directeur : « je ne veux rien voir d'autre que ce que je vais voir en jouant » — tout est filtré par le répertoire de Julien. Pas d'encyclopédie généraliste.

## Les modules

### A. Répertoires (le socle)
- Deux répertoires : **Noirs** (fourni : 17 chapitres, 241 lignes, commentaires/flèches de l'étude lichess) et **Blancs** (à importer plus tard, même pipeline).
- Vue « étude » : échiquier + arbre de variantes cliquable + commentaires + flèches d'origine + annotations colorées (!, ?!, …) sur les cases.
- Vue « arbre global » : visualisation de tout un chapitre (ou répertoire) en un coup d'œil — graphe/sunburst des lignes, profondeur, transpositions. C'est la vue « carte mentale ».
- Resynchronisation depuis un PGN d'étude lichess (l'étude reste l'éditeur maître).

### B. Mémorisation (le différenciant)
Sortir du simple « devine le coup » :
- **Cartes d'idées par chapitre** : 3-5 idées clés (« le Cavalier va sur c4 », « la Dame sort en a5 puis a3 ») formulées à partir des commentaires de l'étude — l'utilisateur les révise comme des flashcards AVANT de driller les coups.
- **Heatmap de cases** : pour un chapitre, colorer les cases d'arrivée de mes pièces sur toutes les lignes → le « territoire » du chapitre se voit.
- **Trajets de pièces animés** : rejouer en accéléré le chemin typique d'une pièce dans la ligne (ex. le circuit Cf6-d5-b6 de l'Alapine).
- **Répétition espacée (SM-2)** par ligne : chaque ligne a une échéance de révision ; l'app propose la session du jour.
- **Mode à l'aveugle** (blindfold) : l'échiquier se vide progressivement, on joue la ligne de mémoire.
- **Points critiques** : les positions où le répertoire contient un `!` ou un piège — quiz ciblé dessus.

### C. Entraînement
- « Devine le coup » : les Blancs (ou Noirs, selon répertoire) jouent seuls au hasard dans l'arbre, je dois trouver mon coup en cliquant/glissant. Toutes mes alternatives du répertoire sont acceptées. Indice après 2 erreurs. (Déjà prototypé dans l'artifact Répertoire Noir.)
- Score, séries, progression par chapitre, alimenté par le SRS.

### D. Mes parties
- Import par collage de PGN (multi-parties). PAS de connecteur automatique pour l'instant.
- Détection automatique : chapitre concerné, coup exact de sortie de théorie, par qui, ce que le répertoire donnait. (Déjà prototypé dans Le Labo v1 — porter le code.)
- Stats : score par chapitre, sorties par moi vs par l'adversaire, **écarts récurrents** (mes erreurs répétées = ma liste de travail).
- Les sorties d'adversaires fréquentes = « trous du répertoire » à ajouter dans l'étude lichess.

### E. Analyse Stockfish
- Stockfish 18 lite en Worker : barre d'éval, meilleure ligne, flèche moteur, sur toute position (répertoire ou partie).
- Analyse complète d'une partie en tâche de fond : repérer mes gaffes (delta d'éval), les marquer dans la liste de coups avec les couleurs d'annotations standard.
- Évals précalculées du répertoire (déjà fournies, profondeur 13) affichées instantanément sur les positions de théorie.

### F. Parties de maîtres
- Sur n'importe quelle position de mon répertoire : ce que jouent les GM (API lichess masters), les stats par coup, et 10-15 parties de référence à rejouer dans l'app.
- Filtré par MES lignes : « montre-moi comment les GM traitent la structure après 9.Qd2 ».

### G. Coach vidéo (YouTube)
- Julien fournit des URLs YouTube sur ses lignes. L'app (via un script/Claude) récupère la transcription, la découpe, et **rattache les passages aux positions du répertoire** (détection des coups cités dans le texte).
- Résultat : sur une position, un panneau « ce que dit la vidéo ici » + lien horodaté vers le moment de la vidéo ; et des notes de coaching synthétiques par chapitre.
- V1 réaliste : transcription collée/récupérée → pipeline de mapping ; pas de compréhension vidéo image par image.

## Ce que l'app n'est PAS
- Pas multi-utilisateurs, pas de social, pas de publication. Un seul compte (auth simple pour protéger les données).
- Pas un éditeur de répertoire complet : l'étude lichess reste l'éditeur ; l'app importe.
- Pas de connecteurs temps réel chess.com/lichess pour les parties (collage de PGN suffit).

## Réussite =
Julien ouvre l'app 15 minutes par jour : il fait sa session SRS, revoit une carte d'idées, colle ses parties du soir, voit qu'il a encore joué 8...a6 au lieu de 8...d6 dans la Fe2, clique, comprend, et le retient.
