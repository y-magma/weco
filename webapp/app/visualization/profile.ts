import type {
  CustomSeriesRenderItemAPI,
  CustomSeriesRenderItemParams,
  EChartsOption,
} from 'echarts'
import type { PercentilePoint, PercentileProfile } from '@domain/entities'
import { parsePercentileInterval } from '@domain/services/percentiles'
import { buildChartToolbox } from '~/visualization/chartZoom'
import {
  applyDualAxisZoom as applyScaleDualAxisZoom,
  applyPdfDensityAxisExtent,
  buildEchartsAxis,
  formatStoredAxisValue,
  isValueRangeZoomActive,
  pdfValueAxisBounds,
  resolveProfileAxisScales,
  type AxisScale,
  type RankAxisScale,
  type ValueRangeZoom,
} from '~/visualization/axisScale'

export type ProfileChartType = 'bar' | 'scatter' | 'line' | 'scatter-bar' | 'line-bar'

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
    ? resolveProfileAxisScales({ logScaleX: true, logScaleY: false, populationDensity: false, showPdf: false }).rank
    : resolveProfileAxisScales({ logScaleX: false, logScaleY: false, populationDensity: false, showPdf: false }).rank
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
    ? resolveProfileAxisScales({ logScaleX: false, logScaleY: true, populationDensity: false, showPdf: false }).value
    : logOnValue
      ? resolveProfileAxisScales({ logScaleX: false, logScaleY: true, populationDensity: true, showPdf: false }).value
      : resolveProfileAxisScales({ logScaleX: false, logScaleY: false, populationDensity: false, showPdf: false }).value
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
    populationDensity: boolean
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
 * Empirical PDF bins: ΔF/Δx between consecutive valid percentile points.
 * F = rank / 100, so density = (rankHi − rankLo) / (100 × (valueHi − valueLo)).
 */
export function computePdfBins(
  points: PercentilePoint[],
  options: { valueScale?: AxisScale } = {},
): PdfBin[] {
  const valueScale = options.valueScale ?? resolveProfileAxisScales({
    logScaleX: false,
    logScaleY: false,
    populationDensity: false,
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
 * Default view: X = rank span, Y = value. Population-density view: X = value, Y = rank span.
 */
export function buildRankBandItems(
  points: PercentilePoint[],
  options: {
    rankScale: RankAxisScale
    valueScale: AxisScale
    populationDensity?: boolean
  },
): RankBandItem[] {
  const { rankScale, valueScale, populationDensity = false } = options
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

    if (populationDensity) {
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
    populationDensity?: boolean
  },
): BandAxisBounds {
  const { rankScale, valueScale, populationDensity = false } = options
  if (items.length === 0) return { xBase: 0, yBase: 0 }

  if (populationDensity) {
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
  /** Space below the plot for tick labels + axis name, above the horizontal slider. */
  gridBottom: 90,
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
  populationDensity: boolean,
): ProfileDataZoomWindow | undefined {
  const hasRank = bounds.xMin != null || bounds.xMax != null
    || bounds.yMin != null || bounds.yMax != null
  if (!hasRank) return undefined

  return populationDensity
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

/** Native ECharts sliders: rank/population axis + value axis (horizontal or vertical). */
export function buildProfileDataZoom(
  valueOnX: boolean,
  initialWindow?: ProfileDataZoomWindow,
) {
  const rankOnX = !valueOnX
  const { bottomSlider, bottomSliderHeight, gridBottom } = PROFILE_CHART_LAYOUT
  const rankRange = dataZoomRange(initialWindow?.rankStart, initialWindow?.rankEnd)
  const valueRange = dataZoomRange(initialWindow?.valueStart, initialWindow?.valueEnd)

  const rankInside = rankOnX
    ? { type: 'inside' as const, xAxisIndex: 0, filterMode: 'filter' as const, ...rankRange }
    : { type: 'inside' as const, yAxisIndex: 0, filterMode: 'filter' as const, ...rankRange }

  const valueInside = valueOnX
    ? { type: 'inside' as const, xAxisIndex: 0, filterMode: 'filter' as const, ...valueRange }
    : { type: 'inside' as const, yAxisIndex: 0, filterMode: 'filter' as const, ...valueRange }

  const rankSlider = rankOnX
    ? {
        type: 'slider' as const,
        xAxisIndex: 0,
        height: bottomSliderHeight,
        bottom: bottomSlider,
        filterMode: 'filter' as const,
        ...rankRange,
      }
    : {
        type: 'slider' as const,
        orient: 'vertical' as const,
        yAxisIndex: 0,
        width: bottomSliderHeight,
        left: 10,
        top: 56,
        bottom: gridBottom,
        filterMode: 'filter' as const,
        ...rankRange,
      }

  const valueSlider = valueOnX
    ? {
        type: 'slider' as const,
        xAxisIndex: 0,
        height: bottomSliderHeight,
        bottom: bottomSlider,
        filterMode: 'filter' as const,
        ...valueRange,
      }
    : {
        type: 'slider' as const,
        orient: 'vertical' as const,
        yAxisIndex: 0,
        width: bottomSliderHeight,
        left: 10,
        top: 56,
        bottom: gridBottom + bottomSliderHeight + bottomSlider,
        filterMode: 'filter' as const,
        ...valueRange,
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
    chartType = 'bar',
    logScaleY = false,
    logScaleX = false,
    populationDensity = false,
    probabilityDensity = false,
    lorenzCurve = false,
    valueRange,
    overlayPoints,
    title,
  } = options

  const showPdf = !lorenzCurve && populationDensity && probabilityDensity
  const ordered = [...profile.points].sort((a, b) => a.rank - b.rank)
  const zoomActive = isValueRangeZoomActive(valueRange)
  const chartPoints = zoomActive && valueRange
    ? filterPointsByValueRange(ordered, valueRange)
    : ordered

  const valueAxisName = profile.unit ? `Valeur · ${profile.unit}` : 'Valeur'
  const scales = resolveProfileAxisScales({ logScaleX, logScaleY, populationDensity, showPdf })
  const { rank: rankScale, value: valueScale, density: densityScale } = scales
  const valueOnX = !lorenzCurve && (populationDensity || showPdf)
  const densityAxisName = profile.unit
    ? `Densité de probabilité · 1/${profile.unit}`
    : 'Densité de probabilité'

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
      left: valueOnX ? 72 : 88,
      right: 24,
      top: 56,
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

    if (primaryProfileSeriesType(chartType) === 'bar') {
      const bands = buildPdfBandItems(bins, { valueScale, densityScale })
      const bounds = computePdfBandAxisBounds(bands, { valueScale, densityScale })
      valueScale.applyZoom(xAxis, valueRange ?? {})

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
        },
      ],
    }
  }

  const overlayType = overlaySeriesType(chartType)
  const overlayOrdered = overlayType
    ? [...(overlayPoints ?? chartPoints)].sort((a, b) => a.rank - b.rank)
    : chartPoints

  const bandOptions = { rankScale, valueScale, populationDensity }

  if (chartType === 'bar') {
    const bands = buildRankBandItems(chartPoints, bandOptions)
    const bounds = computeBandAxisBounds(bands, bandOptions)
    const xAxis = populationDensity ? { ...valueAxisConfig } : { ...rankAxisConfig }
    const yAxis = populationDensity ? { ...rankAxisConfig } : { ...valueAxisConfig }

    applyDualAxisZoom(xAxis, yAxis, {
      valueRange,
      rankPoints: chartPoints,
      rankScale,
      valueScale,
      populationDensity,
    })

    return {
      ...base,
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          const p = params as { name?: string, data?: { value?: [number, number, number] } }
          const band = p?.data
          const plotVal = populationDensity ? band?.value?.[0] : band?.value?.[2]
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

  const seriesPoints = overlayType ? overlayOrdered : chartPoints
  const seriesChartPoints = zoomActive && valueRange
    ? filterPointsByValueRange(seriesPoints, valueRange)
    : seriesPoints

  const data = seriesChartPoints
    .map((point) => {
      const rankCoord = rankScale.toPlotCoord(plotRankForPoint(point, profile.kind))
      const valueCoord = point.value === null ? null : valueScale.toPlotCoord(point.value)
      if (rankCoord === null) return null

      if (populationDensity) {
        if (valueCoord === null) return null
        return { point, pair: [valueCoord, rankCoord] as [number, number] }
      }

      return { point, pair: [rankCoord, valueCoord] as [number, number | null] }
    })
    .filter((entry): entry is { point: PercentilePoint, pair: [number, number | null] } => entry !== null)

  const xAxis = populationDensity ? { ...valueAxisConfig } : { ...rankAxisConfig }
  const yAxis = populationDensity ? { ...rankAxisConfig } : { ...valueAxisConfig }
  applyDualAxisZoom(xAxis, yAxis, {
    valueRange,
    rankPoints: seriesPoints,
    rankScale,
    valueScale,
    populationDensity,
  })

  if (overlayType) {
    const bands = buildRankBandItems(chartPoints, bandOptions)
    const bounds = computeBandAxisBounds(bands, bandOptions)
    const overlayDataZoom = buildProfileDataZoom(
      valueOnX,
      bandDataZoomWindow(bounds, populationDensity),
    )

    return {
      ...base,
      dataZoom: overlayDataZoom,
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          const seriesType = (params as { seriesType?: string }).seriesType
          if (seriesType === 'custom') {
            const p = params as { name?: string, data?: { value?: [number, number, number] } }
            const band = p?.data
            const plotVal = populationDensity ? band?.value?.[0] : band?.value?.[2]
            const shown = formatStoredAxisValue(valueScale, plotVal)
            const code = p?.name ? `${p.name}<br/>` : ''
            return `${code}${valueAxisName}: ${shown}`
          }
          const p = params as { value?: [number, number | null], data?: { point?: PercentilePoint } }
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
      series: [
        {
          name: 'Bandes',
          type: 'custom',
          clip: true,
          z: 0,
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
          itemStyle: { color: '#1565C0', opacity: PROFILE_BAND_WATERMARK_OPACITY },
          emphasis: { itemStyle: { opacity: PROFILE_BAND_WATERMARK_OPACITY * 1.6 } },
        },
        {
          name: profile.variable,
          type: overlayType,
          z: 2,
          data: data.map(({ point, pair }) => ({ value: pair, point })),
          showSymbol: overlayType !== 'line',
          symbolSize: overlayType === 'scatter' ? 6 : undefined,
          connectNulls: false,
          lineStyle: overlayType === 'line' ? { width: 2, color: '#1565C0' } : undefined,
          itemStyle: { color: '#1565C0' },
        },
      ],
    }
  }

  const seriesType = chartType === 'line' ? 'line' : 'scatter'

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
        const rankLine = point ? profilePointRankTooltipLine(point, profile.kind) : ''
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
        showSymbol: seriesType !== 'line',
        symbolSize: seriesType === 'scatter' ? 6 : undefined,
        connectNulls: false,
        itemStyle: undefined,
      },
    ],
  }
}
