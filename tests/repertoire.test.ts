import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  parseRepertoire,
  repertoireStats,
  nodeAtPath,
  nodeAtUciPath,
  buildTree,
  leafLines,
  parseFlatLines,
  isLeaf,
  isMoveNode,
  children,
  fenKey,
  RepertoireFormatError,
  type Repertoire,
} from '../src/lib/repertoire'

const raw: unknown = JSON.parse(
  readFileSync(join(process.cwd(), 'data/repertoire-noir.evals.json'), 'utf-8'),
)
const repertoire: Repertoire = parseRepertoire(raw)

const flat = parseFlatLines(
  JSON.parse(readFileSync(join(process.cwd(), 'data/repertoire-noir.lines.json'), 'utf-8')),
)

describe('parseRepertoire — données réelles', () => {
  it('charge l’étude « Répertoire Noir »', () => {
    expect(repertoire.study).toBe('Répertoire Noir')
  })

  it('expose 17 chapitres et 241 lignes (critère de sortie Phase 0)', () => {
    const stats = repertoireStats(repertoire)
    expect(stats.chapters).toBe(17)
    expect(stats.lines).toBe(241)
  })

  it('le compte de feuilles de l’arbre correspond au champ `lines` de chaque chapitre', () => {
    for (const chapter of repertoire.chapters) {
      expect(leafLines(chapter.tree)).toHaveLength(chapter.lineCount)
    }
  })

  it('evals.json et lines.json décrivent le même répertoire', () => {
    expect(flat.chapters).toHaveLength(repertoire.chapters.length)
    for (const [i, chapter] of repertoire.chapters.entries()) {
      const other = flat.chapters[i]!
      expect(other.name).toBe(chapter.name)
      expect(other.lines).toHaveLength(chapter.lineCount)
    }
    expect(flat.chapters.reduce((n, c) => n + c.lines.length, 0)).toBe(241)
  })

  it('chaque nœud porte FEN, éval et meilleur coup', () => {
    const stats = repertoireStats(repertoire)
    expect(stats.nodes).toBe(1739)
    for (const chapter of repertoire.chapters) {
      const missing: string[] = []
      const visit = (node: (typeof chapter)['tree']) => {
        if (!node.f || node.e === undefined || !node.b) missing.push(chapter.name)
        for (const child of children(node)) visit(child)
      }
      visit(chapter.tree)
      expect(missing).toEqual([])
    }
  })

  it('la racine de chapitre n’est pas un nœud de coup, ses enfants le sont', () => {
    const first = repertoire.chapters[0]!
    expect(isMoveNode(first.tree)).toBe(false)
    expect(children(first.tree).every(isMoveNode)).toBe(true)
  })

  it('détecte les transpositions (moins de positions uniques que de nœuds)', () => {
    const stats = repertoireStats(repertoire)
    expect(stats.uniquePositions).toBe(1505)
    expect(stats.uniquePositions).toBeLessThan(stats.nodes)
  })

  it('remonte les annotations visuelles de l’étude', () => {
    const stats = repertoireStats(repertoire)
    expect(stats.withArrows).toBe(112)
    expect(stats.withCircles).toBe(52)
    expect(stats.withNags).toBe(51)
    expect(stats.withComment).toBe(9)
  })
})

describe('nodeAtPath', () => {
  const dragon = repertoire.chapters[0]!

  it('descend la ligne principale en SAN', () => {
    const node = nodeAtPath(dragon.tree, ['e4', 'c5', 'Nf3', 'g6', 'd4'])
    expect(node).not.toBeNull()
    expect(isMoveNode(node!) && node!.s).toBe('d4')
    expect(node!.f).toContain('3PP3')
  })

  it('renvoie null dès qu’un coup sort du répertoire', () => {
    expect(nodeAtPath(dragon.tree, ['e4', 'e5'])).toBeNull()
    expect(nodeAtPath(dragon.tree, ['d4'])).toBeNull()
  })

  it('renvoie la racine pour un chemin vide', () => {
    expect(nodeAtPath(dragon.tree, [])).toBe(dragon.tree)
  })

  it('descend aussi en UCI', () => {
    const bySan = nodeAtPath(dragon.tree, ['e4', 'c5', 'Nf3'])
    const byUci = nodeAtUciPath(dragon.tree, ['e2e4', 'c7c5', 'g1f3'])
    expect(byUci).toBe(bySan)
  })

  it('une feuille n’a pas d’enfants — fin de théorie', () => {
    const line = flat.chapters[0]!.lines[0]!.split(' ')
    const leaf = nodeAtPath(dragon.tree, line)
    expect(leaf).not.toBeNull()
    expect(isLeaf(leaf!)).toBe(true)
  })
})

describe('buildTree', () => {
  it('fusionne les préfixes communs', () => {
    const tree = buildTree(['e4 c5 Nf3', 'e4 c5 Nc3', 'e4 e5'])
    expect(children(tree)).toHaveLength(1)
    const c5 = nodeAtPath(tree, ['e4', 'c5'])!
    expect(children(c5).map((n) => n.s)).toEqual(['Nf3', 'Nc3'])
    expect(leafLines(tree)).toHaveLength(3)
  })

  it('reconstruit le même nombre de feuilles que le chapitre d’origine', () => {
    for (const chapter of flat.chapters) {
      expect(leafLines(buildTree(chapter.lines))).toHaveLength(chapter.lines.length)
    }
  })

  it('tolère les espaces multiples et les lignes vides', () => {
    expect(leafLines(buildTree(['  e4   c5  ', '']))).toEqual([['e4', 'c5']])
  })
})

describe('fenKey', () => {
  it('ignore les compteurs de coups (transpositions)', () => {
    const a = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1'
    const b = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 5 12'
    expect(fenKey(a)).toBe(fenKey(b))
  })
})

describe('parseRepertoire — erreurs', () => {
  it('rejette un JSON sans « chapters »', () => {
    expect(() => parseRepertoire({ study: 'x' })).toThrow(RepertoireFormatError)
  })
  it('rejette un chapitre sans arbre', () => {
    expect(() =>
      parseRepertoire({ study: 'x', chapters: [{ name: 'c', lines: 0, tree: null }] }),
    ).toThrow(RepertoireFormatError)
  })
  it('rejette un nœud sans FEN', () => {
    expect(() =>
      parseRepertoire({
        study: 'x',
        chapters: [{ name: 'c', lines: 1, tree: { f: 'ok', v: [{ s: 'e4' }] } }],
      }),
    ).toThrow(RepertoireFormatError)
  })
  it('rejette un champ « lines » tableau dans evals.json (confusion avec lines.json)', () => {
    expect(() =>
      parseRepertoire({ study: 'x', chapters: [{ name: 'c', lines: [], tree: { f: 'ok' } }] }),
    ).toThrow(/entier/)
  })
})
