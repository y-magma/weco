import type {
  CustomSeriesRenderItemAPI,
  CustomSeriesRenderItemParams,
  EChartsOption,
} from 'echarts'
import type { PercentilePoint, PercentileProfile } from '@domain/entities'
import { measureKind } from '@domain/catalog/widCodes'
import { parsePercentileInterval } from '@domain/services/percentiles'
import { buildChartToolbox } from '~/visualization/chartZoom'
import {
  applyDualAxisZoom as applyScaleDualAxisZoom,
  applyPdfDensityAxisExtent,
  applyValueAxisExtentFromPlots,
  buildEchartsAxis,
  formatStoredAxisValue,
  isValueRangeZoomActive,
  pdfValueAxisBounds,
  resolveProfileAxisScales,
  type AxisScale,
  type RankAxisScale,
  type ValueRangeZoom,
} from '~/visualization/axisScale'
import {
  buildSmoothDistributionSpline,
  sampleSmoothCdfSeries,
  sampleSmoothPdfSeries,
  type SmoothDistributionMode,
} from '~/visualization/empiricalDistributionSmooth'

export type { SmoothDistributionMode } from '~/visualization/empiricalDistributionSmooth'

export type ProfileChartType = 'bar' | 'scatter' | 'line' | 'scatter-bar' | 'line-bar'

const EMPIRICAL_SERIES_COLOR = '#1565C0'
const SMOOTH_DISTRIBUTION_COLOR = '#C62828'
const EMPIRICAL_PDF_SERIES_NAME = 'PDF empirique'

function showEmpiricalDistribution(mode: SmoothDistributionMode): boolean {
  return mode === 'empirical' || mode === 'both'
}

function showSmoothDistribution(mode: SmoothDistributionMode): boolean {
  return mode === 'smooth' || mode === 'both'
}

function smoothDistributionLineSeries(name: string, pairs: Array<[number, number]>, z = 3) {
  return {
    name,
    type: 'line' as const,
    data: pairs.map((pair) => ({ value: pair })),
    symbol: 'none' as const,
    connectNulls: false,
    lineStyle: { width: 2.5, color: SMOOTH_DISTRIBUTION_COLOR },
    itemStyle: { color: SMOOTH_DISTRIBUTION_COLOR },
    z,
  }
}

function smoothDistributionLegend(mode: SmoothDistributionMode, names: string[]) {
  if (mode !== 'both' || names.length < 2) return undefined
  return { show: true, top: 28, data: names }
}

function applySmoothCdfValueAxisExtent(
  xAxis: { min?: number, max?: number },
  valueScale: AxisScale,
  smoothPairs: Array<[number, number]>,
  empiricalX: number[] = [],
) {
  if (smoothPairs.length === 0) return
  applyValueAxisExtentFromPlots(
    xAxis,
    valueScale,
    [...smoothPairs.map((pair) => pair[0]), ...empiricalX],
  )
}

export type ProfileChartLayer = 'bar' | 'scatter' | 'line'

const CHART_LAYER_ORDER: ProfileChartLayer[] = ['bar', 'scatter', 'line']

/** Map multi-select layers (max 2) to the internal chart encoding. */
export function resolveProfileChartType(layers: ProfileChartLayer[]): ProfileChartType {
  const unique = CHART_LAYER_ORDER.filter((layer) => layers.includes(layer))
  if (unique.length === 0) return 'bar'

  const hasBar = unique.includes('bar')
  const hasScatter = unique.includes('scatter')
  const hasLine = unique.includes('line')

  if (hasBar && hasScatter) return 'scatter-bar'
  if (hasBar && hasLine) return 'line-bar'
  if (hasBar) return 'bar'
  if (hasScatter && hasLine) return 'line'
  if (hasScatter) return 'scatter'
  return 'line'
}

/** Keep at least one layer selected; cap at two for overlay combinations. */
export function normalizeChartTypeLayers(
  next: ProfileChartLayer[],
  prev: ProfileChartLayer[],
): ProfileChartLayer[] {
  if (next.length === 0) {
    return prev.length > 0 ? prev : ['bar']
  }

  const unique = CHART_LAYER_ORDER.filter((layer) => next.includes(layer))
  if (unique.length <= 2) return unique

  const added = next.find((layer) => !prev.includes(layer))
  if (!added) return unique.slice(0, 2)

  if (added === 'bar') {
    const other = prev.find((layer) => layer !== 'bar') ?? unique.find((layer) => layer !== 'bar')
    return other ? ['bar', other] : ['bar']
  }

  if (unique.includes('bar')) {
    return ['bar', added]
  }

  return [added]
}

export function chartTypeLayersEqual(a: ProfileChartLayer[], b: ProfileChartLayer[]): boolean {
  return CHART_LAYER_ORDER.every((layer) => a.includes(layer) === b.includes(layer))
}

/** Opacity for band layers drawn behind line/scatter overlays. */
export const PROFILE_BAND_WATERMARK_OPACITY = 0.18

export function overlaySeriesType(chartType: ProfileChartType): 'scatter' | 'line' | null {
  if (chartType === 'scatter-bar') return 'scatter'
  if (chartType === 'line-bar') return 'line'
  return null
}

export function primaryProfileSeriesType(chartType: ProfileChartType): 'bar' | 'scatter' | 'line' {
  const overlay = overlaySeriesType(chartType)
  if (overlay) return overlay
  return chartType
}

export interface ProfileChartOptions {
  /** Visual encoding of the profile. */
  chartType?: ProfileChartType
  /** Log scale on the displayed X axis (rank spacing or value, depending on view). */
  logScaleX?: boolean
  /** Log scale on the displayed Y axis (value, rank spacing, or density). */
  logScaleY?: boolean
  /**
   * Empirical CDF view: swap axes — X = valeur (richesse), Y = part de
   * population (rang %). See spec/version1.md (graphe #3, axes inversés).
   */
  empiricalCdf?: boolean
  /**
   * Empirical PDF view (requires `empiricalCdf`): Y = dF/dx where
   * F is the empirical CDF from consecutive percentile brackets.
   */
  empiricalPdf?: boolean
  /** Lorenz curve: cumulative population % vs cumulative wealth %. */
  lorenzCurve?: boolean
  /** Smooth CDF/PDF overlay mode (PCHIP on empirical knots). */
  smoothDistributionMode?: SmoothDistributionMode
  /**
   * Fine-grained points for line/scatter overlays on top of aggregated bands.
   * When omitted, the main profile points are used for every series.
   */
  overlayPoints?: PercentilePoint[]
  /** Optional zoom on the value axis; rank axis is auto-fitted to visible brackets. */
  valueRange?: ValueRangeZoom
  title?: string
}

export type { ValueRangeZoom } from '~/visualization/axisScale'
export {
  formatRankAxisLabel,
  isValueRangeZoomActive,
  rankDisplayCoordinate,
  rankDisplayCoordinateUpper,
  rankFromDisplayCoordinate,
  rankFromTopLogCoordinate,
  rankTopLogCoordinate,
} from '~/visualization/axisScale'

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

/** Fit the population (rank) axis to visible brackets. @deprecated use RankAxisScale.applyRankExtent */
export function applyRankExtentZoom(
  axis: { min?: number, max?: number },
  extent: { rankLo: number, rankHi: number } | null,
  logOnRank: boolean,
): void {
  const rankScale = logOnRank
    ? resolveProfileAxisScales({ logScaleX: true, logScaleY: false, empiricalCdf: false, showPdf: false }).rank
    : resolveProfileAxisScales({ logScaleX: false, logScaleY: false, empiricalCdf: false, showPdf: false }).rank
  rankScale.applyRankExtent(axis, extent)
}

/** Apply [min, max] on the value axis. @deprecated use AxisScale.applyZoom */
export function applyValueRangeZoom(
  axis: { min?: number, max?: number },
  range: ValueRangeZoom | undefined,
  logOnValue: boolean,
  symLogOnValue = false,
): void {
  if (!isValueRangeZoomActive(range)) return
  const scale = symLogOnValue
    ? resolveProfileAxisScales({ logScaleX: false, logScaleY: true, empiricalCdf: false, showPdf: false }).value
    : logOnValue
      ? resolveProfileAxisScales({ logScaleX: false, logScaleY: true, empiricalCdf: true, showPdf: false }).value
      : resolveProfileAxisScales({ logScaleX: false, logScaleY: false, empiricalCdf: false, showPdf: false }).value
  scale.applyZoom(axis, range!)
}

/** Value zoom + auto-fit of the population axis (swapped in density view). */
export function applyDualAxisZoom(
  xAxis: { min?: number, max?: number },
  yAxis: { min?: number, max?: number },
  options: {
    valueRange?: ValueRangeZoom
    rankPoints: PercentilePoint[]
    rankScale: RankAxisScale
    valueScale: AxisScale
    empiricalCdf: boolean
  },
): void {
  applyScaleDualAxisZoom(xAxis, yAxis, {
    ...options,
    rankIntervalExtent: computeRankIntervalExtent(options.rankPoints),
  })
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
  /** [xLo, xHi, y] in default view; [xValue, yLo, yHi] in empirical CDF view. */
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
 * Empirical PDF bins: ΔF/Δx between valid percentile segments.
 * F = rank / 100, so density = (rankHi − rankLo) / (100 × (valueHi − valueLo)).
 *
 * Plateaus (Δv = 0): consecutive points at the same wealth level are merged
 * into one segment; density is computed when wealth rises at the next point.
 * Decreasing steps (Δv < 0) are still skipped edge-by-edge.
 */
export function computePdfBins(
  points: PercentilePoint[],
  options: { valueScale?: AxisScale } = {},
): PdfBin[] {
  const valueScale = options.valueScale ?? resolveProfileAxisScales({
    logScaleX: false,
    logScaleY: false,
    empiricalCdf: false,
    showPdf: false,
  }).value
  const ordered = [...points]
    .sort((a, b) => a.rank - b.rank)
    .filter((point) => {
      if (point.value === null || Number.isNaN(point.value)) return false
      if (!Number.isFinite(point.rank) || point.rank >= 100) return false
      if (!valueScale.acceptsRaw(point.value)) return false
      return true
    })

  const bins: PdfBin[] = []
  let i = 0
  while (i < ordered.length - 1) {
    const lo = ordered[i]!
    const vRef = lo.value!

    // Plateau (Δv = 0): advance j while the next point shares the same wealth.
    let j = i + 1
    while (j < ordered.length && ordered[j]!.value === vRef) {
      j++
    }

    if (j >= ordered.length) {
      break
    }

    const hi = ordered[j]!
    const deltaValue = hi.value! - vRef
    if (deltaValue < 0) {
      i++
      continue
    }

    const deltaRank = hi.rank - lo.rank
    bins.push({
      valueLo: vRef,
      valueHi: hi.value!,
      rankLo: lo.rank,
      rankHi: hi.rank,
      density: (deltaRank / 100) / deltaValue,
      midpoint: (vRef + hi.value!) / 2,
      percentileLo: lo.percentile,
      percentileHi: hi.percentile,
    })
    i = j
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

/**
 * Rank (%) where a line/scatter marker sits on the population axis.
 * Average variables (a…) use the midpoint of ]i, k] ; thresholds (t…) keep the lower bound.
 */
export function plotRankForPoint(
  point: PercentilePoint,
  kind: PercentileProfile['kind'],
): number {
  if (kind === 'average') {
    const bounds = parsePercentileInterval(point.percentile)
    if (bounds) return (bounds.i + bounds.k) / 2
  }
  return point.rank
}

function profilePointRankTooltipLine(
  point: PercentilePoint,
  kind: PercentileProfile['kind'],
): string {
  const bounds = parsePercentileInterval(point.percentile)
  if (kind === 'average' && bounds) {
    return `Tranche de population: ${formatRankPercent(bounds.i)} → ${formatRankPercent(bounds.k)} %<br/>`
  }
  if (point.rank !== undefined) {
    return `Part de population: ${formatRankPercent(point.rank)} %<br/>`
  }
  return ''
}

/**
 * Build band items for each `pᵢpₖ` bracket on ]i %, k %].
 * Default view: X = rank span, Y = value. Empirical CDF view: X = value, Y = rank span.
 */
export function buildRankBandItems(
  points: PercentilePoint[],
  options: {
    rankScale: RankAxisScale
    valueScale: AxisScale
    empiricalCdf?: boolean
  },
): RankBandItem[] {
  const { rankScale, valueScale, empiricalCdf = false } = options
  const ordered = [...points].sort((a, b) => a.rank - b.rank)
  const items: RankBandItem[] = []

  for (const point of ordered) {
    const bounds = parsePercentileInterval(point.percentile)
    if (!bounds) continue
    const { i, k } = bounds
    if (point.value === null || Number.isNaN(point.value)) continue
    const plotValue = valueScale.toPlotCoord(point.value)
    if (plotValue === null) continue

    const rankLo = rankScale.rankBound(i, 'lower')
    const rankHi = rankScale.rankBound(k, 'upper')
    if (rankLo === null || rankHi === null) continue

    if (empiricalCdf) {
      items.push({ name: point.percentile, i, k, value: [plotValue, rankLo, rankHi] })
    } else {
      items.push({ name: point.percentile, i, k, value: [rankLo, rankHi, plotValue] })
    }
  }
  return items
}

/** Auto-scale axes for custom band charts (lin-log / log-log safe). */
export function computeBandAxisBounds(
  items: RankBandItem[],
  options: {
    rankScale: RankAxisScale
    valueScale: AxisScale
    empiricalCdf?: boolean
  },
): BandAxisBounds {
  const { rankScale, valueScale, empiricalCdf = false } = options
  if (items.length === 0) return { xBase: 0, yBase: 0 }

  if (empiricalCdf) {
    const xLo = Math.min(...items.map((item) => item.value[0]))
    const xHi = Math.max(...items.map((item) => item.value[0]))
    const yLo = Math.min(...items.map((item) => item.value[1]))
    const yHi = Math.max(...items.map((item) => item.value[2]))
    const x = valueScale.axisBounds(xLo, xHi)
    const y = rankScale.axisBounds(yLo, yHi, { rankDensityY: true })
    return { xMin: x.min, xMax: x.max, yMin: y.min, yMax: y.max, xBase: x.base, yBase: y.base }
  }

  const xLo = Math.min(...items.map((item) => item.value[0]))
  const xHi = Math.max(...items.map((item) => item.value[1]))
  const yLo = Math.min(...items.map((item) => item.value[2]))
  const yHi = Math.max(...items.map((item) => item.value[2]))
  const x = rankScale.axisBounds(xLo, xHi, { capRankAt100: true })
  const y = valueScale.axisBounds(yLo, yHi)
  return { xMin: x.min, xMax: x.max, yMin: y.min, yMax: y.max, xBase: 0, yBase: y.base }
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
    const valueY = top[1]
    const baseY = grid ? Math.min(base[1], grid.bottom) : base[1]
    // Positive densities below the axis floor (log auto-scale) must not draw downward.
    if (y > 0 && valueY > baseY + 0.5) return null

    const rectY = Math.min(valueY, baseY)
    const rectH = Math.max(Math.abs(valueY - baseY), 1)
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

/** Narrow vertical sticks centered on rank, from baseline to value. */
export function createRenderRankStick(yBase: number, barWidthPx = 5) {
  return function renderRankStick(
    params: CustomSeriesRenderItemParams,
    api: CustomSeriesRenderItemAPI,
  ) {
    const rankCoord = api.value(0) as number
    const y = api.value(1) as number
    if (!Number.isFinite(rankCoord) || !Number.isFinite(y)) return null

    const top = api.coord([rankCoord, y])
    const base = api.coord([rankCoord, yBase])
    const grid = gridPixelRect(params)

    const valueY = top[1]
    const baseY = grid ? Math.min(base[1], grid.bottom) : base[1]
    const rectY = Math.min(valueY, baseY)
    const rectH = Math.max(Math.abs(valueY - baseY), 1)
    const halfW = barWidthPx / 2
    const clipped = clampRectToGrid(top[0] - halfW, rectY, barWidthPx, rectH, grid)
    if (clipped.width < 0.5 || clipped.height < 0.5) return null

    return {
      type: 'rect' as const,
      shape: clipped,
      style: api.style(),
    }
  }
}

/** Vertical bands: value on X, rank span on Y (empirical CDF view). */
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
  options: { valueScale: AxisScale, densityScale: AxisScale },
): PdfBandItem[] {
  const { valueScale, densityScale } = options
  return bins.flatMap((bin) => {
    const density = densityScale.toPlotCoord(bin.density)
    if (density === null) return []
    if (!valueScale.acceptsRaw(bin.valueLo) || !valueScale.acceptsRaw(bin.valueHi)) return []
    const valueLo = valueScale.toPlotCoord(bin.valueLo)!
    const valueHi = valueScale.toPlotCoord(bin.valueHi)!
    return [{ value: [valueLo, valueHi, density] as [number, number, number], bin }]
  })
}

/** Auto-scale axes for PDF band charts; yBase anchors bands at the density floor. */
export function computePdfBandAxisBounds(
  items: PdfBandItem[],
  options: { valueScale: AxisScale, densityScale: AxisScale },
): BandAxisBounds {
  const { valueScale, densityScale } = options
  if (items.length === 0) return { xBase: 0, yBase: 0 }

  const xLo = Math.min(...items.map((item) => item.value[0]))
  const xHi = Math.max(...items.map((item) => item.value[1]))
  const dMin = Math.min(...items.map((item) => item.value[2]))
  const dMax = Math.max(...items.map((item) => item.value[2]))

  const x = pdfValueAxisBounds(valueScale, xLo, xHi)
  const y = densityScale.axisBounds(dMin, dMax)
  return { xMin: x.min, xMax: x.max, yMin: y.min, yMax: y.max, xBase: x.base, yBase: y.base }
}

/** Layout shared by grid margins and dataZoom sliders (keeps axis titles clear of the jauge). */
export const PROFILE_CHART_LAYOUT = {
  bottomSlider: 4,
  bottomSliderHeight: 18,
  rightSlider: 4,
  rightSliderWidth: 18,
  gridTop: 56,
  /** Space below the plot for tick labels + axis name, above the horizontal slider. */
  gridBottom: 90,
  /** Space right of plot for vertical slider (Y axis name stays on the left). */
  gridRight: 48,
} as const

/** Initial visible window for profile dataZoom (band-framed overlay views). */
export interface ProfileDataZoomWindow {
  rankStart?: number
  rankEnd?: number
  valueStart?: number
  valueEnd?: number
}

/** Map band axis bounds to rank/value dataZoom windows (handles density axis swap). */
export function bandDataZoomWindow(
  bounds: BandAxisBounds,
  empiricalCdf: boolean,
): ProfileDataZoomWindow | undefined {
  const hasRank = bounds.xMin != null || bounds.xMax != null
    || bounds.yMin != null || bounds.yMax != null
  if (!hasRank) return undefined

  return empiricalCdf
    ? {
        valueStart: bounds.xMin,
        valueEnd: bounds.xMax,
        rankStart: bounds.yMin,
        rankEnd: bounds.yMax,
      }
    : {
        rankStart: bounds.xMin,
        rankEnd: bounds.xMax,
        valueStart: bounds.yMin,
        valueEnd: bounds.yMax,
      }
}

function dataZoomRange(
  start?: number,
  end?: number,
): { start: number, end: number } | { startValue?: number, endValue?: number } {
  if (start == null && end == null) return { start: 0, end: 100 }
  return {
    ...(start != null ? { startValue: start } : {}),
    ...(end != null ? { endValue: end } : {}),
  }
}

export interface ProfileDataZoomOptions {
  /** `none` pans/scales the value axis without filtering series (needed on log Y). */
  valueFilterMode?: 'filter' | 'none'
  /** `none` pans/scales the rank axis without filtering series (needed on strict log X). */
  rankFilterMode?: 'filter' | 'none'
  /** Value-axis slider (horizontal when richesse en abscisse, vertical otherwise). */
  showValueSlider?: boolean
  /** Plot top — vertical slider starts here (align with grid.top). */
  gridTop?: number
}

type ProfileSlider = {
  type: 'slider'
  filterMode: 'filter' | 'none'
  start?: number
  end?: number
  startValue?: number
  endValue?: number
} & (
  | { xAxisIndex: 0, height: number, bottom: number }
  | {
    orient: 'vertical'
    yAxisIndex: 0
    width: number
    right: number
    top: number
    bottom: number
  }
)

/** Native ECharts sliders: rank/value on X (bottom) or Y (right) + inside zoom on both axes. */
export function buildProfileDataZoom(
  valueOnX: boolean,
  initialWindow?: ProfileDataZoomWindow,
  options?: ProfileDataZoomOptions,
) {
  const rankOnX = !valueOnX
  const valueFilterMode = options?.valueFilterMode ?? 'filter'
  const rankFilterMode = options?.rankFilterMode ?? 'filter'
  const showValueSlider = options?.showValueSlider ?? true
  const {
    bottomSlider,
    bottomSliderHeight,
    rightSlider,
    rightSliderWidth,
    gridBottom,
    gridTop: defaultGridTop,
  } = PROFILE_CHART_LAYOUT
  const gridTop = options?.gridTop ?? defaultGridTop
  const rankRange = dataZoomRange(initialWindow?.rankStart, initialWindow?.rankEnd)
  const valueRange = dataZoomRange(initialWindow?.valueStart, initialWindow?.valueEnd)

  const rankInside = rankOnX
    ? { type: 'inside' as const, xAxisIndex: 0, filterMode: rankFilterMode, ...rankRange }
    : { type: 'inside' as const, yAxisIndex: 0, filterMode: rankFilterMode, ...rankRange }

  const valueInside = valueOnX
    ? { type: 'inside' as const, xAxisIndex: 0, filterMode: valueFilterMode, ...valueRange }
    : { type: 'inside' as const, yAxisIndex: 0, filterMode: valueFilterMode, ...valueRange }

  const hasBottomSlider = rankOnX || (valueOnX && showValueSlider)
  const verticalBottom = gridBottom + (hasBottomSlider ? bottomSliderHeight + bottomSlider : 0)
  const verticalSliderBase = {
    type: 'slider' as const,
    orient: 'vertical' as const,
    yAxisIndex: 0 as const,
    width: rightSliderWidth,
    right: rightSlider,
    top: gridTop,
    bottom: verticalBottom,
  }

  const sliders: ProfileSlider[] = []

  if (rankOnX) {
    sliders.push({
      type: 'slider',
      xAxisIndex: 0,
      height: bottomSliderHeight,
      bottom: bottomSlider,
      filterMode: rankFilterMode,
      ...rankRange,
    })
  } else {
    sliders.push({
      ...verticalSliderBase,
      filterMode: rankFilterMode,
      ...rankRange,
    })
  }

  if (showValueSlider) {
    if (valueOnX) {
      sliders.push({
        type: 'slider',
        xAxisIndex: 0,
        height: bottomSliderHeight,
        bottom: bottomSlider,
        filterMode: valueFilterMode,
        ...valueRange,
      })
    } else {
      sliders.push({
        ...verticalSliderBase,
        filterMode: valueFilterMode,
        ...valueRange,
      })
    }
  }

  return [rankInside, valueInside, ...sliders]
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
    chartType = 'bar',
    logScaleY = false,
    logScaleX = false,
    empiricalCdf = false,
    empiricalPdf = false,
    lorenzCurve = false,
    smoothDistributionMode = 'empirical',
    valueRange,
    overlayPoints,
    title,
  } = options

  const showPdf = !lorenzCurve && empiricalCdf && empiricalPdf
  const showEmpiricalDist = showEmpiricalDistribution(smoothDistributionMode)
  const showSmoothDist = showSmoothDistribution(smoothDistributionMode)
  const wealthLogForSpline = empiricalCdf && logScaleX
  const ordered = [...profile.points].sort((a, b) => a.rank - b.rank)
  const zoomActive = isValueRangeZoomActive(valueRange)
  const chartPoints = zoomActive && valueRange
    ? filterPointsByValueRange(ordered, valueRange)
    : ordered

  const valueAxisName = profile.unit ? `Valeur · ${profile.unit}` : 'Valeur'
  const scales = resolveProfileAxisScales({
    logScaleX,
    logScaleY,
    empiricalCdf,
    showPdf,
    measureKind: measureKind(profile.variable),
  })
  const { rank: rankScale, value: valueScale, density: densityScale } = scales
  const smoothSpline = showSmoothDist && (empiricalCdf || showPdf)
    ? buildSmoothDistributionSpline(chartPoints, { logX: wealthLogForSpline })
    : null
  const valueOnX = !lorenzCurve && (empiricalCdf || showPdf)
  const densityAxisName = profile.unit
    ? `PDF empirique · 1/${profile.unit}`
    : 'PDF empirique'

  const rankAxisConfig = buildEchartsAxis('Part de population (%)', rankScale, { nameGap: 32 })
  const valueAxisConfig = buildEchartsAxis(valueAxisName, valueScale)
  const densityAxisConfig = buildEchartsAxis(densityAxisName, densityScale)

  const base = {
    title: {
      text: title ?? profile.label,
      subtext: valueScale.chartSubtext,
      left: 'center' as const,
      textStyle: { fontSize: 14 },
      subtextStyle: { fontSize: 11, color: '#616161' },
    },
    grid: {
      left: 72,
      right: PROFILE_CHART_LAYOUT.gridRight,
      top: PROFILE_CHART_LAYOUT.gridTop,
      bottom: PROFILE_CHART_LAYOUT.gridBottom,
    },
    toolbox: buildChartToolbox(),
    dataZoom: buildProfileDataZoom(valueOnX),
  }

  if (lorenzCurve) {
    const lorenzPoints = computeLorenzPoints(chartPoints)
    const seriesType = primaryProfileSeriesType(chartType) === 'scatter' ? 'scatter' : 'line'

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
          z: 1,
        },
      ],
    }
  }

  if (showPdf) {
    let bins = computePdfBins(ordered, { valueScale })
    if (zoomActive && valueRange) {
      bins = filterPdfBinsByValueRange(bins, valueRange)
    }
    const xAxis = { ...valueAxisConfig }
    const yAxis = { ...densityAxisConfig }
    const empiricalOpacity = smoothDistributionMode === 'both' ? 0.45 : 0.85
    const smoothPdfPairs = smoothSpline
      ? sampleSmoothPdfSeries(smoothSpline, valueScale, densityScale, { logX: wealthLogForSpline })
      : []

    const pdfTooltip = (params: unknown) => {
      const p = params as {
        seriesName?: string
        data?: { bin?: PdfBin, value?: [number, number] }
      }
      if (p.seriesName === 'PDF lissée' && p.data?.value) {
        const xStored = valueScale.toDisplayValue(p.data.value[0])
        const densityStored = densityScale.toDisplayValue(p.data.value[1])
        return [
          `Richesse : ${xStored.toLocaleString('fr-FR')}`,
          `PDF lissée : ${densityStored.toExponential(3)}`,
          'Spline monotone PCHIP sur la CDF empirique',
        ].join('<br/>')
      }
      const bin = p?.data?.bin
      if (!bin) return ''
      return [
        `${bin.percentileLo} → ${bin.percentileHi}`,
        `Richesse: ${bin.valueLo.toLocaleString('fr-FR')} – ${bin.valueHi.toLocaleString('fr-FR')}`,
        `Population: ${formatRankPercent(bin.rankLo)} % → ${formatRankPercent(bin.rankHi)} %`,
        `Densité: ${bin.density.toExponential(3)}`,
      ].join('<br/>')
    }

    const series: EChartsOption['series'] = []
    const legendNames: string[] = []

    if (primaryProfileSeriesType(chartType) === 'bar' && showEmpiricalDist) {
      const bands = buildPdfBandItems(bins, { valueScale, densityScale })
      const bounds = computePdfBandAxisBounds(bands, { valueScale, densityScale })
      valueScale.applyZoom(xAxis, valueRange ?? {})
      if (bounds.xMin != null) xAxis.min = bounds.xMin
      if (bounds.xMax != null) xAxis.max = bounds.xMax
      if (bounds.yMin != null) yAxis.min = bounds.yMin
      if (bounds.yMax != null) yAxis.max = bounds.yMax
      series.push({
        name: EMPIRICAL_PDF_SERIES_NAME,
        type: 'custom',
        clip: true,
        renderItem: createRenderRankBand(bounds.yBase),
        data: bands.map((band) => ({ value: band.value, bin: band.bin })),
        encode: { x: [0, 1], y: 2 },
        itemStyle: { color: EMPIRICAL_SERIES_COLOR, opacity: empiricalOpacity },
      })
      legendNames.push(EMPIRICAL_PDF_SERIES_NAME)
    } else if (showEmpiricalDist) {
      const seriesType = primaryProfileSeriesType(chartType) === 'scatter' ? 'scatter' : 'line'
      const data = bins
        .map((bin) => {
          const density = densityScale.toPlotCoord(bin.density)
          if (density === null) return null
          const xCoord = valueScale.toPlotCoord(bin.valueLo)
          if (xCoord === null) return null
          return { bin, pair: [xCoord, density] as [number, number] }
        })
        .filter((entry): entry is { bin: PdfBin, pair: [number, number] } => entry !== null)

      valueScale.applyZoom(xAxis, valueRange ?? {})
      applyPdfDensityAxisExtent(yAxis, densityScale, data.map((d) => d.pair[1]))

      series.push({
        name: EMPIRICAL_PDF_SERIES_NAME,
        type: seriesType,
        data: data.map(({ bin, pair }) => ({ value: pair, bin })),
        showSymbol: seriesType !== 'line',
        symbolSize: seriesType === 'scatter' ? 6 : undefined,
        connectNulls: false,
        itemStyle: { color: EMPIRICAL_SERIES_COLOR, opacity: empiricalOpacity },
        lineStyle: seriesType === 'line' ? { color: EMPIRICAL_SERIES_COLOR } : undefined,
      })
      legendNames.push(EMPIRICAL_PDF_SERIES_NAME)
    }

    if (showSmoothDist && smoothPdfPairs.length > 0) {
      if (series.length === 0) {
        valueScale.applyZoom(xAxis, valueRange ?? {})
        applyPdfDensityAxisExtent(yAxis, densityScale, smoothPdfPairs.map((p) => p[1]))
      } else {
        const empiricalDensityPlots = showEmpiricalDist
          ? bins
              .map((bin) => densityScale.toPlotCoord(bin.density))
              .filter((density): density is number => density !== null)
          : []
        applyPdfDensityAxisExtent(yAxis, densityScale, [
          ...empiricalDensityPlots,
          ...smoothPdfPairs.map((p) => p[1]),
        ])
      }
      series.push(smoothDistributionLineSeries('PDF lissée', smoothPdfPairs))
      legendNames.push('PDF lissée')
    }

    return {
      ...base,
      legend: smoothDistributionLegend(smoothDistributionMode, legendNames),
      tooltip: { trigger: 'item', formatter: pdfTooltip },
      xAxis,
      yAxis,
      series,
    }
  }

  const overlayType = overlaySeriesType(chartType)
  const overlayOrdered = overlayType
    ? [...(overlayPoints ?? chartPoints)].sort((a, b) => a.rank - b.rank)
    : chartPoints

  const bandOptions = { rankScale, valueScale, empiricalCdf }
  const smoothCdfPairs = empiricalCdf && smoothSpline
    ? sampleSmoothCdfSeries(smoothSpline, valueScale, rankScale, { logX: wealthLogForSpline })
    : []
  const empiricalDistOpacity = smoothDistributionMode === 'both' ? 0.45 : 0.85

  if (chartType === 'bar') {
    const bands = buildRankBandItems(chartPoints, bandOptions)
    const bounds = computeBandAxisBounds(bands, bandOptions)
    const xAxis = empiricalCdf ? { ...valueAxisConfig } : { ...rankAxisConfig }
    const yAxis = empiricalCdf ? { ...rankAxisConfig } : { ...valueAxisConfig }

    applyDualAxisZoom(xAxis, yAxis, {
      valueRange,
      rankPoints: chartPoints,
      rankScale,
      valueScale,
      empiricalCdf,
    })

    if (!empiricalCdf) {
      return {
        ...base,
        tooltip: {
          trigger: 'item',
          formatter: (params) => {
            const p = params as { name?: string, data?: { value?: [number, number, number] } }
            const band = p?.data
            const plotVal = band?.value?.[2]
            const shown = formatStoredAxisValue(valueScale, plotVal)
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
            renderItem: createRenderRankBand(bounds.yBase),
            data: bands.map((band) => ({
              name: band.name,
              value: band.value,
              i: band.i,
              k: band.k,
            })),
            encode: { x: [0, 1], y: 2 },
            itemStyle: { color: EMPIRICAL_SERIES_COLOR, opacity: 0.85 },
          },
        ],
      }
    }

    const barSeries: EChartsOption['series'] = []
    const barLegendNames: string[] = []
    if (showEmpiricalDist) {
      barSeries.push({
        name: profile.variable,
        type: 'custom',
        clip: true,
        renderItem: createRenderPopulationBand(bounds.xBase),
        data: bands.map((band) => ({
          name: band.name,
          value: band.value,
          i: band.i,
          k: band.k,
        })),
        encode: { x: 0, y: [1, 2] },
        itemStyle: { color: EMPIRICAL_SERIES_COLOR, opacity: empiricalDistOpacity },
      })
      barLegendNames.push(profile.variable)
    }
    if (showSmoothDist && smoothCdfPairs.length > 0) {
      barSeries.push(smoothDistributionLineSeries('CDF lissée', smoothCdfPairs))
      barLegendNames.push('CDF lissée')
    }

    applySmoothCdfValueAxisExtent(
      xAxis,
      valueScale,
      smoothCdfPairs,
      showEmpiricalDist ? bands.map((band) => band.value[0]) : [],
    )

    return {
      ...base,
      legend: smoothDistributionLegend(smoothDistributionMode, barLegendNames),
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          const p = params as {
            seriesName?: string
            name?: string
            data?: { value?: [number, number] | [number, number, number] }
          }
          if (p.seriesName === 'CDF lissée' && p.data?.value?.length === 2) {
            const pair = p.data.value as [number, number]
            return [
              `Richesse : ${valueScale.toDisplayValue(pair[0]).toLocaleString('fr-FR')}`,
              `Population cumulée : ${formatRankPercent(rankScale.toDisplayValue(pair[1]))} %`,
              'Spline monotone PCHIP sur la CDF empirique',
            ].join('<br/>')
          }
          const band = p?.data
          const plotVal = band?.value?.[0]
          const shown = formatStoredAxisValue(valueScale, plotVal)
          const code = p?.name ? `${p.name}<br/>` : ''
          return `${code}${valueAxisName}: ${shown}`
        },
      },
      xAxis,
      yAxis,
      series: barSeries,
    }
  }

  const seriesPoints = overlayType ? overlayOrdered : chartPoints
  const seriesChartPoints = zoomActive && valueRange
    ? filterPointsByValueRange(seriesPoints, valueRange)
    : seriesPoints

  const data = seriesChartPoints
    .map((point) => {
      const rankCoord = rankScale.toPlotCoord(plotRankForPoint(point, profile.kind))
      const valueCoord = point.value === null ? null : valueScale.toPlotCoord(point.value)
      if (rankCoord === null) return null

      if (empiricalCdf) {
        if (valueCoord === null) return null
        return { point, pair: [valueCoord, rankCoord] as [number, number] }
      }

      return { point, pair: [rankCoord, valueCoord] as [number, number | null] }
    })
    .filter((entry): entry is { point: PercentilePoint, pair: [number, number | null] } => entry !== null)

  const xAxis = empiricalCdf ? { ...valueAxisConfig } : { ...rankAxisConfig }
  const yAxis = empiricalCdf ? { ...rankAxisConfig } : { ...valueAxisConfig }
  applyDualAxisZoom(xAxis, yAxis, {
    valueRange,
    rankPoints: seriesPoints,
    rankScale,
    valueScale,
    empiricalCdf,
  })

  if (overlayType) {
    const bands = buildRankBandItems(chartPoints, bandOptions)
    const bounds = computeBandAxisBounds(bands, bandOptions)
    const overlayDataZoom = buildProfileDataZoom(
      valueOnX,
      bandDataZoomWindow(bounds, empiricalCdf),
    )

    const overlaySeries: EChartsOption['series'] = [
      {
        name: 'Bandes',
        type: 'custom',
        clip: true,
        z: 0,
        renderItem: empiricalCdf
          ? createRenderPopulationBand(bounds.xBase)
          : createRenderRankBand(bounds.yBase),
        data: bands.map((band) => ({
          name: band.name,
          value: band.value,
          i: band.i,
          k: band.k,
        })),
        encode: empiricalCdf
          ? { x: 0, y: [1, 2] }
          : { x: [0, 1], y: 2 },
        itemStyle: { color: EMPIRICAL_SERIES_COLOR, opacity: PROFILE_BAND_WATERMARK_OPACITY },
        emphasis: { itemStyle: { opacity: PROFILE_BAND_WATERMARK_OPACITY * 1.6 } },
      },
    ]
    const overlayLegendNames: string[] = []

    if (empiricalCdf && showEmpiricalDist) {
      overlaySeries.push({
        name: profile.variable,
        type: overlayType,
        z: 2,
        data: data.map(({ point, pair }) => ({ value: pair, point })),
        showSymbol: overlayType !== 'line',
        symbolSize: overlayType === 'scatter' ? 6 : undefined,
        connectNulls: false,
        lineStyle: overlayType === 'line'
          ? { width: 2, color: EMPIRICAL_SERIES_COLOR, opacity: empiricalDistOpacity }
          : undefined,
        itemStyle: { color: EMPIRICAL_SERIES_COLOR, opacity: empiricalDistOpacity },
      })
      overlayLegendNames.push(profile.variable)
    } else if (!empiricalCdf) {
      overlaySeries.push({
        name: profile.variable,
        type: overlayType,
        z: 2,
        data: data.map(({ point, pair }) => ({ value: pair, point })),
        showSymbol: overlayType !== 'line',
        symbolSize: overlayType === 'scatter' ? 6 : undefined,
        connectNulls: false,
        lineStyle: overlayType === 'line' ? { width: 2, color: EMPIRICAL_SERIES_COLOR } : undefined,
        itemStyle: { color: EMPIRICAL_SERIES_COLOR },
      })
    }

    if (empiricalCdf && showSmoothDist && smoothCdfPairs.length > 0) {
      overlaySeries.push(smoothDistributionLineSeries('CDF lissée', smoothCdfPairs))
      overlayLegendNames.push('CDF lissée')
    }

    applySmoothCdfValueAxisExtent(
      xAxis,
      valueScale,
      smoothCdfPairs,
      empiricalCdf && showEmpiricalDist ? data.map((entry) => entry.pair[0]) : [],
    )

    return {
      ...base,
      legend: empiricalCdf
        ? smoothDistributionLegend(smoothDistributionMode, overlayLegendNames)
        : undefined,
      dataZoom: overlayDataZoom,
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          const p = params as {
            seriesName?: string
            seriesType?: string
            name?: string
            value?: [number, number | null]
            data?: { value?: [number, number] | [number, number, number], point?: PercentilePoint }
          }
          if (p.seriesName === 'CDF lissée' && p.data?.value?.length === 2) {
            const pair = p.data.value as [number, number]
            return [
              `Richesse : ${valueScale.toDisplayValue(pair[0]).toLocaleString('fr-FR')}`,
              `Population cumulée : ${formatRankPercent(rankScale.toDisplayValue(pair[1]))} %`,
              'Spline monotone PCHIP sur la CDF empirique',
            ].join('<br/>')
          }
          if (p.seriesType === 'custom') {
            const band = p?.data
            const plotVal = empiricalCdf ? band?.value?.[0] : band?.value?.[2]
            const shown = formatStoredAxisValue(valueScale, plotVal)
            const code = p?.name ? `${p.name}<br/>` : ''
            return `${code}${valueAxisName}: ${shown}`
          }
          const point = p?.data?.point
          const valueShown = point?.value === null || point?.value === undefined
            ? '—'
            : point.value.toLocaleString('fr-FR')
          const percentileLine = point?.percentile ? `${point.percentile}<br/>` : ''
          const rankLine = point ? profilePointRankTooltipLine(point, profile.kind) : ''
          return `${percentileLine}${rankLine}${valueAxisName}: ${valueShown}`
        },
      },
      xAxis,
      yAxis,
      series: overlaySeries,
    }
  }

  const seriesType = chartType === 'line' ? 'line' : 'scatter'
  const lineSeries: EChartsOption['series'] = []
  const lineLegendNames: string[] = []

  if (empiricalCdf && showEmpiricalDist) {
    lineSeries.push({
      name: profile.variable,
      type: seriesType,
      data: data.map(({ point, pair }) => ({ value: pair, point })),
      showSymbol: seriesType !== 'line',
      symbolSize: seriesType === 'scatter' ? 6 : undefined,
      connectNulls: false,
      itemStyle: { color: EMPIRICAL_SERIES_COLOR, opacity: empiricalDistOpacity },
      lineStyle: seriesType === 'line' ? { color: EMPIRICAL_SERIES_COLOR } : undefined,
    })
    lineLegendNames.push(profile.variable)
  } else if (!empiricalCdf) {
    lineSeries.push({
      name: profile.variable,
      type: seriesType,
      data: data.map(({ point, pair }) => ({ value: pair, point })),
      showSymbol: seriesType !== 'line',
      symbolSize: seriesType === 'scatter' ? 6 : undefined,
      connectNulls: false,
      itemStyle: undefined,
    })
  }

  if (empiricalCdf && showSmoothDist && smoothCdfPairs.length > 0) {
    lineSeries.push(smoothDistributionLineSeries('CDF lissée', smoothCdfPairs))
    lineLegendNames.push('CDF lissée')
  }

  applySmoothCdfValueAxisExtent(
    xAxis,
    valueScale,
    smoothCdfPairs,
    empiricalCdf && showEmpiricalDist ? data.map((entry) => entry.pair[0]) : [],
  )

  return {
    ...base,
    legend: empiricalCdf
      ? smoothDistributionLegend(smoothDistributionMode, lineLegendNames)
      : undefined,
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const p = params as {
          seriesName?: string
          value?: [number, number | null]
          data?: { value?: [number, number], point?: PercentilePoint }
        }
        if (p.seriesName === 'CDF lissée' && p.data?.value) {
          const pair = p.data.value
          return [
            `Richesse : ${valueScale.toDisplayValue(pair[0]).toLocaleString('fr-FR')}`,
            `Population cumulée : ${formatRankPercent(rankScale.toDisplayValue(pair[1]))} %`,
            'Spline monotone PCHIP sur la CDF empirique',
          ].join('<br/>')
        }
        const point = p?.data?.point
        const valueShown = point?.value === null || point?.value === undefined
          ? '—'
          : point.value.toLocaleString('fr-FR')
        const percentileLine = point?.percentile ? `${point.percentile}<br/>` : ''
        const rankLine = point ? profilePointRankTooltipLine(point, profile.kind) : ''
        return `${percentileLine}${rankLine}${valueAxisName}: ${valueShown}`
      },
    },
    xAxis,
    yAxis,
    series: lineSeries,
  }
}
