export type PanneauType = 'temps' | 'trapeze'

export interface PanneauTypeMeta {
  id: PanneauType
  icon: string
  title: string
  subtitle: string
  text: string
  route: string
}

export const PANNEAU_TYPES: PanneauTypeMeta[] = [
  {
    id: 'temps',
    icon: 'mdi-chart-timeline-variant',
    title: 'Série temporelle',
    subtitle: 'Un pays, plusieurs tranches',
    text: 'Suivre un indicateur année après année pour un pays.',
    route: '/panneau/temps',
  },
  {
    id: 'trapeze',
    icon: 'mdi-chart-areaspline',
    title: 'Profil d\'inégalité et approximations',
    subtitle: 'Du plus modeste au plus aisé',
    text: 'Visualiser la répartition dans la population et approximer la courbe par trapèzes et rectangles.',
    route: '/panneau/trapeze',
  },
]

export function findPanneauType(id: PanneauType): PanneauTypeMeta {
  return PANNEAU_TYPES.find((item) => item.id === id) ?? PANNEAU_TYPES[0]!
}
