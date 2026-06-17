/**
 * Découpage population pour la série temporelle empilée (style distribution patrimoniale).
 */
import { buildGPercentiles, parsePercentileRank } from '@domain/services/percentiles'
import {
  buildStepBreakpoints,
  describeCustomIntervals,
  formatBracketCode,
  type PopulationStep,
} from '~/visualization/populationPartition'

export type TimeSeriesPartitionMode = 'wealth' | 'step10' | 'step25' | 'custom'

/** Bornes par défaut (style infographie : bas 50 %, 50–90 %, 90–99 %, top 1 %, top 0,1 %). */
export const TIME_SERIES_DEFAULT_BREAKPOINTS = [50, 90, 99, 99.9, 100] as const

export const TIME_SERIES_PARTITION_OPTIONS: { value: TimeSeriesPartitionMode, label: string }[] = [
  { value: 'wealth', label: 'Distribution patrimoniale (défaut)' },
  { value: 'step10', label: 'Tranches de 10 % de pop' },
  { value: 'step25', label: 'Tranches de 25 % de pop' },
  { value: 'custom', label: 'Tranches personnalisées' },
]

/** Tranches de population pour la comparaison multi-pays (une seule tranche à la fois). */
export const TIME_SERIES_COMPARE_POPULATION_OPTIONS: { value: string, label: string }[] = [
  { value: 'p0p50', label: 'Bas 50 %' },
  { value: 'p50p90', label: '50–90 %' },
  { value: 'p90p99', label: '90–99 %' },
  { value: 'p99p99.9', label: 'Top 1 %' },
  { value: 'p99.9p100', label: 'Top 0,1 %' },
  { value: 'p50p51', label: 'Médiane (p50–51)' },
  { value: 'p0p100', label: 'Ensemble de la population' },
]

/** Palette inspirée de l'infographie (bas → haut). */
export const TIME_SERIES_TRANCHE_COLORS = [
  '#6B3030',
  '#B85C38',
  '#C9A227',
  '#5EAAA8',
  '#7EC8C6',
  '#4A8B88',
  '#3D7472',
  '#305D5B',
  '#284E4C',
  '#1F3F3D',
] as const

const WEALTH_TRANCHE_LABELS: Record<string, string> = {
  p0p50: 'Bas 50 %',
  p50p90: '50–90 %',
  p90p99: '90–99 %',
  'p99p99.9': 'Top 1 %',
  'p99.9p100': 'Top 0,1 %',
}

export interface TimeSeriesTranche {
  code: string
  label: string
  lo: number
  hi: number
  width: number
  color: string
}

/** Bornes de population admissibles pour le découpage personnalisé (grille WID). */
export function standardPopulationBoundaries(): number[] {
  const set = new Set<number>([0, 100])
  for (const percentile of buildGPercentiles()) {
    set.add(parsePercentileRank(percentile))
    const upper = percentile.split('p').pop()
    if (upper) {
      const hi = Number.parseFloat(upper)
      if (Number.isFinite(hi)) set.add(hi)
    }
  }
  return [...set].sort((a, b) => a - b)
}

export function breakpointsForMode(mode: TimeSeriesPartitionMode, custom: number[]): number[] {
  if (mode === 'wealth') return [...TIME_SERIES_DEFAULT_BREAKPOINTS]
  if (mode === 'step10') return buildStepBreakpoints(10)
  if (mode === 'step25') return buildStepBreakpoints(25)
  return custom
}

function defaultTrancheLabel(code: string, lo: number, hi: number): string {
  return WEALTH_TRANCHE_LABELS[code] ?? `]${lo} %, ${hi} %]`
}

/** Construit les tranches ordonnées (bas → haut) pour une liste de bornes de fin. */
export function buildTimeSeriesTranches(
  breakpoints: number[],
  mode: TimeSeriesPartitionMode = 'wealth',
): TimeSeriesTranche[] {
  const tranches: TimeSeriesTranche[] = []
  let lo = 0

  const intervalLabels = mode === 'wealth' ? null : describeCustomIntervals(breakpoints)

  for (let index = 0; index < breakpoints.length; index += 1) {
    const hi = breakpoints[index]!
    const code = formatBracketCode(lo, hi)
    tranches.push({
      code,
      label: mode === 'wealth'
        ? defaultTrancheLabel(code, lo, hi)
        : (intervalLabels?.[index] ?? `]${lo} %, ${hi} %]`),
      lo,
      hi,
      width: hi - lo,
      color: TIME_SERIES_TRANCHE_COLORS[index % TIME_SERIES_TRANCHE_COLORS.length]!,
    })
    lo = hi
  }

  return tranches
}

/**
 * Masse relative de patrimoine dans une tranche : moyenne × part de population.
 * Permet d'empiler les tranches tout en conservant les proportions entre groupes.
 */
export function stackValueFromAverage(average: number | null | undefined, width: number): number | null {
  if (average === null || average === undefined || !Number.isFinite(average)) return null
  if (width <= 0) return null
  return average * width / 100
}

export function stepFromTimeSeriesMode(mode: TimeSeriesPartitionMode): PopulationStep | null {
  if (mode === 'step10') return 10
  if (mode === 'step25') return 25
  return null
}
