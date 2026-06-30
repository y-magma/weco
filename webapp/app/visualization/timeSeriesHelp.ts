import type { TrancheStackMode } from '~/visualization/timeSeries'

export const TIME_SERIES_HELP = {
  stackModeWeighted: {
    title: 'Empilement pondéré',
    hint: 'Transformation appliquée aux valeurs tracées',
    paragraphs: [
      'Les données brutes WID sont des moyennes par tranche de population (variable a…, ex. ahweal).',
      'Dans ce mode, chaque point tracé vaut : moyenne WID × (largeur de la tranche / 100). Exemple : moyenne Bas 50 % = 100 000 € → hauteur affichée = 50 000.',
      'La somme des aires empilées ≈ patrimoine (ou revenu) moyen national — c’est une décomposition de la moyenne pondérée, pas la moyenne de chaque tranche.',
      'Au survol, le tooltip affiche la valeur transformée (contribution), pas la moyenne WID brute. Basculez sur « Valeurs réelles » pour voir les moyennes telles que publiées par WID.world.',
    ],
  },
  stackModeRaw: {
    title: 'Valeurs réelles (sans transformation)',
    hint: 'Moyennes WID brutes, empilées telles quelles',
    paragraphs: [
      'Chaque aire correspond à la moyenne WID de la tranche, sans multiplication par la part de population.',
      'Les hauteurs sont comparables aux chiffres du site WID.world pour le même code percentile (ex. p0p50, p99.9p100).',
      'La somme des aires empilées n’a pas de signification économique directe : les tranches couvrent des parts de population différentes.',
      'Le tooltip et l’axe Y affichent les mêmes valeurs que la source.',
    ],
  },
  widTranches: {
    title: 'Tranches et source WID',
    hint: 'Comment les tranches sont chargées',
    paragraphs: [
      'Une requête API WID est envoyée par tranche affichée (code percentile × variable × âge × population).',
      'La tranche 50 % - 90 % - 99 % - 99,9 % - 100 % utilise les groupes clés WID : p0p50, p50p90, p90p99, p99p99.9, p99.9p100.',
      'Contrairement au panneau Profil, il n’y a pas d’agrégation locale à partir des 127 g-percentiles : les codes percentile demandés à l’API sont ceux affichés.',
      'Top 1 % (p99p99.9) = ]99 %, 99,9 %] ; Top 0,1 % (p99.9p100) = ]99,9 %, 100 %]. Ensemble, elles couvrent le top 1 % complet.',
    ],
  },
  decileShares: {
    title: 'Parts empilées (World Bank / bundle décile)',
    hint: 'Pas de transformation sur les parts',
    paragraphs: [
      'Les valeurs sont des parts de revenu ou de consommation déjà publiées par la source (0–1 ou % selon l’indicateur).',
      'L’empilement additionne directement ces parts : la hauteur totale ≈ 1 (ou 100 % selon l’unité).',
      'Aucune moyenne implicite ni pondération par largeur de tranche.',
    ],
  },
} as const

export function buildTimeSeriesStackHelp(stackMode: TrancheStackMode): {
  title: string
  hint: string
  paragraphs: readonly string[]
} {
  return stackMode === 'raw'
    ? TIME_SERIES_HELP.stackModeRaw
    : TIME_SERIES_HELP.stackModeWeighted
}
