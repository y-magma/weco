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
    subtitle: 'Une évolution dans le temps',
    text: 'Suivre un indicateur année après année.',
    route: '/panneau/temps',
  },
  {
    id: 'variables',
    icon: 'mdi-chart-scatter-plot',
    title: 'Relation entre 2 indicateurs',
    subtitle: 'Comparer deux mesures',
    text: 'Repérer si deux indicateurs varient de concert.',
    route: '/panneau/variables',
  },
  {
    id: 'population',
    icon: 'mdi-chart-bar',
    title: 'Inégalités et profil',
    subtitle: 'Du plus modeste au plus aisé',
    text: 'Voir comment une mesure se répartit dans la population.',
    route: '/panneau/population',
  },
]

export function findPanneauType(id: PanneauType): PanneauTypeMeta {
  return PANNEAU_TYPES.find((item) => item.id === id) ?? PANNEAU_TYPES[2]!
}
