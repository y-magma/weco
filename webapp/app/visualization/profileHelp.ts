import type { PercentileProfile } from '@domain/entities'
import { expectedProfilePointCount, WID_G_PERCENTILE_COUNT } from '@domain/catalog/widCodes'

import type { ProfileChartType } from '~/visualization/profile'

export interface ProfileHelpContext {
  chartType: ProfileChartType
  logScaleX: boolean
  logScaleY: boolean
  empiricalCdf: boolean
  empiricalPdf: boolean
  lorenzCurve: boolean
  profile: PercentileProfile | null
}

export const PROFILE_HELP = {
  chartType: {
    title: 'Type de graphique',
    paragraphs: [
      'Les 127 g-percentiles WID sont triés par rang croissant. Chaque point correspond à une tranche de population (ex. p50p51 = entre le 50e et le 51e percentile).',
      'Bandes : une bande par tranche, largeur = intervalle de population (ou de richesse en PDF empirique), hauteur = valeur ou densité.',
      'Nuage : un marqueur par tranche, sans liaison entre les points. Variable moyenne (a…) : marqueur au centre de la tranche ]i, k] ; variable seuil (t…) : à la borne basse i.',
      'Ligne : segments reliant les points consécutifs (courbe polyligne). Même règle de positionnement sur l’axe population que le nuage.',
      'Vous pouvez sélectionner deux types en même temps : Bandes + Nuage ou Bandes + Ligne superposent les bandes en filigrane sous le nuage ou la ligne.',
      'En superposition, les bandes suivent le découpage population choisi ; la ligne ou le nuage affiche toujours les tranches fines des données brutes (jusqu’à 127 g-percentiles).',
      'À l’ouverture, les axes sont cadrés sur les bandes ; les curseurs de zoom permettent d’élargir la vue jusqu’à l’étendue complète de la ligne ou du nuage.',
    ],
  },
  empiricalCdf: {
    title: 'CDF empirique',
    paragraphs: [
      'Les axes sont inversés par rapport au profil standard : abscisse = richesse (valeur de la variable), ordonnée = part de population (rang percentile en %).',
      'Chaque point (x, y) associe le seuil ou la moyenne de richesse x à la part y de la population située en dessous de ce niveau.',
      'En mode Ligne, la courbe relie les points (x, y) consécutifs — lecture visuelle d’une fonction de répartition (CDF) empirique lorsque la variable est un seuil (préfixe t…, ex. thweal).',
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
  empiricalPdf: {
    title: 'PDF empirique',
    paragraphs: [
      'Cette vue dérive la courbe de répartition (CDF) affichée en mode « CDF empirique ».',
      'Entre deux segments de percentiles, on calcule la dérivée empirique : f = ΔF / Δx = (rangⱼ − rangᵢ) / (100 × (valeurⱼ − valeurᵢ)).',
      'Plateau (Δx = 0) : les tranches consécutives à la même richesse sont fusionnées ; le bin est émis au prochain saut strictement positif.',
      'Abscisse = richesse (largeur ]valeurᵢ, valeurⱼ] en mode Bandes, borne basse en mode Ligne). Ordonnée = PDF empirique (unité : 1 / unité de richesse, ex. 1/EUR).',
      'Les intervalles où la richesse décroît (Δx < 0) ou les valeurs manquantes sont ignorés.',
      'Interprétation la plus rigoureuse avec une variable seuil (t…). Seules les variables seuil sont sélectionnables dans ce mode. En mode Bandes, l’histogramme est le plus lisible.',
    ],
  },
  smoothDistribution: {
    title: 'CDF / PDF lissée (spline monotone)',
    paragraphs: [
      'Approximation non paramétrique : une spline cubique monotone (PCHIP) est construite sur les nœuds de la CDF empirique F(x) = rang % / 100 aux seuils de richesse.',
      'La CDF lissée interpole ces nœuds sans assumer une loi (Pareto, log-normale, etc.). La PDF lissée est la dérivée f(x) = F′(x) de cette spline.',
      'Modes d’affichage : activez Empirique et/ou Lissée — les deux boutons enfoncés superposent les courbes.',
      'Transformation affichée explicitement — les données brutes WID ne sont pas modifiées ni interpolées silencieusement.',
      'Interprétation rigoureuse avec une variable seuil (t…). Avec une variable moyenne (a…), la CDF/PDF lissée reste indicative.',
      'Avec logX sur la richesse, la spline est construite sur log(x) ; la PDF tient compte de la règle de chaîne.',
    ],
  },
  logScaleX: {
    title: 'Échelle log (abscisse)',
    paragraphs: [
      'L’échelle log s’applique à l’axe horizontal tel qu’il est affiché.',
      'Profil standard : espacement logarithmique depuis le 100 % — les points sont placés en −log₁₀(100 − rang), mais les graduations affichent le rang réel (0 % à gauche, 100 % à droite).',
      'CDF empirique ou PDF empirique : échelle logarithmique sur la richesse. Les valeurs ≤ 0 sont masquées (trou dans la courbe).',
    ],
  },
  logScaleY: {
    title: 'Échelle log (ordonnée)',
    paragraphs: [
      'L’échelle log s’applique à l’axe vertical tel qu’il est affiché.',
      'Profil standard : échelle logarithmique sur la richesse (log₁₀). Seules les valeurs strictement positives sont affichées ; les valeurs ≤ 0 sont masquées (trou dans la courbe).',
      'CDF empirique : espacement logarithmique sur la part de population (même transform −log₁₀(100 − rang) que pour l’axe X en profil standard), graduations en rang % réel.',
      'PDF empirique : échelle logarithmique sur la densité f. Les valeurs ≤ 0 sont masquées.',
    ],
  },
  showAllPercentiles: {
    title: 'Tranches fines sur les plus riches',
    paragraphs: [
      'Les 127 g-percentiles WID sont affichés d’un coup, sans agrégation.',
      'La grille WID est plus fine dans le haut de la distribution (sommet des plus riches).',
      'Chaque point correspond à une tranche native de la base WID.',
    ],
  },
  populationView: {
    title: 'Tranches de population',
    paragraphs: [
      'Tranches fines sur les plus riches : affichage brut des 127 g-percentiles WID.',
      'Tranches de 1 %, 10 % ou 25 % de pop : agrégation en intervalles réguliers ]0 %, step %], ]step %, 2×step %], … jusqu’à 100 %.',
      'En tranches de 1 %, la tranche ]99 %, 100 %] reste agrégée ; un zoom progressif permet d’affiner le sommet de la distribution.',
      'Tranches personnalisées : saisissez les bornes de fin de chaque intervalle (la borne suivante en est le début). Il n’est pas nécessaire d’aller jusqu’à 100 %. Seules les bornes présentes dans les données chargées sont acceptées.',
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
  const { chartType, logScaleX, logScaleY, empiricalCdf, empiricalPdf, lorenzCurve, profile } = ctx
  const unit = profile?.unit ?? 'unité'
  const kind = profile?.kind
  const kindLabel = kind === 'threshold'
    ? 'seuil (t…)'
    : kind === 'average'
      ? 'moyenne (a…)'
      : kind === 'share'
        ? 'part (s…)'
        : kind === 'gini'
          ? 'Gini (g…)'
          : profile?.variable.startsWith('l')
            ? 'émissions de groupe (l…)'
            : 'autre'

  const pointCount = profile?.points.length ?? 0
  const expectedPoints = profile ? expectedProfilePointCount(profile.variable) : WID_G_PERCENTILE_COUNT
  const paragraphs: string[] = [
    kind === 'gini'
      ? `Indicateur agrégé : coefficient de Gini pour ${profile?.label ?? 'la sélection courante'} (${pointCount || '—'} valeur). Unité : ${unit}. Utilisez la série temporelle pour suivre son évolution.`
      : `Données brutes : ${pointCount || '—'} g-percentiles WID pour ${profile?.label ?? 'la sélection courante'}. Variable de type ${kindLabel}, unité ${unit}.`,
  ]
  if (kind !== 'gini' && pointCount > 0 && pointCount < expectedPoints) {
    paragraphs.push(
      `Centiles disponibles : ${pointCount} sur ${expectedPoints} demandés à l'API (selon pays, année et variable).`,
    )
  }
  if (kind === 'share') {
    paragraphs.push(
      'Les parts (s…) indiquent la fraction du total captée par chaque tranche de population (valeurs entre 0 et 1).',
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
  } else if (empiricalPdf) {
    paragraphs.push(
      'Vue active : PDF empirique (dérivée de la CDF).',
      'Seules les variables seuil (préfixe t…) sont disponibles dans ce mode.',
      'Abscisse X = richesse. Ordonnée Y = f(x) = Δ(rang % / 100) / Δ(valeur) entre tranches consécutives.',
      `Formule par intervalle [valeurᵢ, valeurᵢ₊₁] : f = (rangᵢ₊₁ − rangᵢ) / (100 × (valeurᵢ₊₁ − valeurᵢ)).`,
    )
  } else if (empiricalCdf) {
    paragraphs.push(
      'Vue active : CDF empirique (axes inversés).',
      'Abscisse X = richesse (valeur). Ordonnée Y = part de population cumulée (rang percentile en %).',
      kind === 'threshold'
        ? 'Variable seuil : la courbe relie les points d’une fonction de répartition F(x) empirique.'
        : 'Variable moyenne : transposition visuelle — l’axe Y n’est pas une CDF mathématique exacte.',
    )
  } else {
    paragraphs.push(
      'Vue active : profil par centile (vue standard).',
      'Abscisse X = part de population (rang percentile en %). Ordonnée Y = richesse (valeur de la variable).',
    )
  }

  const typeLabels: Record<ProfileChartType, string> = {
    bar: 'bandes',
    scatter: 'nuage de points',
    line: 'ligne (segments entre points)',
    'scatter-bar': 'nuage de points avec bandes en filigrane',
    'line-bar': 'ligne avec bandes en filigrane',
  }
  if (!lorenzCurve) {
    paragraphs.push(`Encodage graphique : ${typeLabels[chartType]}.`)
  } else {
    paragraphs.push('Encodage graphique : courbe polyligne (référence d’égalité parfaite en pointillés).')
  }

  if (logScaleX) {
    if (empiricalCdf || empiricalPdf) {
      paragraphs.push('Échelle log (X) : richesse en échelle logarithmique ; valeurs ≤ 0 exclues.')
    } else {
      paragraphs.push(
        'Échelle log (X) : espacement −log₁₀(100 − rang) depuis le 100 % ; graduations en rang % réel (0 % à gauche).',
      )
    }
  }

  if (logScaleY) {
    if (empiricalPdf) {
      paragraphs.push('Échelle log (Y) : densité f en échelle logarithmique.')
    } else if (empiricalCdf) {
      paragraphs.push(
        'Échelle log (Y) : espacement −log₁₀(100 − rang) sur la part de population ; graduations en rang % réel.',
      )
    } else {
      paragraphs.push(
        'Échelle log (Y) : richesse en symlog f(x)=signe(x)·log₁₀(1+|x|) ; graduations en valeurs réelles (≤ 0 incluses).',
      )
    }
  }

  if (lorenzCurve) {
    paragraphs.push('Axes linéaires 0–100 % (échelles log désactivées en mode Lorenz).')
  }

  if (!lorenzCurve && !empiricalPdf
    && (chartType === 'line' || chartType === 'scatter' || chartType === 'line-bar' || chartType === 'scatter-bar')) {
    if (kind === 'average') {
      paragraphs.push(
        'Position sur l’axe population : centre de la tranche ]i, k] (ex. p50p51 → 50,5 %) pour les variables moyenne (a…).',
      )
    } else if (kind === 'threshold') {
      paragraphs.push(
        'Position sur l’axe population : borne basse i de la tranche (ex. p50p51 → 50 %) pour les variables seuil (t…).',
      )
    }
  }

  if (!logScaleX && !logScaleY && !empiricalCdf && !empiricalPdf && !lorenzCurve
    && (chartType === 'line' || chartType === 'line-bar')) {
    paragraphs.push('Sans option log : axes linéaires. Segments reliant les points consécutifs de chaque tranche de percentile.')
  }

  return {
    title: 'Comment sont calculées mes données ?',
    paragraphs,
  }
}
