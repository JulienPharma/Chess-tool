import { parseRepertoire, type Repertoire } from './repertoire'
import raw from '../../data/repertoire-noir.evals.json'

/**
 * Répertoire noir embarqué dans le bundle (source de vérité versionnée dans
 * `data/`). La base sert au versionnage et à la resynchronisation, pas au
 * chargement à froid : l'app doit démarrer même hors ligne.
 */
export const repertoireNoir: Repertoire = parseRepertoire(raw)
