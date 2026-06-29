export type PanneauType = 'temps' | 'temps-compare' | 'exploration'

export interface GridPanelModel {
  id: number
  type: PanneauType
  sourceId?: string
}

export interface PanneauTypeMeta {
  id: PanneauType
  icon: string
  title: string
  subtitle: string
  text: string
  route: string
  /** Affiché sur la page Exploration des données (/panneau). */
  showInExplorer?: boolean
}

export const PANNEAU_TYPES: PanneauTypeMeta[] = [
  {
    id: 'temps',
    icon: 'mdi-chart-timeline-variant',
    title: 'Série temporelle',
    subtitle: 'Un pays, plusieurs tranches',
    text: 'Suivre un indicateur année après année pour un pays, ou comparer une tranche entre plusieurs pays.',
    route: '/panneau/temps',
    showInExplorer: true,
  },
  {
    id: 'temps-compare',
    icon: 'mdi-chart-multiple',
    title: 'Comparaison multi-pays',
    subtitle: 'Une tranche, plusieurs pays',
    text: 'Comparer la même tranche de population entre plusieurs pays.',
    route: '/panneau/temps',
    showInExplorer: false,
  },
  {
    id: 'exploration',
    icon: 'mdi-chart-areaspline',
    title: 'Profil d\'inégalité et approximations',
    subtitle: 'Du plus modeste au plus aisé',
    text: 'Visualiser la répartition dans la population et approximer la courbe par trapèzes et rectangles.',
    route: '/panneau/exploration',
    showInExplorer: true,
  },
]

export const EXPLORER_PANNEAU_TYPES = PANNEAU_TYPES.filter((item) => item.showInExplorer)

export function findPanneauType(id: PanneauType): PanneauTypeMeta {
  return PANNEAU_TYPES.find((item) => item.id === id) ?? PANNEAU_TYPES[0]!
}
