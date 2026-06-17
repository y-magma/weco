import { formatCompactAxisValue } from '~/visualization/axisFormat'
import {
  SYMLOG_VALUE_AXIS_DESCRIPTION,
  formatSymlogTick,
  symlogFromCoord,
  symlogToCoord,
} from '~/visualization/symlogScale'

export interface ValueRangeZoom {
  min?: number | null
  max?: number | null
}

export interface AxisScaleBounds {
  min?: number
  max?: number
  base: number
}

export interface AxisScale {
  readonly id: string
  toPlotCoord(raw: number): number | null
  toDisplayValue(stored: number): number
  formatTick(stored: number): string
  echartsType: 'value' | 'log'
  echartsScale: boolean
  chartSubtext?: string
  acceptsRaw(raw: number): boolean
  axisBounds(lo: number, hi: number, context?: AxisBoundsContext): AxisScaleBounds
  applyZoom(axis: { min?: number, max?: number }, range: ValueRangeZoom): void
}

export interface RankAxisScale extends AxisScale {
  rankBound(bound: number, side: 'lower' | 'upper'): number | null
  applyRankExtent(
    axis: { min?: number, max?: number },
    extent: { rankLo: number, rankHi: number } | null,
  ): void
}

export interface AxisBoundsContext {
  capRankAt100?: boolean
  rankDensityY?: boolean
}

export interface ProfileAxisScales {
  rank: RankAxisScale
  value: AxisScale
  density: AxisScale
}

function padLinear(lo: number, hi: number, frac = 0.06) {
  const span = hi - lo || Math.abs(hi) * 0.1 || 1
  return { lo: lo - span * frac, hi: hi + span * frac }
}

function formatRankPercent(rank: number): string {
  const rounded = Math.round(rank * 1000) / 1000
  if (Math.abs(rank - rounded) < 1e-6) {
    return rounded.toLocaleString('fr-FR')
  }
  return rank.toLocaleString('fr-FR', { maximumFractionDigits: 3 })
}

/**
 * log₁₀(100 − rank) for a percentile rank in percent.
 * Returns null when rank ≥ 100 (no finite coordinate at the top).
 */
export function rankTopLogCoordinate(rank: number): number | null {
  if (!Number.isFinite(rank) || rank >= 100) return null
  const distance = 100 - rank
  if (distance <= 0) return null
  return Math.log10(distance)
}

/** Inverse of `rankTopLogCoordinate`: log-space tick → rank in percent. */
export function rankFromTopLogCoordinate(logValue: number): number {
  return 100 - 10 ** logValue
}

/** Plot coordinate with log spacing from 100 % and 0 % on the left. */
export function rankDisplayCoordinate(rank: number): number | null {
  const log = rankTopLogCoordinate(rank)
  return log === null ? null : -log
}

/** Inverse of `rankDisplayCoordinate`: axis tick → rank in percent. */
export function rankFromDisplayCoordinate(displayValue: number): number {
  return rankFromTopLogCoordinate(-displayValue)
}

/**
 * Display coordinate for the **upper** bound k of ]i %, k %] on a log rank axis.
 */
export function rankDisplayCoordinateUpper(k: number): number | null {
  if (!Number.isFinite(k)) return null
  if (k < 100) return rankDisplayCoordinate(k)

  const anchor = rankDisplayCoordinate(99.999)
  const prev = rankDisplayCoordinate(99.99)
  if (anchor === null || prev === null) return anchor
  return anchor + (anchor - prev)
}

/** Format a rank-axis tick (display space) as a population-share label. */
export function formatRankAxisLabel(displayValue: number): string {
  const upperCap = rankDisplayCoordinateUpper(100)
  if (upperCap !== null && Math.abs(displayValue - upperCap) < 1e-6) {
    return '100 %'
  }
  const rank = rankFromDisplayCoordinate(displayValue)
  if (!Number.isFinite(rank) || rank < 0 || rank >= 100) return ''
  return `${formatRankPercent(rank)} %`
}

export const linearValueScale: AxisScale = {
  id: 'linear-value',
  toPlotCoord: (raw) => (Number.isFinite(raw) ? raw : null),
  toDisplayValue: (stored) => stored,
  formatTick: (stored) => formatCompactAxisValue(stored),
  echartsType: 'value',
  echartsScale: true,
  acceptsRaw: () => true,
  axisBounds(lo, hi) {
    const floor = lo < 0 ? lo : 0
    const padded = padLinear(floor, hi)
    return { min: padded.lo, max: padded.hi, base: 0 }
  },
  applyZoom(axis, range) {
    if (range.min != null) axis.min = range.min
    if (range.max != null) axis.max = range.max
  },
}

export const strictLogValueScale: AxisScale = {
  id: 'strict-log-value',
  toPlotCoord: (raw) => (raw > 0 && Number.isFinite(raw) ? raw : null),
  toDisplayValue: (stored) => stored,
  formatTick: (stored) => formatCompactAxisValue(stored),
  echartsType: 'log',
  echartsScale: false,
  acceptsRaw: (raw) => raw > 0,
  axisBounds(lo, hi) {
    const min = Math.max(1e-6, lo / 2)
    return { min, max: hi * 2, base: min }
  },
  applyZoom(axis, range) {
    let min = range.min
    let max = range.max
    if (min != null) min = Math.max(1e-6, min)
    if (max != null && min != null) max = Math.max(max, min * 1.001)
    if (min != null) axis.min = min
    if (max != null) axis.max = max
  },
}

export const symlogValueScale: AxisScale = {
  id: 'symlog-value',
  toPlotCoord: (raw) => symlogToCoord(raw),
  toDisplayValue: (stored) => symlogFromCoord(stored),
  formatTick: (stored) => formatSymlogTick(stored),
  echartsType: 'value',
  echartsScale: true,
  chartSubtext: SYMLOG_VALUE_AXIS_DESCRIPTION,
  acceptsRaw: () => true,
  axisBounds(lo, hi) {
    const padded = padLinear(lo, hi)
    return { min: padded.lo, max: padded.hi, base: 0 }
  },
  applyZoom(axis, range) {
    if (range.min != null) axis.min = symlogToCoord(range.min) ?? undefined
    if (range.max != null) axis.max = symlogToCoord(range.max) ?? undefined
  },
}

export const linearRankScale: RankAxisScale = {
  id: 'linear-rank',
  toPlotCoord: (raw) => (Number.isFinite(raw) ? raw : null),
  toDisplayValue: (stored) => stored,
  formatTick: (stored) => `${formatRankPercent(stored)} %`,
  echartsType: 'value',
  echartsScale: true,
  acceptsRaw: () => true,
  axisBounds(lo, hi, context) {
    if (context?.rankDensityY) {
      const padded = padLinear(lo, hi)
      return { min: padded.lo, max: padded.hi, base: lo }
    }
    const padded = padLinear(lo, hi)
    return {
      min: Math.max(0, padded.lo),
      max: context?.capRankAt100 && hi >= 100 ? 100 : Math.min(100, padded.hi),
      base: 0,
    }
  },
  applyZoom() {},
  rankBound: (bound) => (Number.isFinite(bound) ? bound : null),
  applyRankExtent(axis, extent) {
    if (!extent) return
    const padded = padLinear(extent.rankLo, extent.rankHi, 0.08)
    axis.min = Math.max(0, padded.lo)
    axis.max = extent.rankHi >= 100 ? 100 : Math.min(100, padded.hi)
  },
}

export const rankTopLogScale: RankAxisScale = {
  id: 'rank-top-log',
  toPlotCoord: (raw) => rankDisplayCoordinate(raw),
  toDisplayValue: (stored) => rankFromDisplayCoordinate(stored),
  formatTick: (stored) => formatRankAxisLabel(stored),
  echartsType: 'value',
  echartsScale: true,
  acceptsRaw: () => true,
  axisBounds(lo, hi, context) {
    if (context?.rankDensityY) {
      return { min: lo, max: hi, base: lo }
    }
    return { min: lo, max: hi, base: 0 }
  },
  applyZoom() {},
  rankBound(bound, side) {
    if (!Number.isFinite(bound)) return null
    return side === 'upper' ? rankDisplayCoordinateUpper(bound) : rankDisplayCoordinate(bound)
  },
  applyRankExtent(axis, extent) {
    if (!extent) return
    const lo = rankTopLogScale.rankBound(extent.rankLo, 'lower')
    const hi = rankTopLogScale.rankBound(extent.rankHi, 'upper')
    if (lo != null) axis.min = lo
    if (hi != null) axis.max = hi
  },
}

export const linearDensityScale: AxisScale = {
  id: 'linear-density',
  toPlotCoord: (raw) => (Number.isFinite(raw) ? raw : null),
  toDisplayValue: (stored) => stored,
  formatTick(stored) {
    if (!Number.isFinite(stored)) return ''
    if (stored === 0) return '0'
    if (Math.abs(stored) >= 0.01) return stored.toLocaleString('fr-FR', { maximumFractionDigits: 4 })
    return stored.toExponential(1)
  },
  echartsType: 'value',
  echartsScale: true,
  acceptsRaw: () => true,
  axisBounds(_lo, hi) {
    const padded = padLinear(0, hi)
    return { min: 0, max: padded.hi, base: 0 }
  },
  applyZoom() {},
}

export const strictLogDensityScale: AxisScale = {
  id: 'strict-log-density',
  toPlotCoord: (raw) => (raw > 0 && Number.isFinite(raw) ? raw : null),
  toDisplayValue: (stored) => stored,
  formatTick(stored) {
    if (!Number.isFinite(stored)) return ''
    if (stored === 0) return '0'
    if (Math.abs(stored) >= 0.01) return stored.toLocaleString('fr-FR', { maximumFractionDigits: 4 })
    return stored.toExponential(1)
  },
  echartsType: 'log',
  echartsScale: false,
  acceptsRaw: (raw) => raw > 0,
  axisBounds(lo, hi) {
    const min = Math.max(1e-12, lo / 2)
    return { min, max: hi * 2, base: min }
  },
  applyZoom() {},
}

/** Map UI log toggles to axis scales (behaviour unchanged). */
export function resolveProfileAxisScales(options: {
  logScaleX: boolean
  logScaleY: boolean
  populationDensity: boolean
  showPdf: boolean
}): ProfileAxisScales {
  const { logScaleX, logScaleY, populationDensity, showPdf } = options

  const rankLog = populationDensity ? (showPdf ? false : logScaleY) : logScaleX
  const valueLog = populationDensity ? logScaleX : logScaleY
  const densityLog = showPdf ? logScaleY : false

  const valueUsesSymlog = valueLog && !populationDensity && !showPdf

  return {
    rank: rankLog ? rankTopLogScale : linearRankScale,
    value: valueUsesSymlog
      ? symlogValueScale
      : valueLog
        ? strictLogValueScale
        : linearValueScale,
    density: densityLog ? strictLogDensityScale : linearDensityScale,
  }
}

export function buildEchartsAxis(
  name: string,
  scale: AxisScale,
  options: { nameGap?: number, nameLocation?: 'middle' } = {},
) {
  return {
    type: scale.echartsType,
    name,
    nameLocation: options.nameLocation ?? 'middle',
    nameGap: options.nameGap,
    scale: scale.echartsScale,
    axisLabel: {
      formatter: (value: number) => scale.formatTick(value),
    },
  }
}

export function formatStoredAxisValue(scale: AxisScale, stored: number | null | undefined): string {
  if (stored === null || stored === undefined || !Number.isFinite(stored)) return '—'
  return scale.toDisplayValue(stored).toLocaleString('fr-FR')
}

export function applyDualAxisZoom(
  xAxis: { min?: number, max?: number },
  yAxis: { min?: number, max?: number },
  options: {
    valueRange?: ValueRangeZoom
    rankPoints: { rank: number, percentile: string }[]
    rankScale: RankAxisScale
    valueScale: AxisScale
    populationDensity: boolean
    rankIntervalExtent: { rankLo: number, rankHi: number } | null
  },
): void {
  if (!isValueRangeZoomActive(options.valueRange)) return
  const rankAxis = options.populationDensity ? yAxis : xAxis
  const valueAxis = options.populationDensity ? xAxis : yAxis
  options.valueScale.applyZoom(valueAxis, options.valueRange!)
  options.rankScale.applyRankExtent(rankAxis, options.rankIntervalExtent)
}

export function isValueRangeZoomActive(range?: ValueRangeZoom): boolean {
  if (!range) return false
  const { min, max } = range
  if (min == null && max == null) return false
  if (min != null && max != null && min >= max) return false
  return true
}

/** PDF value axis uses tighter padding than profile bands. */
export function pdfValueAxisBounds(scale: AxisScale, lo: number, hi: number): AxisScaleBounds {
  if (scale.id === 'strict-log-value') {
    return { min: Math.max(1e-6, lo / 1.5), max: hi * 1.5, base: Math.max(1e-6, lo / 1.5) }
  }
  if (scale.id === 'linear-value') {
    const floor = lo < 0 ? lo : 0
    const padded = padLinear(floor, hi)
    return { min: padded.lo, max: padded.hi, base: 0 }
  }
  return scale.axisBounds(lo, hi)
}

export function applyPdfDensityAxisExtent(
  axis: { min?: number, max?: number },
  scale: AxisScale,
  densities: number[],
) {
  if (densities.length === 0) return
  const lo = Math.min(...densities)
  const hi = Math.max(...densities)
  const bounds = scale.axisBounds(lo, hi)
  axis.min = bounds.min
  axis.max = bounds.max
}
