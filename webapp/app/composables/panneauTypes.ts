export type PanneauType = 'population' | 'temps' | 'variables'

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
    subtitle: 'Variable en fonction du temps',
    text: 'Évolution d’une variable WID au fil des années, à un percentile fixé.',
    route: '/panneau/temps',
  },
  {
    id: 'variables',
    icon: 'mdi-chart-scatter-plot',
    title: 'Variable vs variable',
    subtitle: 'Nuage de points',
    text: 'Relation entre deux variables WID jointes par percentile.',
    route: '/panneau/variables',
  },
  {
    id: 'population',
    icon: 'mdi-chart-bar',
    title: 'Variable vs population',
    subtitle: 'Profil sur les g-percentiles',
    text: 'Valeur d’une variable à travers les 127 g-percentiles.',
    route: '/panneau/population',
  },
]

export function findPanneauType(id: PanneauType): PanneauTypeMeta {
  return PANNEAU_TYPES.find((item) => item.id === id) ?? PANNEAU_TYPES[2]!
}
