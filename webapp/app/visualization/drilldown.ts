/**
 * Drill-down hiérarchique sur les g-percentiles WID.
 *
 * Le profil complet (127 g-percentiles) est trop fin pour une vue d'ensemble.
 * On affiche d'abord 100 tranches `]i %, i+1 %]` (i ∈ [0, 99]), où la dernière
 * `]99 %, 100 %]` est un **agrégat** du sommet de la distribution. En cliquant
 * sur cette tranche, on « entre » dans le sommet : ]99 %, 100 %] est re-découpé
 * en dixièmes, etc., jusqu'au grain le plus fin des données WID.
 *
 *   niveau 0 : ]0 %, 1 %] … ]98 %, 99 %], ]99 %, 100 %]      (pas = 1 %)
 *   niveau 1 : ]99 %, 99,1 %] … ]99,9 %, 100 %]              (pas = 0,1 %)
 *   niveau 2 : ]99,9 %, 99,91 %] … ]99,99 %, 100 %]          (pas = 0,01 %)
 *   niveau 3 : ]99,99 %, 99,991 %] … ]99,999 %, 100 %]       (pas = 0,001 %)
 *
 * La convention de libellé reste celle des codes WID (`pIpK`), ce qui permet de
 * réutiliser les nombres des bornes sur les axes.
 */
import type { PercentilePoint } from '@domain/entities'
import { parsePercentileInterval } from '@domain/services/percentiles'

export interface DrillLevel {
  /** Borne basse de la zone affichée (en %). */
  lo: number
  /** Largeur d'une tranche à ce niveau (en %). */
  step: number
}

/** Paramètres de chaque niveau de zoom (du plus large au plus fin). */
export const DRILL_LEVELS: DrillLevel[] = [
  { lo: 0, step: 1 },
  { lo: 99, step: 0.1 },
  { lo: 99.9, step: 0.01 },
  { lo: 99.99, step: 0.001 },
]

export const MAX_DRILL_LEVEL = DRILL_LEVELS.length - 1

const EPS = 1e-9

/** Formate un nombre comme les codes WID (au plus 3 décimales, point décimal). */
function fmt(n: number): string {
  return Number(n.toFixed(3)).toString()
}

/** Construit un code de tranche `pLOpHI` (convention WID). */
export function formatBracketCode(lo: number, hi: number): string {
  return `p${fmt(lo)}p${fmt(hi)}`
}

/** Borne un index de niveau dans [0, MAX_DRILL_LEVEL]. */
export function clampDrillLevel(level: number): number {
  if (!Number.isFinite(level)) return 0
  return Math.min(Math.max(Math.trunc(level), 0), MAX_DRILL_LEVEL)
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

/**
 * Points à afficher au niveau de zoom donné. Chaque tranche reprend la valeur
 * de l'unique g-percentile correspondant, ou l'agrégat des g-percentiles
 * couverts (cas de la tranche sommet `]…, 100 %]`).
 */
export function buildDrilldownPoints(
  allPoints: PercentilePoint[],
  level: number,
): PercentilePoint[] {
  const { lo, step } = DRILL_LEVELS[clampDrillLevel(level)]!
  const count = Math.round((100 - lo) / step)
  const result: PercentilePoint[] = []

  for (let b = 0; b < count; b++) {
    const a = Number((lo + b * step).toFixed(6))
    const k = b === count - 1 ? 100 : Number((lo + (b + 1) * step).toFixed(6))

    const underlying = allPoints.filter((point) => {
      const interval = parsePercentileInterval(point.percentile)
      if (!interval) return false
      return interval.i >= a - EPS && interval.k <= k + EPS
    })

    result.push({
      percentile: formatBracketCode(a, k),
      rank: a,
      value: aggregatePointValue(underlying),
    })
  }

  return result
}

/**
 * Code de la tranche « drillable » (le sommet `]100 − pas %, 100 %]`) à ce
 * niveau, ou null au niveau le plus fin.
 */
export function drillableCode(level: number): string | null {
  const lvl = clampDrillLevel(level)
  if (lvl >= MAX_DRILL_LEVEL) return null
  const { step } = DRILL_LEVELS[lvl]!
  return formatBracketCode(100 - step, 100)
}

/** Niveau de zoom atteint en cliquant `code`, ou null si non drillable. */
export function nextDrillLevel(level: number, code: string | null | undefined): number | null {
  if (!code) return null
  const lvl = clampDrillLevel(level)
  return code === drillableCode(lvl) ? lvl + 1 : null
}

/** Libellé d'un niveau pour le fil d'Ariane (bornes en notation WID/française). */
export function drillLevelLabel(level: number): string {
  const { lo } = DRILL_LEVELS[clampDrillLevel(level)]!
  if (lo <= 0) return 'Ensemble ]0 %, 100 %]'
  const loLabel = lo.toLocaleString('fr-FR', { maximumFractionDigits: 3 })
  return `]${loLabel} %, 100 %]`
}
