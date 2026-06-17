/**
 * Découpage de la population en tranches d'observation pour le profil WID.
 *
 * Modes :
 *   - 127 g-percentiles bruts
 *   - agrégation à pas fixe (1 %, 10 %, 25 %)
 *   - découpage personnalisé (bornes de fin saisies par l'utilisateur)
 */
import type { PercentilePoint } from '@domain/entities'
import { parsePercentileInterval } from '@domain/services/percentiles'

export type PopulationViewMode = 'all' | 'step1' | 'step10' | 'step25' | 'custom'

export type PopulationStep = 1 | 10 | 25

export const POPULATION_VIEW_OPTIONS: { value: PopulationViewMode, label: string }[] = [
  { value: 'all', label: 'Tranches fines sur les plus riches' },
  { value: 'step1', label: 'Tranches de 1 % de pop' },
  { value: 'step10', label: 'Tranches de 10 % de pop' },
  { value: 'step25', label: 'Tranches de 25 % de pop' },
  { value: 'custom', label: 'Tranches personnalisées' },
]

/** Sous-ensemble pour le panneau trapèzes (courbe d'origine). */
export const TRAPEZOID_POPULATION_VIEW_OPTIONS = POPULATION_VIEW_OPTIONS.filter(
  (option) => option.value === 'all' || option.value === 'step1',
)

/** Profil : uniquement 127 g-percentiles bruts ou tranches de 1 % (100 percentiles). */
export const PROFILE_POPULATION_VIEW_OPTIONS = POPULATION_VIEW_OPTIONS.filter(
  (option) => option.value === 'all' || option.value === 'step1',
)

const EPS = 1e-9

function fmt(n: number): string {
  return Number(n.toFixed(3)).toString()
}

/** Construit un code de tranche `pLOpHI` (convention WID). */
export function formatBracketCode(lo: number, hi: number): string {
  return `p${fmt(lo)}p${fmt(hi)}`
}

/**
 * Valeur agrégée d'un ensemble de tranches, pondérée par la largeur de
 * population (k − i). Correct pour les moyennes `a…` ; approximation
 * raisonnable pour les seuils `t…`. Renvoie null si aucune valeur exploitable.
 */
export function aggregatePointValue(points: PercentilePoint[]): number | null {
  let weighted = 0
  let weight = 0
  for (const point of points) {
    if (point.value === null || !Number.isFinite(point.value)) continue
    const interval = parsePercentileInterval(point.percentile)
    const w = interval ? interval.k - interval.i : 1
    if (w <= 0) continue
    weighted += point.value * w
    weight += w
  }
  return weight > 0 ? weighted / weight : null
}

function roundBoundary(n: number): number {
  return Number(n.toFixed(6))
}

/** Bornes de population présentes dans les données chargées (début ou fin d'un g-percentile). */
export function extractAvailableBoundaries(points: PercentilePoint[]): number[] {
  const set = new Set<number>([0, 100])
  for (const point of points) {
    const interval = parsePercentileInterval(point.percentile)
    if (!interval) continue
    set.add(roundBoundary(interval.i))
    set.add(roundBoundary(interval.k))
  }
  return [...set].sort((a, b) => a - b)
}

/** Bornes de fin pour un pas fixe (intervalles ]0, step], ]step, 2×step], …, ]100−step, 100]). */
export function buildStepBreakpoints(step: PopulationStep): number[] {
  const breakpoints: number[] = []
  for (let hi = step; hi < 100; hi += step) {
    breakpoints.push(hi)
  }
  breakpoints.push(100)
  return breakpoints
}

/**
 * Agrège les g-percentiles en tranches délimitées par `breakpoints` (bornes de fin).
 * `startLo` permet le zoom drill-down sur une sous-zone (ex. ]99 %, 100 %]).
 */
export function buildPartitionPoints(
  allPoints: PercentilePoint[],
  breakpoints: number[],
  startLo = 0,
): PercentilePoint[] {
  const lo0 = roundBoundary(startLo)
  const result: PercentilePoint[] = []
  let lo = lo0

  for (const hiRaw of breakpoints) {
    const hi = roundBoundary(hiRaw)
    const underlying = allPoints.filter((point) => {
      const interval = parsePercentileInterval(point.percentile)
      if (!interval) return false
      return interval.i >= lo - EPS && interval.k <= hi + EPS
    })

    result.push({
      percentile: formatBracketCode(lo, hi),
      rank: lo,
      value: aggregatePointValue(underlying),
    })
    lo = hi
  }

  return result
}

export function stepFromMode(mode: PopulationViewMode): PopulationStep | null {
  if (mode === 'step1') return 1
  if (mode === 'step10') return 10
  if (mode === 'step25') return 25
  return null
}

export function isCustomPartitionComplete(breakpoints: number[]): boolean {
  if (breakpoints.length === 0) return false
  return roundBoundary(breakpoints[breakpoints.length - 1]!) === 100
}

export function parseBoundaryInput(input: string): number | null {
  const trimmed = input.trim().replace(',', '.')
  if (!trimmed) return null
  const n = Number.parseFloat(trimmed)
  if (!Number.isFinite(n) || n <= 0 || n > 100) return null
  return roundBoundary(n)
}

export function isBoundaryAvailable(value: number, available: number[]): boolean {
  const rounded = roundBoundary(value)
  return available.some((b) => roundBoundary(b) === rounded)
}

export interface CustomBreakpointValidation {
  valid: boolean
  error: string | null
}

/** Valide la liste complète des bornes de fin (doit se terminer par 100). */
export function validateCustomBreakpoints(
  breakpoints: number[],
  available: number[],
): CustomBreakpointValidation {
  if (breakpoints.length === 0) {
    return { valid: false, error: 'Entrez les bornes de fin des intervalles jusqu’à 100 %.' }
  }

  let prev = 0
  for (const bp of breakpoints) {
    const rounded = roundBoundary(bp)
    if (!isBoundaryAvailable(rounded, available)) {
      return {
        valid: false,
        error: `${formatBoundaryLabel(rounded)} n’est pas une borne disponible dans les données chargées.`,
      }
    }
    if (rounded <= prev) {
      return { valid: false, error: 'Les bornes doivent être strictement croissantes.' }
    }
    prev = rounded
  }

  if (prev !== 100) {
    return { valid: false, error: 'Terminez le découpage par la borne 100 %.' }
  }

  return { valid: true, error: null }
}

/** Valide les bornes sans exiger que la dernière soit 100 %. */
export function validatePartialCustomBreakpoints(
  breakpoints: number[],
  available: number[],
): CustomBreakpointValidation {
  if (breakpoints.length === 0) {
    return { valid: false, error: 'Entrez au moins une borne de fin d’intervalle.' }
  }

  let prev = 0
  for (const bp of breakpoints) {
    const rounded = roundBoundary(bp)
    if (!isBoundaryAvailable(rounded, available)) {
      return {
        valid: false,
        error: `${formatBoundaryLabel(rounded)} n’est pas une borne disponible dans les données chargées.`,
      }
    }
    if (rounded <= prev) {
      return { valid: false, error: 'Les bornes doivent être strictement croissantes.' }
    }
    prev = rounded
  }

  return { valid: true, error: null }
}

/** Valide une borne candidate avant ajout à la liste. */
export function validateNextCustomBreakpoint(
  value: number,
  existing: number[],
  available: number[],
): CustomBreakpointValidation {
  const rounded = roundBoundary(value)
  if (!isBoundaryAvailable(rounded, available)) {
    return {
      valid: false,
      error: `${formatBoundaryLabel(rounded)} n’est pas une borne disponible dans les données chargées.`,
    }
  }

  const last = existing.length > 0 ? roundBoundary(existing[existing.length - 1]!) : 0
  if (rounded <= last) {
    return {
      valid: false,
      error: `La borne doit être strictement supérieure à ${formatBoundaryLabel(last)}.`,
    }
  }

  return { valid: true, error: null }
}

/** Bornes encore sélectionnables (strictement après la dernière, jusqu’à 100). */
export function selectableCustomBoundaries(
  existing: number[],
  available: number[],
): number[] {
  const last = existing.length > 0 ? roundBoundary(existing[existing.length - 1]!) : 0
  return available.filter((b) => {
    const rounded = roundBoundary(b)
    return rounded > last && rounded <= 100
  })
}

export function formatBoundaryLabel(value: number): string {
  return `${value.toLocaleString('fr-FR', { maximumFractionDigits: 3 })} %`
}

/** Libellé des intervalles construits à partir des bornes de fin saisies. */
export function describeCustomIntervals(breakpoints: number[]): string[] {
  const labels: string[] = []
  let lo = 0
  for (const hi of breakpoints) {
    labels.push(`]${formatBoundaryLabel(lo)}, ${formatBoundaryLabel(hi)}]`)
    lo = hi
  }
  return labels
}
