import type { PercentileProfile } from '@domain/entities'
import { WID_G_PERCENTILE_COUNT } from '@domain/catalog/widCodes'

export interface ProfileHelpContext {
  chartType: 'bar' | 'scatter' | 'line'
  logScaleX: boolean
  logScaleY: boolean
  populationDensity: boolean
  probabilityDensity: boolean
  lorenzCurve: boolean
  profile: PercentileProfile | null
}

export const PROFILE_HELP = {
  chartType: {
    title: 'Type de graphique',
    paragraphs: [
      'Les 127 g-percentiles WID sont triés par rang croissant. Chaque point correspond à une tranche de population (ex. p50p51 = entre le 50e et le 51e percentile).',
      'Bandes : une bande par tranche, largeur = intervalle de population (ou de richesse en densité de probabilité), hauteur = valeur ou densité.',
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
  lorenzCurve: {
    title: 'Courbe de Lorenz',
    paragraphs: [
      'La courbe de Lorenz compare la part cumulée de la population à la part cumulée du patrimoine (ou de la variable affichée).',
      'Abscisse = part cumulée de la population (%). Ordonnée = part cumulée du patrimoine (%). Les deux axes sont linéaires de 0 % à 100 %.',
      'Entre deux g-percentiles consécutifs de rangs rᵢ et rᵢ₊₁, on estime la masse de patrimoine dans la tranche : masseᵢ = (rᵢ₊₁ − rᵢ) / 100 × (valeurᵢ + valeurᵢ₊₁) / 2.',
      'La part cumulée de patrimoine au rang rᵢ₊₁ est : 100 × Σ masseⱼ / Σ masse (somme sur toutes les tranches).',
      'La droite pointillée « égalité parfaite » (y = x) sert de référence : plus la courbe s’écarte vers le bas, plus la concentration est forte.',
      'Approximation discrète à partir des g-percentiles WID : plus rigoureuse avec une variable seuil (t…), indicative avec une variable moyenne (a…).',
    ],
  },
  probabilityDensity: {
    title: 'Densité de probabilité',
    paragraphs: [
      'Cette vue dérive la courbe de répartition (CDF) affichée en mode « Densité de population ».',
      'Entre deux tranches de percentiles consécutives i et i+1, on calcule la dérivée empirique : f = ΔF / Δx = (rangᵢ₊₁ − rangᵢ) / (100 × (valeurᵢ₊₁ − valeurᵢ)).',
      'Abscisse = richesse (largeur ]valeurᵢ, valeurᵢ₊₁] en mode Bandes, borne basse en mode Ligne). Ordonnée = densité de probabilité (unité : 1 / unité de richesse, ex. 1/EUR).',
      'Les intervalles où la richesse ne croît pas (Δx ≤ 0) ou les valeurs manquantes sont ignorés.',
      'Interprétation la plus rigoureuse avec une variable seuil (t…). Seules les variables seuil sont sélectionnables dans ce mode. En mode Bandes, l’histogramme est le plus lisible.',
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
  showAllPercentiles: {
    title: '127 g-percentiles',
    paragraphs: [
      'Les 127 g-percentiles WID sont affichés d’un coup.',
      'Décochez « 127 g-percentiles » pour revenir à la vue agrégée avec zoom progressif sur le sommet.',
    ],
  },
  drillMaxLevel: {
    title: 'Niveau de zoom maximal',
    paragraphs: [
      'Niveau le plus fin atteint : tranches de la queue de distribution affichées telles quelles.',
    ],
  },
} as const

export function buildDrillDownHelp(code: string | null): {
  title: string
  paragraphs: string[]
  hint: string
} {
  return {
    title: 'Zoom progressif sur le sommet',
    hint: 'Cliquer sur la tranche du sommet pour zoomer',
    paragraphs: [
      `Cliquez sur la tranche du sommet (${code ?? '…'}, vers 100 %) pour la re-découper en tranches plus fines.`,
      'Le fil d’Ariane au-dessus permet de revenir en arrière.',
    ],
  }
}

export function buildActiveCalculationHelp(ctx: ProfileHelpContext): {
  title: string
  paragraphs: string[]
} {
  const { chartType, logScaleX, logScaleY, populationDensity, probabilityDensity, lorenzCurve, profile } = ctx
  const unit = profile?.unit ?? 'unité'
  const kind = profile?.kind
  const kindLabel = kind === 'threshold'
    ? 'seuil (t…)'
    : kind === 'average'
      ? 'moyenne (a…)'
      : profile?.variable.startsWith('l')
        ? 'émissions de groupe (l…)'
        : 'autre'

  const pointCount = profile?.points.length ?? 0
  const paragraphs: string[] = [
    `Données brutes : ${pointCount || '—'} g-percentiles WID pour ${profile?.label ?? 'la sélection courante'}. Variable de type ${kindLabel}, unité ${unit}.`,
  ]
  if (pointCount > 0 && pointCount < WID_G_PERCENTILE_COUNT) {
    paragraphs.push(
      `Centiles disponibles : ${pointCount} sur ${WID_G_PERCENTILE_COUNT} demandés à l'API (selon pays, année et variable).`,
    )
  }

  if (lorenzCurve) {
    paragraphs.push(
      'Vue active : courbe de Lorenz (cumul population vs cumul patrimoine).',
      'Abscisse X = part cumulée de la population (%). Ordonnée Y = part cumulée du patrimoine (%).',
      'Par tranche ]rᵢ, rᵢ₊₁] : masse = (rᵢ₊₁ − rᵢ) / 100 × (valeurᵢ + valeurᵢ₊₁) / 2 ; part cumulée = 100 × Σ masse / total.',
      kind === 'threshold'
        ? 'Variable seuil : les valeurs sont des seuils de richesse — approximation standard pour une Lorenz empirique.'
        : 'Variable moyenne : les valeurs sont des moyennes par tranche — approximation indicative de la concentration.',
    )
  } else if (probabilityDensity) {
    paragraphs.push(
      'Vue active : densité de probabilité (dérivée de la CDF).',
      'Seules les variables seuil (préfixe t…) sont disponibles dans ce mode.',
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

  const typeLabels = { bar: 'bandes', scatter: 'nuage de points', line: 'ligne en escalier' }
  if (!lorenzCurve) {
    paragraphs.push(`Encodage graphique : ${typeLabels[chartType]}.`)
  } else {
    paragraphs.push('Encodage graphique : courbe en escalier (référence d’égalité parfaite en pointillés).')
  }

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

  if (lorenzCurve) {
    paragraphs.push('Axes linéaires 0–100 % (échelles log désactivées en mode Lorenz).')
  }

  if (!logScaleX && !logScaleY && !populationDensity && !probabilityDensity && !lorenzCurve && chartType === 'line') {
    paragraphs.push('Sans option log : axes linéaires. Courbe en escalier : valeur constante par tranche de percentile.')
  }

  return {
    title: 'Comment sont calculées mes données ?',
    paragraphs,
  }
}
