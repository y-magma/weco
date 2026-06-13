import type {
  CustomSeriesRenderItemAPI,
  CustomSeriesRenderItemParams,
  EChartsOption,
} from 'echarts'
import type { PercentilePoint, PercentileProfile } from '@domain/entities'
import { parsePercentileInterval } from '@domain/services/percentiles'
import { formatCompactAxisValue } from '~/visualization/axisFormat'

export interface ProfileChartOptions {
  /** Visual encoding of the profile. */
  chartType?: 'bar' | 'scatter' | 'line'
  /** Log scale on the displayed X axis (rank spacing or value, depending on view). */
  logScaleX?: boolean
  /** Log scale on the displayed Y axis (value, rank spacing, or density). */
  logScaleY?: boolean
  /**
   * Population-density view: swap axes — X = valeur (richesse), Y = part de
   * population (rang %). See spec/version1.md (graphe #3, axes inversés).
   */
  populationDensity?: boolean
  /**
   * Probability-density view (requires `populationDensity`): Y = dF/dx where
   * F is the empirical CDF from consecutive percentile brackets.
   */
  probabilityDensity?: boolean
  /** Lorenz curve: cumulative population % vs cumulative wealth %. */
  lorenzCurve?: boolean
  /** Optional zoom on the value axis; rank axis is auto-fitted to visible brackets. */
  valueRange?: ValueRangeZoom
  title?: string
}

export interface ValueRangeZoom {
  min?: number | null
  max?: number | null
}

export function isValueRangeZoomActive(range?: ValueRangeZoom): boolean {
  if (!range) return false
  const { min, max } = range
  if (min == null && max == null) return false
  if (min != null && max != null && min >= max) return false
  return true
}

/** Min / max over finite point values (ignores null). */
export function computeProfileValueExtent(
  points: PercentilePoint[],
): { min: number, max: number } | null {
  let min = Infinity
  let max = -Infinity
  let found = false
  for (const point of points) {
    if (point.value === null || !Number.isFinite(point.value)) continue
    min = Math.min(min, point.value)
    max = Math.max(max, point.value)
    found = true
  }
  return found ? { min, max } : null
}

/** Points whose value lies in [min, max] (bounds optional). */
export function filterPointsByValueRange(
  points: PercentilePoint[],
  range: ValueRangeZoom,
): PercentilePoint[] {
  return points.filter((point) => {
    if (point.value === null || !Number.isFinite(point.value)) return false
    if (range.min != null && point.value < range.min) return false
    if (range.max != null && point.value > range.max) return false
    return true
  })
}

/** Span ]rankLo %, rankHi %] covered by the displayed brackets. */
export function computeRankIntervalExtent(
  points: PercentilePoint[],
): { rankLo: number, rankHi: number } | null {
  let rankLo = Infinity
  let rankHi = -Infinity
  let found = false

  for (const point of points) {
    const bounds = parsePercentileInterval(point.percentile)
    if (bounds) {
      rankLo = Math.min(rankLo, bounds.i)
      rankHi = Math.max(rankHi, bounds.k)
      found = true
    } else if (Number.isFinite(point.rank)) {
      rankLo = Math.min(rankLo, point.rank)
      rankHi = Math.max(rankHi, point.rank)
      found = true
    }
  }
  if (!found) return null
  return { rankLo, rankHi }
}

/** Fit the population (rank) axis to visible brackets. */
export function applyRankExtentZoom(
  axis: { min?: number, max?: number },
  extent: { rankLo: number, rankHi: number } | null,
  logOnRank: boolean,
): void {
  if (!extent) return
  const pad = (lo: number, hi: number) => {
    const span = hi - lo || 0.1
    return { lo: lo - span * 0.08, hi: hi + span * 0.08 }
  }

  if (logOnRank) {
    const lo = rankBandBound(extent.rankLo, true, 'lower')
    const hi = rankBandBound(extent.rankHi, true, 'upper')
    if (lo != null) axis.min = lo
    if (hi != null) axis.max = hi
    return
  }

  const p = pad(extent.rankLo, extent.rankHi)
  axis.min = Math.max(0, p.lo)
  axis.max = extent.rankHi >= 100 ? 100 : Math.min(100, p.hi)
}

/** Apply [min, max] on the value axis (log-safe). */
export function applyValueRangeZoom(
  axis: { min?: number, max?: number },
  range: ValueRangeZoom | undefined,
  logOnValue: boolean,
): void {
  if (!isValueRangeZoomActive(range)) return
  const rawMin = range!.min
  const rawMax = range!.max

  let min = rawMin
  let max = rawMax
  if (logOnValue) {
    if (min != null) min = Math.max(1e-6, min)
    if (max != null && min != null) max = Math.max(max, min * 1.001)
  }
  if (min != null) axis.min = min
  if (max != null) axis.max = max
}

/** Value zoom + auto-fit of the population axis (swapped in density view). */
export function applyDualAxisZoom(
  xAxis: { min?: number, max?: number },
  yAxis: { min?: number, max?: number },
  options: {
    valueRange?: ValueRangeZoom
    rankPoints: PercentilePoint[]
    logOnRank: boolean
    logOnValue: boolean
    populationDensity: boolean
  },
): void {
  if (!isValueRangeZoomActive(options.valueRange)) return
  const rankAxis = options.populationDensity ? yAxis : xAxis
  const valueAxis = options.populationDensity ? xAxis : yAxis
  applyValueRangeZoom(valueAxis, options.valueRange, options.logOnValue)
  applyRankExtentZoom(
    rankAxis,
    computeRankIntervalExtent(options.rankPoints),
    options.logOnRank,
  )
}

function filterPdfBinsByValueRange(bins: PdfBin[], range: ValueRangeZoom): PdfBin[] {
  return bins.filter((bin) => {
    if (range.min != null && bin.valueHi < range.min) return false
    if (range.max != null && bin.valueLo > range.max) return false
    return true
  })
}

/** One band on ]i %, k %] for custom bar rendering. */
export interface RankBandItem {
  name: string
  i: number
  k: number
  /** [xLo, xHi, y] in default view; [xValue, yLo, yHi] in population-density view. */
  value: [number, number, number]
}

export interface BandAxisBounds {
  xMin?: number
  xMax?: number
  yMin?: number
  yMax?: number
  xBase: number
  yBase: number
}

/** One histogram bin derived from two consecutive percentile observations. */
export interface PdfBin {
  valueLo: number
  valueHi: number
  rankLo: number
  rankHi: number
  density: number
  midpoint: number
  percentileLo: string
  percentileHi: string
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
 * k = 100 % has no finite log₁₀(100 − k); extrapolate one bracket-width beyond
 * 99.999 % so the top band ]99.999 %, 100 %] remains visible.
 */
export function rankDisplayCoordinateUpper(k: number): number | null {
  if (!Number.isFinite(k)) return null
  if (k < 100) return rankDisplayCoordinate(k)

  const anchor = rankDisplayCoordinate(99.999)
  const prev = rankDisplayCoordinate(99.99)
  if (anchor === null || prev === null) return anchor
  return anchor + (anchor - prev)
}

/**
 * Empirical PDF bins: ΔF/Δx between consecutive valid percentile points.
 * F = rank / 100, so density = (rankHi − rankLo) / (100 × (valueHi − valueLo)).
 */
export function computePdfBins(
  points: PercentilePoint[],
  options: { logOnValue?: boolean } = {},
): PdfBin[] {
  const { logOnValue = false } = options
  const ordered = [...points]
    .sort((a, b) => a.rank - b.rank)
    .filter((point) => {
      if (point.value === null || Number.isNaN(point.value)) return false
      if (!Number.isFinite(point.rank) || point.rank >= 100) return false
      if (logOnValue && point.value <= 0) return false
      return true
    })

  const bins: PdfBin[] = []
  for (let i = 0; i < ordered.length - 1; i++) {
    const lo = ordered[i]!
    const hi = ordered[i + 1]!
    const deltaValue = hi.value! - lo.value!
    if (deltaValue <= 0) continue

    const deltaRank = hi.rank - lo.rank
    bins.push({
      valueLo: lo.value!,
      valueHi: hi.value!,
      rankLo: lo.rank,
      rankHi: hi.rank,
      density: (deltaRank / 100) / deltaValue,
      midpoint: (lo.value! + hi.value!) / 2,
      percentileLo: lo.percentile,
      percentileHi: hi.percentile,
    })
  }
  return bins
}

export interface LorenzPoint {
  populationShare: number
  wealthShare: number
}

/**
 * Empirical Lorenz curve from consecutive g-percentile brackets.
 * Wealth in ]rankᵢ, rankᵢ₊₁] ≈ (Δrang/100) × moyenne(valeurᵢ, valeurᵢ₊₁).
 */
export function computeLorenzPoints(points: PercentilePoint[]): LorenzPoint[] {
  const ordered = [...points]
    .sort((a, b) => a.rank - b.rank)
    .filter((point) => {
      if (point.value === null || Number.isNaN(point.value)) return false
      if (!Number.isFinite(point.rank) || point.rank < 0) return false
      return point.value >= 0
    })

  if (ordered.length < 2) {
    return [{ populationShare: 0, wealthShare: 0 }]
  }

  const brackets: { rankHi: number, amount: number }[] = []
  let totalWealth = 0

  for (let i = 0; i < ordered.length - 1; i++) {
    const lo = ordered[i]!
    const hi = ordered[i + 1]!
    const deltaRank = hi.rank - lo.rank
    if (deltaRank <= 0) continue
    const midValue = (lo.value! + hi.value!) / 2
    const amount = (deltaRank / 100) * midValue
    brackets.push({ rankHi: hi.rank, amount })
    totalWealth += amount
  }

  if (totalWealth <= 0 || brackets.length === 0) {
    return [{ populationShare: 0, wealthShare: 0 }]
  }

  const result: LorenzPoint[] = [{ populationShare: 0, wealthShare: 0 }]
  let cumWealth = 0
  for (const bracket of brackets) {
    cumWealth += bracket.amount
    result.push({
      populationShare: bracket.rankHi,
      wealthShare: (cumWealth / totalWealth) * 100,
    })
  }

  return result
}

function formatRankPercent(rank: number): string {
  if (!Number.isFinite(rank)) return ''
  const rounded = Math.round(rank)
  if (Math.abs(rank - rounded) < 1e-6) {
    return rounded.toLocaleString('fr-FR')
  }
  return rank.toLocaleString('fr-FR', { maximumFractionDigits: 3 })
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

function rankCoordinate(rank: number, logRank: boolean): number | null {
  if (!Number.isFinite(rank)) return null
  if (logRank) return rankDisplayCoordinate(rank)
  return rank
}

/** Lower/upper bound coordinates for ]i %, k %] bands (handles k = 100 % in log X). */
function rankBandBound(
  bound: number,
  logRank: boolean,
  side: 'lower' | 'upper',
): number | null {
  if (!Number.isFinite(bound)) return null
  if (!logRank) return bound
  return side === 'upper' ? rankDisplayCoordinateUpper(bound) : rankDisplayCoordinate(bound)
}

function buildRankAxis(logRank: boolean) {
  return {
    type: 'value' as const,
    name: 'Part de population (%)',
    nameLocation: 'middle' as const,
    nameGap: 32,
    scale: logRank,
    min: logRank ? rankDisplayCoordinate(0)! : 0,
    max: logRank ? rankDisplayCoordinateUpper(100)! : 100,
    axisLabel: logRank
      ? { formatter: (value: number) => formatRankAxisLabel(value) }
      : { formatter: (value: number) => `${formatRankPercent(value)} %` },
  }
}

function buildValueAxis(valueAxisName: string, logValue: boolean) {
  return {
    type: logValue ? ('log' as const) : ('value' as const),
    name: valueAxisName,
    // `scale: true` on log axes mis-anchors bars/bands (baseline at the wrong end).
    scale: !logValue,
    axisLabel: {
      formatter: (value: number) => formatCompactAxisValue(value),
    },
  }
}

function buildDensityAxis(unit: string | undefined, logDensity: boolean) {
  const unitSuffix = unit ? ` · 1/${unit}` : ''
  return {
    type: logDensity ? ('log' as const) : ('value' as const),
    name: `Densité de probabilité${unitSuffix}`,
    scale: !logDensity,
    axisLabel: {
      formatter: (value: number) => {
        if (!Number.isFinite(value)) return ''
        if (value === 0) return '0'
        if (Math.abs(value) >= 0.01) return value.toLocaleString('fr-FR', { maximumFractionDigits: 4 })
        return value.toExponential(1)
      },
    },
  }
}

function cleanValue(value: number | null, logOnValue: boolean): number | null {
  if (value === null || Number.isNaN(value)) return null
  if (logOnValue && value <= 0) return null
  return value
}

function cleanDensity(density: number, logOnDensity: boolean): number | null {
  if (!Number.isFinite(density) || density <= 0) {
    return logOnDensity ? null : density
  }
  return density
}

/** Fit the density axis to the displayed PDF values (required on log Y). */
function applyPdfDensityAxisExtent(
  yAxis: ReturnType<typeof buildDensityAxis>,
  densities: number[],
  logOnDensity: boolean,
) {
  if (densities.length === 0) return
  const dMin = Math.min(...densities)
  const dMax = Math.max(...densities)
  const span = dMax - dMin || dMax * 0.1 || 1
  if (logOnDensity) {
    yAxis.min = Math.max(1e-12, dMin / 2)
    yAxis.max = dMax * 2
  } else {
    yAxis.min = Math.max(0, dMin - span * 0.1)
    yAxis.max = dMax + span * 0.1
  }
}

/**
 * Build band items for each `pᵢpₖ` bracket on ]i %, k %].
 * Default view: X = rank span, Y = value. Population-density view: X = value, Y = rank span.
 */
export function buildRankBandItems(
  points: PercentilePoint[],
  options: {
    logOnRank?: boolean
    logOnValue?: boolean
    populationDensity?: boolean
  } = {},
): RankBandItem[] {
  const { logOnRank = false, logOnValue = false, populationDensity = false } = options
  const ordered = [...points].sort((a, b) => a.rank - b.rank)
  const items: RankBandItem[] = []

  for (const point of ordered) {
    const bounds = parsePercentileInterval(point.percentile)
    if (!bounds) continue
    const { i, k } = bounds
    const yValue = cleanValue(point.value, logOnValue)
    if (yValue === null) continue

    const rankLo = rankBandBound(i, logOnRank, 'lower')
    const rankHi = rankBandBound(k, logOnRank, 'upper')
    if (rankLo === null || rankHi === null) continue

    if (populationDensity) {
      items.push({
        name: point.percentile,
        i,
        k,
        value: [yValue, rankLo, rankHi],
      })
    } else {
      items.push({
        name: point.percentile,
        i,
        k,
        value: [rankLo, rankHi, yValue],
      })
    }
  }
  return items
}

/** Auto-scale axes for custom band charts (lin-log / log-log safe). */
export function computeBandAxisBounds(
  items: RankBandItem[],
  options: {
    logOnRank?: boolean
    logOnValue?: boolean
    populationDensity?: boolean
  } = {},
): BandAxisBounds {
  const { logOnRank = false, logOnValue = false, populationDensity = false } = options
  if (items.length === 0) return { xBase: 0, yBase: 0 }

  const padLinear = (lo: number, hi: number, frac = 0.06) => {
    const span = hi - lo || Math.abs(hi) * 0.1 || 1
    return { lo: lo - span * frac, hi: hi + span * frac }
  }

  if (populationDensity) {
    const xLo = Math.min(...items.map((item) => item.value[0]))
    const xHi = Math.max(...items.map((item) => item.value[0]))
    const yLo = Math.min(...items.map((item) => item.value[1]))
    const yHi = Math.max(...items.map((item) => item.value[2]))

    let xMin: number | undefined
    let xMax: number | undefined
    let yMin: number | undefined
    let yMax: number | undefined
    let xBase = 0
    let yBase = 0

    if (logOnValue) {
      xMin = Math.max(1e-6, xLo / 2)
      xMax = xHi * 2
      xBase = xMin
    } else {
      const floor = xLo < 0 ? xLo : 0
      const x = padLinear(floor, xHi)
      xMin = x.lo
      xMax = x.hi
      xBase = 0
    }

    if (logOnRank) {
      yMin = yLo
      yMax = yHi
      yBase = yMin
    } else {
      const y = padLinear(yLo, yHi)
      yMin = y.lo
      yMax = y.hi
      yBase = yLo
    }

    return { xMin, xMax, yMin, yMax, xBase, yBase }
  }

  const xLo = Math.min(...items.map((item) => item.value[0]))
  const xHi = Math.max(...items.map((item) => item.value[1]))
  const yLo = Math.min(...items.map((item) => item.value[2]))
  const yHi = Math.max(...items.map((item) => item.value[2]))

  let xMin: number | undefined
  let xMax: number | undefined
  let yMin: number | undefined
  let yMax: number | undefined
  const xBase = 0
  let yBase = 0

  if (logOnRank) {
    xMin = xLo
    xMax = xHi
  } else {
    const x = padLinear(xLo, xHi)
    xMin = x.lo
    xMax = Math.min(100, x.hi)
  }

  if (logOnValue) {
    const floor = yLo / 2
    const ceil = yHi * 2
    yMin = Math.max(1e-6, floor)
    yMax = ceil
    yBase = yMin
  } else {
    // Bars always grow from 0 on a linear value axis — never from yMin.
    const floor = yLo < 0 ? yLo : 0
    const y = padLinear(floor, yHi)
    yMin = y.lo
    yMax = y.hi
    yBase = 0
  }

  return { xMin, xMax, yMin, yMax, xBase, yBase }
}

type GridPixelRect = { left: number, top: number, right: number, bottom: number }

function gridPixelRect(params: CustomSeriesRenderItemParams): GridPixelRect | null {
  const cs = params.coordSys as { x?: number, y?: number, width?: number, height?: number } | null
  if (!cs || cs.x === undefined || cs.y === undefined || cs.width === undefined || cs.height === undefined) {
    return null
  }
  return {
    left: cs.x,
    top: cs.y,
    right: cs.x + cs.width,
    bottom: cs.y + cs.height,
  }
}

/** Clip a pixel rect to the plot grid (dataZoom can move axis limits without rebuilding yBase). */
function clampRectToGrid(
  x: number,
  y: number,
  width: number,
  height: number,
  grid: GridPixelRect | null,
) {
  if (!grid) return { x, y, width, height }

  let rectX = x
  let rectY = y
  let rectW = width
  let rectH = height

  if (rectX < grid.left) {
    rectW -= grid.left - rectX
    rectX = grid.left
  }
  if (rectX + rectW > grid.right) {
    rectW = grid.right - rectX
  }
  if (rectY < grid.top) {
    rectH -= grid.top - rectY
    rectY = grid.top
  }
  if (rectY + rectH > grid.bottom) {
    rectH = grid.bottom - rectY
  }

  return { x: rectX, y: rectY, width: rectW, height: rectH }
}

/** Horizontal bands: rank span on X, value on Y (default profile view). */
export function createRenderRankBand(yBase: number) {
  return function renderRankBand(
    params: CustomSeriesRenderItemParams,
    api: CustomSeriesRenderItemAPI,
  ) {
    const xLo = api.value(0) as number
    const xHi = api.value(1) as number
    const y = api.value(2) as number
    if (!Number.isFinite(y)) return null

    const top = api.coord([xLo, y])
    const right = api.coord([xHi, y])
    const base = api.coord([xLo, yBase])
    const grid = gridPixelRect(params)

    // When Y is zoomed, yBase may lie below the visible axis min → clamp baseline to grid bottom.
    const baseY = grid ? Math.min(base[1], grid.bottom) : base[1]
    const rectY = Math.min(top[1], baseY)
    const rectH = Math.max(baseY - rectY, 1)
    const rectW = Math.max(right[0] - top[0], 1)
    const clipped = clampRectToGrid(top[0], rectY, rectW, rectH, grid)
    if (clipped.width < 0.5 || clipped.height < 0.5) return null

    return {
      type: 'rect' as const,
      shape: clipped,
      style: api.style(),
    }
  }
}

/** Vertical bands: value on X, rank span on Y (population-density view). */
export function createRenderPopulationBand(xBase: number) {
  return function renderPopulationBand(
    params: CustomSeriesRenderItemParams,
    api: CustomSeriesRenderItemAPI,
  ) {
    const xVal = api.value(0) as number
    const yLo = api.value(1) as number
    const yHi = api.value(2) as number
    if (!Number.isFinite(xVal)) return null

    const base = api.coord([xBase, yLo])
    const topRight = api.coord([xVal, yHi])
    const grid = gridPixelRect(params)

    // When X is zoomed, xBase may lie left of the visible axis min → clamp origin to grid left.
    const baseX = grid ? Math.max(base[0], grid.left) : base[0]
    const rectY = Math.min(base[1], topRight[1])
    const rectH = Math.max(Math.abs(topRight[1] - base[1]), 1)
    const rectW = Math.max(topRight[0] - baseX, 1)
    const clipped = clampRectToGrid(baseX, rectY, rectW, rectH, grid)
    if (clipped.width < 0.5 || clipped.height < 0.5) return null

    return {
      type: 'rect' as const,
      shape: clipped,
      style: api.style(),
    }
  }
}

/** One PDF histogram band on ]valueLo, valueHi] with height = density. */
export interface PdfBandItem {
  value: [number, number, number]
  bin: PdfBin
}

export function buildPdfBandItems(
  bins: PdfBin[],
  options: { logOnValue?: boolean, logOnDensity?: boolean } = {},
): PdfBandItem[] {
  const { logOnValue = false, logOnDensity = false } = options
  return bins.flatMap((bin) => {
    const density = cleanDensity(bin.density, logOnDensity)
    if (density === null) return []
    if (logOnValue && (bin.valueLo <= 0 || bin.valueHi <= 0)) return []
    return [{ value: [bin.valueLo, bin.valueHi, density] as [number, number, number], bin }]
  })
}

/** Auto-scale axes for PDF band charts; yBase anchors bands at the density floor. */
export function computePdfBandAxisBounds(
  items: PdfBandItem[],
  options: { logOnValue?: boolean, logOnDensity?: boolean } = {},
): BandAxisBounds {
  const { logOnValue = false, logOnDensity = false } = options
  if (items.length === 0) return { xBase: 0, yBase: 0 }

  const padLinear = (lo: number, hi: number, frac = 0.06) => {
    const span = hi - lo || Math.abs(hi) * 0.1 || 1
    return { lo: lo - span * frac, hi: hi + span * frac }
  }

  const xLo = Math.min(...items.map((item) => item.value[0]))
  const xHi = Math.max(...items.map((item) => item.value[1]))
  const dMin = Math.min(...items.map((item) => item.value[2]))
  const dMax = Math.max(...items.map((item) => item.value[2]))

  let xMin: number | undefined
  let xMax: number | undefined
  let yMin: number | undefined
  let yMax: number | undefined
  let xBase = 0
  let yBase = 0

  if (logOnValue) {
    xMin = Math.max(1e-6, xLo / 1.5)
    xMax = xHi * 1.5
    xBase = xMin
  } else {
    const floor = xLo < 0 ? xLo : 0
    const x = padLinear(floor, xHi)
    xMin = x.lo
    xMax = x.hi
    xBase = 0
  }

  if (logOnDensity) {
    yMin = Math.max(1e-12, dMin / 2)
    yMax = dMax * 2
    yBase = yMin
  } else {
    const y = padLinear(0, dMax)
    yMin = 0
    yMax = y.hi
    yBase = 0
  }

  return { xMin, xMax, yMin, yMax, xBase, yBase }
}

/** Layout shared by grid margins and dataZoom sliders (keeps axis titles clear of the jauge). */
export const PROFILE_CHART_LAYOUT = {
  bottomSlider: 4,
  bottomSliderHeight: 18,
  /** Space below the plot for tick labels + axis name, above the horizontal slider. */
  gridBottom: 90,
} as const

/** Native ECharts sliders: rank/population axis + value axis (horizontal or vertical). */
export function buildProfileDataZoom(valueOnX: boolean) {
  const rankOnX = !valueOnX
  const { bottomSlider, bottomSliderHeight, gridBottom } = PROFILE_CHART_LAYOUT

  const rankInside = rankOnX
    ? { type: 'inside' as const, xAxisIndex: 0, filterMode: 'none' as const }
    : { type: 'inside' as const, yAxisIndex: 0, filterMode: 'none' as const }

  const valueInside = valueOnX
    ? { type: 'inside' as const, xAxisIndex: 0, filterMode: 'none' as const }
    : { type: 'inside' as const, yAxisIndex: 0, filterMode: 'none' as const }

  const rankSlider = rankOnX
    ? {
        type: 'slider' as const,
        xAxisIndex: 0,
        height: bottomSliderHeight,
        bottom: bottomSlider,
        filterMode: 'none' as const,
      }
    : {
        type: 'slider' as const,
        orient: 'vertical' as const,
        yAxisIndex: 0,
        width: bottomSliderHeight,
        left: 10,
        top: 56,
        bottom: gridBottom,
        filterMode: 'none' as const,
      }

  const valueSlider = valueOnX
    ? {
        type: 'slider' as const,
        xAxisIndex: 0,
        height: bottomSliderHeight,
        bottom: bottomSlider,
        filterMode: 'none' as const,
      }
    : {
        type: 'slider' as const,
        orient: 'vertical' as const,
        yAxisIndex: 0,
        width: bottomSliderHeight,
        left: 10,
        top: 56,
        bottom: gridBottom + bottomSliderHeight + bottomSlider,
        filterMode: 'none' as const,
      }

  return [rankInside, valueInside, rankSlider, valueSlider]
}

/**
 * Profil moyen / seuil, vue CDF (axes inversés) ou PDF (dérivée de la CDF).
 * See spec/version1.md (graphes #2, #3 et #4) and C1/C3.
 */
export function buildProfileOption(
  profile: PercentileProfile,
  options: ProfileChartOptions = {},
): EChartsOption {
  const {
    chartType = 'line',
    logScaleY = false,
    logScaleX = false,
    populationDensity = false,
    probabilityDensity = false,
    lorenzCurve = false,
    valueRange,
    title,
  } = options

  const showPdf = !lorenzCurve && populationDensity && probabilityDensity
  const ordered = [...profile.points].sort((a, b) => a.rank - b.rank)
  const zoomActive = isValueRangeZoomActive(valueRange)
  const chartPoints = zoomActive && valueRange
    ? filterPointsByValueRange(ordered, valueRange)
    : ordered

  const valueAxisName = profile.unit ? `Valeur · ${profile.unit}` : 'Valeur'
  const logOnRank = populationDensity
    ? (showPdf ? false : logScaleY)
    : logScaleX
  const logOnValue = populationDensity ? logScaleX : logScaleY
  const logOnDensity = showPdf ? logScaleY : false
  const valueOnX = !lorenzCurve && (populationDensity || showPdf)

  const base = {
    title: { text: title ?? profile.label, left: 'center', textStyle: { fontSize: 14 } },
    grid: {
      left: valueOnX ? 72 : 88,
      right: 24,
      top: 56,
      bottom: PROFILE_CHART_LAYOUT.gridBottom,
    },
    dataZoom: buildProfileDataZoom(valueOnX),
  }

  if (lorenzCurve) {
    const lorenzPoints = computeLorenzPoints(chartPoints)
    const seriesType = chartType === 'scatter' ? 'scatter' : 'line'

    return {
      ...base,
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          const p = params as { seriesName?: string, value?: [number, number] }
          if (p.seriesName === 'Égalité parfaite') return ''
          const pop = p.value?.[0]
          const wealth = p.value?.[1]
          if (pop === undefined || wealth === undefined) return ''
          return [
            `Population cumulée : ${formatRankPercent(pop)} %`,
            `Patrimoine cumulé : ${formatRankPercent(wealth)} %`,
          ].join('<br/>')
        },
      },
      xAxis: {
        type: 'value' as const,
        name: 'Part cumulée de la population (%)',
        nameLocation: 'middle' as const,
        nameGap: 32,
        min: 0,
        max: 100,
        axisLabel: {
          formatter: (value: number) => `${formatRankPercent(value)} %`,
        },
      },
      yAxis: {
        type: 'value' as const,
        name: 'Part cumulée du patrimoine (%)',
        min: 0,
        max: 100,
        axisLabel: {
          formatter: (value: number) => `${formatRankPercent(value)} %`,
        },
      },
      series: [
        {
          name: 'Égalité parfaite',
          type: 'line',
          data: [[0, 0], [100, 100]],
          symbol: 'none',
          lineStyle: { type: 'dashed', color: '#9E9E9E', width: 1 },
          tooltip: { show: false },
          z: 0,
        },
        {
          name: profile.variable,
          type: seriesType,
          data: lorenzPoints.map((point) => ({ value: [point.populationShare, point.wealthShare] as [number, number], point })),
          showSymbol: seriesType !== 'line',
          symbolSize: seriesType === 'scatter' ? 6 : undefined,
          connectNulls: false,
          step: seriesType === 'line' ? 'end' : undefined,
          z: 1,
        },
      ],
    }
  }

  if (showPdf) {
    let bins = computePdfBins(ordered, { logOnValue })
    if (zoomActive && valueRange) {
      bins = filterPdfBinsByValueRange(bins, valueRange)
    }
    const xAxis = buildValueAxis(valueAxisName, logOnValue)
    const yAxis = buildDensityAxis(profile.unit, logOnDensity)

    const pdfTooltip = (params: unknown) => {
      const p = params as { data?: { bin?: PdfBin } }
      const bin = p?.data?.bin
      if (!bin) return ''
      return [
        `${bin.percentileLo} → ${bin.percentileHi}`,
        `Richesse: ${bin.valueLo.toLocaleString('fr-FR')} – ${bin.valueHi.toLocaleString('fr-FR')}`,
        `Population: ${formatRankPercent(bin.rankLo)} % → ${formatRankPercent(bin.rankHi)} %`,
        `Densité: ${bin.density.toExponential(3)}`,
      ].join('<br/>')
    }

    if (chartType === 'bar') {
      const bands = buildPdfBandItems(bins, { logOnValue, logOnDensity })
      const bounds = computePdfBandAxisBounds(bands, { logOnValue, logOnDensity })
      Object.assign(xAxis, { min: bounds.xMin, max: bounds.xMax })
      Object.assign(yAxis, { min: bounds.yMin, max: bounds.yMax })
      applyValueRangeZoom(xAxis, valueRange, logOnValue)

      return {
        ...base,
        tooltip: { trigger: 'item', formatter: pdfTooltip },
        xAxis,
        yAxis,
        series: [
          {
            name: profile.variable,
            type: 'custom',
            clip: true,
            renderItem: createRenderRankBand(bounds.yBase),
            data: bands.map((band) => ({ value: band.value, bin: band.bin })),
            encode: { x: [0, 1], y: 2 },
            itemStyle: { color: '#1565C0', opacity: 0.85 },
          },
        ],
      }
    }

    const seriesType = chartType === 'scatter' ? 'scatter' : 'line'
    const data = bins
      .map((bin) => {
        const density = cleanDensity(bin.density, logOnDensity)
        if (density === null) return null
        return { bin, pair: [bin.valueLo, density] as [number, number] }
      })
      .filter((entry): entry is { bin: PdfBin, pair: [number, number] } => entry !== null)

    applyValueRangeZoom(xAxis, valueRange, logOnValue)
    applyPdfDensityAxisExtent(yAxis, data.map((d) => d.pair[1]), logOnDensity)

    return {
      ...base,
      tooltip: { trigger: 'item', formatter: pdfTooltip },
      xAxis,
      yAxis,
      series: [
        {
          name: profile.variable,
          type: seriesType,
          data: data.map(({ bin, pair }) => ({ value: pair, bin })),
          showSymbol: seriesType !== 'line',
          symbolSize: seriesType === 'scatter' ? 6 : undefined,
          connectNulls: false,
          step: seriesType === 'line' ? 'end' : undefined,
        },
      ],
    }
  }

  const seriesType = chartType === 'line' ? 'line' : chartType === 'scatter' ? 'scatter' : 'bar'

  if (chartType === 'bar') {
    const bands = buildRankBandItems(chartPoints, { logOnRank, logOnValue, populationDensity })
    const bounds = computeBandAxisBounds(bands, { logOnRank, logOnValue, populationDensity })
    const rankAxis = buildRankAxis(logOnRank)
    const valueAxis = buildValueAxis(valueAxisName, logOnValue)
    const xAxis = populationDensity ? valueAxis : rankAxis
    const yAxis = populationDensity ? rankAxis : valueAxis

    Object.assign(xAxis, { min: bounds.xMin, max: bounds.xMax })
    Object.assign(yAxis, { min: bounds.yMin, max: bounds.yMax })
    applyDualAxisZoom(xAxis, yAxis, {
      valueRange,
      rankPoints: chartPoints,
      logOnRank,
      logOnValue,
      populationDensity,
    })

    return {
      ...base,
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          const p = params as { name?: string, data?: { value?: [number, number, number] } }
          const band = p?.data
          const yVal = populationDensity ? band?.value?.[0] : band?.value?.[2]
          const shown = yVal === null || yVal === undefined ? '—' : yVal.toLocaleString('fr-FR')
          const code = p?.name ? `${p.name}<br/>` : ''
          return `${code}${valueAxisName}: ${shown}`
        },
      },
      xAxis,
      yAxis,
      series: [
        {
          name: profile.variable,
          type: 'custom',
          clip: true,
          renderItem: populationDensity
            ? createRenderPopulationBand(bounds.xBase)
            : createRenderRankBand(bounds.yBase),
          data: bands.map((band) => ({
            name: band.name,
            value: band.value,
            i: band.i,
            k: band.k,
          })),
          encode: populationDensity
            ? { x: 0, y: [1, 2] }
            : { x: [0, 1], y: 2 },
          itemStyle: { color: '#1565C0', opacity: 0.85 },
        },
      ],
    }
  }

  const data = chartPoints
    .map((point) => {
      const rankCoord = rankCoordinate(point.rank, logOnRank)
      const valueCoord = cleanValue(point.value, logOnValue)
      if (rankCoord === null) return null

      if (populationDensity) {
        if (valueCoord === null) return null
        return { point, pair: [valueCoord, rankCoord] as [number, number] }
      }

      return { point, pair: [rankCoord, valueCoord] as [number, number | null] }
    })
    .filter((entry): entry is { point: PercentilePoint, pair: [number, number | null] } => entry !== null)

  const rankAxis = buildRankAxis(logOnRank)
  const valueAxis = buildValueAxis(valueAxisName, logOnValue)
  const xAxis = populationDensity ? valueAxis : rankAxis
  const yAxis = populationDensity ? rankAxis : valueAxis
  // Auto-scale the rank axis to the displayed brackets, like the bar view does.
  applyRankExtentZoom(rankAxis, computeRankIntervalExtent(chartPoints), logOnRank)
  applyDualAxisZoom(xAxis, yAxis, {
    valueRange,
    rankPoints: chartPoints,
    logOnRank,
    logOnValue,
    populationDensity,
  })

  return {
    ...base,
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const p = params as { value?: [number, number | null], data?: { point?: PercentilePoint } }
        const point = p?.data?.point
        const valueShown = point?.value === null || point?.value === undefined
          ? '—'
          : point.value.toLocaleString('fr-FR')
        const percentileLine = point?.percentile ? `${point.percentile}<br/>` : ''
        const rankLine = point?.rank !== undefined
          ? `Part de population: ${formatRankPercent(point.rank)} %<br/>`
          : ''
        return `${percentileLine}${rankLine}${valueAxisName}: ${valueShown}`
      },
    },
    xAxis,
    yAxis,
    series: [
      {
        name: profile.variable,
        type: seriesType,
        data: data.map(({ point, pair }) => ({ value: pair, point })),
        showSymbol: chartType !== 'line',
        symbolSize: chartType === 'scatter' ? 6 : undefined,
        connectNulls: false,
        step: chartType === 'line' ? 'end' : undefined,
        itemStyle: seriesType === 'bar' ? { borderRadius: [2, 2, 0, 0] } : undefined,
      },
    ],
  }
}
