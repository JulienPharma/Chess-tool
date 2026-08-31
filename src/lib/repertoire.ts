/**
 * Arbre de répertoire — cœur métier, PUR (zéro import React/DOM).
 *
 * Source de vérité : `data/repertoire-noir.evals.json`, produit par
 * `scripts/study_to_lines.py` puis `scripts/bake_evals.py`.
 *
 * Forme réelle des données (vérifiée sur le fichier livré, 1739 nœuds) :
 *  - chaque chapitre porte `tree`, dont la racine est la position de départ
 *    et ne possède donc NI `s` NI `u` ;
 *  - `f`, `e` et `b` sont présents sur 100 % des nœuds (le doc les donnait
 *    optionnels) ;
 *  - `v` est absent sur les 241 feuilles.
 */

/** Couleur d'annotation lichess : g(reen), r(ed), b(lue), y(ellow). */
export type AnnotationColor = 'green' | 'red' | 'blue' | 'yellow'

/** Flèche `[%cal]` : [couleur, case de départ, case d'arrivée]. */
export type RawArrow = [string, string, string]
/** Cercle `[%csl]` : [couleur, case]. */
export type RawCircle = [string, string]

/**
 * Évaluation Stockfish au point de vue des BLANCS.
 * Entier = centipions ; chaîne `"M3"` / `"M-3"` = mat en N.
 */
export type Evaluation = number | string

interface NodeCommon {
  /** FEN de la position atteinte. */
  f: string
  /** Éval Stockfish 16 profondeur 13, POV Blancs. */
  e: Evaluation
  /** Meilleur coup selon le moteur, en UCI. */
  b: string
  /** Enfants ; absent sur une feuille. */
  v?: MoveNode[]
  /** Commentaire de l'étude (français). */
  c?: string
  /** Flèches `[%cal]`. */
  a?: RawArrow[]
  /** Cercles `[%csl]`. */
  k?: RawCircle[]
  /** NAGs ($1 = !, $2 = ?, $3 = !!, $4 = ??, $5 = !?, $6 = ?!). */
  n?: number[]
}

/** Racine d'un chapitre : position initiale, aucun coup joué. */
export type RootNode = NodeCommon
/** Nœud de coup : porte le SAN anglais et l'UCI. */
export interface MoveNode extends NodeCommon {
  /** SAN anglaise (Nf3, Bxc4…). */
  s: string
  /** UCI (g1f3). */
  u: string
}
export type TreeNode = RootNode | MoveNode

export interface Chapter {
  name: string
  eco: string
  opening: string
  /**
   * Nombre de feuilles annoncé par le pipeline.
   * ATTENTION : dans `*.evals.json` le champ brut `lines` est un ENTIER
   * (un compte), alors que dans `*.lines.json` c'est un TABLEAU de chaînes.
   * On le renomme ici pour que les deux ne se confondent jamais.
   */
  lineCount: number
  tree: RootNode
}

export interface Repertoire {
  study: string
  chapters: Chapter[]
}

/** Contenu de `*.lines.json` : les lignes feuilles aplaties, en SAN. */
export interface FlatLinesFile {
  chapters: { name: string; lines: string[] }[]
}

/** Un nœud de coup se distingue de la racine par la présence de `s`/`u`. */
export function isMoveNode(node: TreeNode): node is MoveNode {
  return 's' in node && 'u' in node
}

/** Une feuille est un nœud sans enfants — fin de théorie, PAS une déviation. */
export function isLeaf(node: TreeNode): boolean {
  return !node.v || node.v.length === 0
}

export function children(node: TreeNode): MoveNode[] {
  return node.v ?? []
}

/* ------------------------------------------------------------------ */
/* Chargement + validation                                             */
/* ------------------------------------------------------------------ */

export class RepertoireFormatError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RepertoireFormatError'
  }
}

function assertNode(value: unknown, where: string): asserts value is TreeNode {
  if (typeof value !== 'object' || value === null) {
    throw new RepertoireFormatError(`${where} : nœud attendu, reçu ${typeof value}`)
  }
  const node = value as Record<string, unknown>
  if (typeof node.f !== 'string') {
    throw new RepertoireFormatError(`${where} : champ « f » (FEN) manquant`)
  }
  if (node.v !== undefined && !Array.isArray(node.v)) {
    throw new RepertoireFormatError(`${where} : champ « v » doit être un tableau`)
  }
}

/**
 * Valide et type un JSON brut de répertoire (contenu de `*.evals.json`).
 * Lève {@link RepertoireFormatError} plutôt que de renvoyer un objet
 * silencieusement incomplet.
 */
export function parseRepertoire(raw: unknown): Repertoire {
  if (typeof raw !== 'object' || raw === null) {
    throw new RepertoireFormatError('racine : objet attendu')
  }
  const root = raw as Record<string, unknown>
  if (typeof root.study !== 'string') {
    throw new RepertoireFormatError('racine : champ « study » manquant')
  }
  if (!Array.isArray(root.chapters)) {
    throw new RepertoireFormatError('racine : champ « chapters » manquant')
  }

  const chapters = root.chapters.map((chapter, i) => {
    if (typeof chapter !== 'object' || chapter === null) {
      throw new RepertoireFormatError(`chapitre ${i} : objet attendu`)
    }
    const c = chapter as Record<string, unknown>
    if (typeof c.name !== 'string') {
      throw new RepertoireFormatError(`chapitre ${i} : champ « name » manquant`)
    }
    if (typeof c.lines !== 'number') {
      throw new RepertoireFormatError(
        `chapitre « ${c.name} » : champ « lines » doit être un entier (compte de feuilles)`,
      )
    }
    assertNode(c.tree, `chapitre « ${c.name} »`)
    walk(c.tree, (node, path) => {
      assertNode(node, `chapitre « ${c.name} » à ${path.join(' ') || '(racine)'}`)
    })
    return {
      name: c.name,
      eco: typeof c.eco === 'string' ? c.eco : '',
      opening: typeof c.opening === 'string' ? c.opening : '',
      lineCount: c.lines,
      tree: c.tree,
    } satisfies Chapter
  })

  return { study: root.study, chapters }
}

/** Valide et type un JSON brut de lignes aplaties (contenu de `*.lines.json`). */
export function parseFlatLines(raw: unknown): FlatLinesFile {
  if (typeof raw !== 'object' || raw === null) {
    throw new RepertoireFormatError('racine : objet attendu')
  }
  const root = raw as Record<string, unknown>
  if (!Array.isArray(root.chapters)) {
    throw new RepertoireFormatError('racine : champ « chapters » manquant')
  }
  const chapters = root.chapters.map((chapter, i) => {
    const c = chapter as Record<string, unknown>
    if (typeof c?.name !== 'string') {
      throw new RepertoireFormatError(`chapitre ${i} : champ « name » manquant`)
    }
    if (!Array.isArray(c.lines) || c.lines.some((l) => typeof l !== 'string')) {
      throw new RepertoireFormatError(
        `chapitre « ${c.name} » : champ « lines » doit être un tableau de chaînes`,
      )
    }
    return { name: c.name, lines: c.lines as string[] }
  })
  return { chapters }
}

/* ------------------------------------------------------------------ */
/* Parcours                                                            */
/* ------------------------------------------------------------------ */

/**
 * Parcours préfixe de l'arbre. `path` est la suite de SAN menant au nœud
 * (vide pour la racine).
 */
export function walk(
  root: TreeNode,
  visit: (node: TreeNode, path: string[]) => void,
  path: string[] = [],
): void {
  visit(root, path)
  for (const child of children(root)) {
    walk(child, visit, [...path, child.s])
  }
}

/**
 * Descend l'arbre en suivant une suite de coups SAN.
 * Renvoie `null` dès qu'un coup n'existe pas dans le répertoire.
 */
export function nodeAtPath(root: TreeNode, path: readonly string[]): TreeNode | null {
  let current: TreeNode = root
  for (const san of path) {
    const next = children(current).find((child) => child.s === san)
    if (!next) return null
    current = next
  }
  return current
}

/** Idem {@link nodeAtPath} mais en UCI — c'est la clé du matcher de déviation. */
export function nodeAtUciPath(root: TreeNode, path: readonly string[]): TreeNode | null {
  let current: TreeNode = root
  for (const uci of path) {
    const next = children(current).find((child) => child.u === uci)
    if (!next) return null
    current = next
  }
  return current
}

/** Toutes les lignes feuilles d'un arbre, en SAN. */
export function leafLines(root: TreeNode): string[][] {
  const out: string[][] = []
  walk(root, (node, path) => {
    if (isLeaf(node) && path.length > 0) out.push(path)
  })
  return out
}

export function countNodes(root: TreeNode): number {
  let n = 0
  walk(root, () => n++)
  return n
}

/* ------------------------------------------------------------------ */
/* Construction depuis des lignes aplaties                             */
/* ------------------------------------------------------------------ */

/**
 * Reconstruit un arbre à partir de lignes SAN aplaties (format
 * `*.lines.json`), en fusionnant les préfixes communs.
 *
 * Sert au répertoire blanc tant que `bake_evals.py` n'a pas tourné : les
 * nœuds produits n'ont ni éval ni FEN, seulement la structure.
 */
export function buildTree(lines: readonly string[]): RootNode {
  const root: RootNode = { f: '', e: 0, b: '', v: [] }

  for (const line of lines) {
    const moves = line.trim().split(/\s+/).filter(Boolean)
    let current: TreeNode = root
    for (const san of moves) {
      const existing: MoveNode | undefined = children(current).find((c) => c.s === san)
      if (existing) {
        current = existing
        continue
      }
      const created: MoveNode = { s: san, u: '', f: '', e: 0, b: '', v: [] }
      current.v ??= []
      current.v.push(created)
      current = created
    }
  }
  return root
}

/* ------------------------------------------------------------------ */
/* Statistiques (page /debug, critère de sortie de la Phase 0)         */
/* ------------------------------------------------------------------ */

export interface RepertoireStats {
  study: string
  chapters: number
  lines: number
  nodes: number
  /** Positions distinctes (4 premiers champs FEN) — révèle les transpositions. */
  uniquePositions: number
  withComment: number
  withArrows: number
  withCircles: number
  withNags: number
  maxDepth: number
}

/** Clé de position : 4 premiers champs du FEN (sans compteurs de coups). */
export function fenKey(fen: string): string {
  return fen.split(' ').slice(0, 4).join(' ')
}

export function repertoireStats(repertoire: Repertoire): RepertoireStats {
  const positions = new Set<string>()
  let lines = 0
  let nodes = 0
  let withComment = 0
  let withArrows = 0
  let withCircles = 0
  let withNags = 0
  let maxDepth = 0

  for (const chapter of repertoire.chapters) {
    walk(chapter.tree, (node, path) => {
      nodes++
      maxDepth = Math.max(maxDepth, path.length)
      if (node.f) positions.add(fenKey(node.f))
      if (node.c) withComment++
      if (node.a?.length) withArrows++
      if (node.k?.length) withCircles++
      if (node.n?.length) withNags++
      if (isLeaf(node) && path.length > 0) lines++
    })
  }

  return {
    study: repertoire.study,
    chapters: repertoire.chapters.length,
    lines,
    nodes,
    uniquePositions: positions.size,
    withComment,
    withArrows,
    withCircles,
    withNags,
    maxDepth,
  }
}
