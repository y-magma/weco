import type { PercentileProfile } from '@src/domain/types'

export interface ProfileHelpContext {
  chartType: 'bar' | 'scatter' | 'line'
  logScaleX: boolean
  logScaleY: boolean
  populationDensity: boolean
  probabilityDensity: boolean
  profile: PercentileProfile | null
}

export const PROFILE_HELP = {
  chartType: {
    title: 'Type de graphique',
    paragraphs: [
      'Les 127 g-percentiles WID sont triés par rang croissant. Chaque point correspond à une tranche de population (ex. p50p51 = entre le 50e et le 51e percentile).',
      'Bâtons : une barre par tranche, hauteur = valeur de la variable.',
      'Nuage : un marqueur par tranche, sans liaison entre les points.',
      'Ligne : courbe en escalier (step) — la valeur reste constante sur toute la largeur de la tranche de population, puis saute au niveau suivant.',
    ],
  },
  populationDensity: {
    title: 'Densité de population',
    paragraphs: [
      'Les axes sont inversés par rapport au profil standard : abscisse = richesse (valeur de la variable), ordonnée = part de population (rang percentile en %).',
      'Chaque point (x, y) associe le seuil ou la moyenne de richesse x à la part y de la population située en dessous de ce niveau.',
      'En mode Ligne, la courbe en escalier représente une fonction de répartition (CDF) empirique lorsque la variable est un seuil (préfixe t…, ex. thweal).',
      'Pour une variable moyenne (préfixe a…, ex. ahweal), il s’agit d’une transposition visuelle des mêmes données — ce n’est pas une CDF mathématique stricto sensu.',
    ],
  },
  probabilityDensity: {
    title: 'Densité de probabilité',
    paragraphs: [
      'Cette vue dérive la courbe de répartition (CDF) affichée en mode « Densité de population ».',
      'Entre deux tranches de percentiles consécutives i et i+1, on calcule la dérivée empirique : f = ΔF / Δx = (rangᵢ₊₁ − rangᵢ) / (100 × (valeurᵢ₊₁ − valeurᵢ)).',
      'Abscisse = richesse (milieu de tranche en mode Bâtons, borne basse en mode Ligne). Ordonnée = densité de probabilité (unité : 1 / unité de richesse, ex. 1/EUR).',
      'Les intervalles où la richesse ne croît pas (Δx ≤ 0) ou les valeurs manquantes sont ignorés.',
      'Interprétation la plus rigoureuse avec une variable seuil (t…). En mode Bâtons, l’histogramme est le plus lisible.',
    ],
  },
  logScaleX: {
    title: 'Échelle log (abscisse)',
    paragraphs: [
      'L’échelle log s’applique à l’axe horizontal tel qu’il est affiché.',
      'Profil standard : espacement logarithmique depuis le 100 % — les points sont placés en −log₁₀(100 − rang), mais les graduations affichent le rang réel (0 % à gauche, 100 % à droite).',
      'Densité de population ou de probabilité : échelle logarithmique sur la richesse. Les valeurs ≤ 0 sont masquées (trou dans la courbe).',
    ],
  },
  logScaleY: {
    title: 'Échelle log (ordonnée)',
    paragraphs: [
      'L’échelle log s’applique à l’axe vertical tel qu’il est affiché.',
      'Profil standard : échelle logarithmique sur la richesse. Les valeurs ≤ 0 sont masquées.',
      'Densité de population : espacement logarithmique sur la part de population (même transform −log₁₀(100 − rang) que pour l’axe X en profil standard), graduations en rang % réel.',
      'Densité de probabilité : échelle logarithmique sur la densité f. Les valeurs ≤ 0 sont masquées.',
    ],
  },
} as const

export function buildActiveCalculationHelp(ctx: ProfileHelpContext): {
  title: string
  paragraphs: string[]
} {
  const { chartType, logScaleX, logScaleY, populationDensity, probabilityDensity, profile } = ctx
  const unit = profile?.unit ?? 'unité'
  const kind = profile?.kind
  const kindLabel = kind === 'threshold'
    ? 'seuil (t…)'
    : kind === 'average'
      ? 'moyenne (a…)'
      : 'autre'

  const paragraphs: string[] = [
    `Données brutes : ${profile?.points.length ?? '—'} g-percentiles WID pour ${profile?.label ?? 'la sélection courante'}. Variable de type ${kindLabel}, unité ${unit}.`,
  ]

  if (probabilityDensity) {
    paragraphs.push(
      'Vue active : densité de probabilité (dérivée de la CDF).',
      'Abscisse X = richesse. Ordonnée Y = f(x) = Δ(rang % / 100) / Δ(valeur) entre tranches consécutives.',
      `Formule par intervalle [valeurᵢ, valeurᵢ₊₁] : f = (rangᵢ₊₁ − rangᵢ) / (100 × (valeurᵢ₊₁ − valeurᵢ)).`,
    )
  } else if (populationDensity) {
    paragraphs.push(
      'Vue active : densité de population (axes inversés, CDF empirique).',
      'Abscisse X = richesse (valeur). Ordonnée Y = part de population cumulée (rang percentile en %).',
      kind === 'threshold'
        ? 'Variable seuil : la courbe en escalier est une vraie fonction de répartition F(x).'
        : 'Variable moyenne : transposition visuelle — l’axe Y n’est pas une CDF mathématique exacte.',
    )
  } else {
    paragraphs.push(
      'Vue active : profil par centile (vue standard).',
      'Abscisse X = part de population (rang percentile en %). Ordonnée Y = richesse (valeur de la variable).',
    )
  }

  const typeLabels = { bar: 'bâtons', scatter: 'nuage de points', line: 'ligne en escalier' }
  paragraphs.push(`Encodage graphique : ${typeLabels[chartType]}.`)

  if (logScaleX) {
    if (populationDensity || probabilityDensity) {
      paragraphs.push('Échelle log (X) : richesse en échelle logarithmique ; valeurs ≤ 0 exclues.')
    } else {
      paragraphs.push(
        'Échelle log (X) : espacement −log₁₀(100 − rang) depuis le 100 % ; graduations en rang % réel (0 % à gauche).',
      )
    }
  }

  if (logScaleY) {
    if (probabilityDensity) {
      paragraphs.push('Échelle log (Y) : densité f en échelle logarithmique.')
    } else if (populationDensity) {
      paragraphs.push(
        'Échelle log (Y) : espacement −log₁₀(100 − rang) sur la part de population ; graduations en rang % réel.',
      )
    } else {
      paragraphs.push('Échelle log (Y) : richesse en échelle logarithmique ; valeurs ≤ 0 exclues.')
    }
  }

  if (!logScaleX && !logScaleY && !populationDensity && !probabilityDensity && chartType === 'line') {
    paragraphs.push('Sans option log : axes linéaires. Courbe en escalier : valeur constante par tranche de percentile.')
  }

  return {
    title: 'Comment sont calculées mes données ?',
    paragraphs,
  }
}
