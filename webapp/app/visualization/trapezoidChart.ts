import type {
  CustomSeriesRenderItemAPI,
  CustomSeriesRenderItemParams,
  EChartsOption,
} from 'echarts'
import type { PercentilePoint, PercentileProfile } from '@domain/entities'
import { measureKind, type MeasureKind } from '@domain/catalog/widCodes'
import {
  buildEchartsAxis,
  formatStoredAxisValue,
  linearRankScale,
  mergeLogValueAxisExtent,
  rankTopLogScale,
  resolveValueScaleForMeasure,
  strictLogRankScale,
  type AxisScaleBounds,
  type RankAxisScale,
} from '~/visualization/axisScale'
import { buildChartToolbox } from '~/visualization/chartZoom'
import { buildPartitionPoints } from '~/visualization/populationPartition'
import {
  buildProfileDataZoom,
  buildRankBandItems,
  computeBandAxisBounds,
  createRenderRankBand,
  createRenderRankStick,
  plotRankForPoint,
  PROFILE_BAND_WATERMARK_OPACITY,
  PROFILE_CHART_LAYOUT,
  type ProfileChartLayer,
  type RankBandItem,
} from '~/visualization/profile'
import type { MeanPreservingApproximation, TrapezoidPolygon } from '~/visualization/trapezoidApproximation'

const ORIGINAL_COLOR = '#1565C0'
const APPROX_COLOR = '#C62828'
const TRAPEZOID_FILL = 'rgba(198, 40, 40, 0.22)'
const TRAPEZOID_STROKE = '#C62828'
const WATERMARK_COLOR = '#1565C0'

export interface TrapezoidChartOptions {
  /** Espacement −log₁₀(100 − rang) : zoom sur la queue des plus riches. */
  logRichZoom?: boolean
  /** Échelle log native sur le rang (abscisse) ; rang ≤ 0 masqué. */
  logScaleX?: boolean
  logScaleY?: boolean
  title?: string
  subtitle?: string
  yAxisLabel?: string
  baseline?: number
  displayPoints?: PercentilePoint[]
  /** Géométrie de la courbe d'origine (avant / sous les approximations). */
  originalViewMode?: ProfileChartLayer
  trapezoidBreakpoints?: number[]
  showWatermarkBands?: boolean
  showTrapezoids?: boolean
  rankExtentStart?: number
  rankExtentEnd?: number
  approximationNodes?: { x: number, y: number }[]
  /** Indices d'intervalles masqués sur le graphique (trapèzes, histogrammes, approximation). */
  hiddenIntervalIndices?: ReadonlySet<number>
}

function isIntervalHidden(index: number, hidden?: ReadonlySet<number>): boolean {
  return hidden?.has(index) ?? false
}

function renderTrapezoid(baseline: number) {
  return function renderItem(
    params: CustomSeriesRenderItemParams,
    api: CustomSeriesRenderItemAPI,
  ) {
    const xLo = api.value(0) as number
    const xHi = api.value(1) as number
    const yLo = api.value(2) as number
    const yHi = api.value(3) as number
    if (![xLo, xHi, yLo, yHi].every(Number.isFinite)) return null

    const topLeft = api.coord([xLo, yLo])
    const topRight = api.coord([xHi, yHi])
    const baseLeft = api.coord([xLo, baseline])
    const baseRight = api.coord([xHi, baseline])

    return {
      type: 'polygon' as const,
      shape: { points: [topLeft, topRight, baseRight, baseLeft] },
      style: api.style(),
    }
  }
}

function lineSeriesData(
  points: PercentilePoint[],
  kind: PercentileProfile['kind'],
  rankScale: RankAxisScale,
  valueScale: ReturnType<typeof resolveTrapezoidAxisScales>['value'],
) {
  return points
    .map((point) => {
      if (point.value === null || !Number.isFinite(point.value)) return null
      const rankCoord = rankScale.toPlotCoord(plotRankForPoint(point, kind))
      const valueCoord = valueScale.toPlotCoord(point.value)
      if (rankCoord === null || valueCoord === null) return null
      return { value: [rankCoord, valueCoord] as [number, number], point }
    })
    .filter((entry): entry is { value: [number, number], point: PercentilePoint } => entry !== null)
}

function approxLineData(
  nodes: MeanPreservingApproximation['nodes'],
  rankScale: RankAxisScale,
  valueScale: ReturnType<typeof resolveTrapezoidAxisScales>['value'],
  hidden?: ReadonlySet<number>,
) {
  const data: Array<{ value: [number, number], node: { x: number, y: number } } | null> = []

  for (let i = 0; i < nodes.length - 1; i += 1) {
    if (isIntervalHidden(i, hidden)) continue
    if (data.length > 0) data.push(null)

    for (const node of [nodes[i]!, nodes[i + 1]!]) {
      const rankCoord = rankScale.toPlotCoord(node.x)
      const valueCoord = valueScale.toPlotCoord(node.y)
      if (rankCoord === null || valueCoord === null) continue
      data.push({ value: [rankCoord, valueCoord] as [number, number], node })
    }
  }

  return data
}

function trapezoidSeriesData(
  nodes: MeanPreservingApproximation['nodes'],
  rankScale: RankAxisScale,
  valueScale: ReturnType<typeof resolveTrapezoidAxisScales>['value'],
  hidden?: ReadonlySet<number>,
) {
  return nodes.slice(1).flatMap((node, index) => {
    if (isIntervalHidden(index, hidden)) return []
    const prev = nodes[index]!
    const xLo = rankScale.toPlotCoord(prev.x)
    const xHi = rankScale.toPlotCoord(node.x)
    const yLo = valueScale.toPlotCoord(prev.y)
    const yHi = valueScale.toPlotCoord(node.y)
    if ([xLo, xHi, yLo, yHi].some((v) => v === null)) return []
    return [{
      value: [xLo!, xHi!, yLo!, yHi!] as [number, number, number, number],
      poly: { lo: prev.x, hi: node.x, yLo: prev.y, yHi: node.y } satisfies TrapezoidPolygon,
    }]
  })
}

function resolveTrapezoidAxisScales(
  logRichZoom: boolean,
  logScaleX: boolean,
  logScaleY: boolean,
  variableKind: MeasureKind = 'average',
) {
  const rank = logScaleX
    ? strictLogRankScale
    : logRichZoom
      ? rankTopLogScale
      : linearRankScale
  return {
    rank,
    value: resolveValueScaleForMeasure(variableKind, logScaleY),
  }
}

function collectPositiveRanks(
  profile: PercentileProfile,
  displayPoints: PercentilePoint[],
  kind: PercentileProfile['kind'],
  approximationNodes?: { x: number, y: number }[],
): number[] {
  const values: number[] = []
  const addRank = (rank: number) => {
    if (Number.isFinite(rank) && rank > 0) values.push(rank)
  }
  for (const point of displayPoints) {
    addRank(plotRankForPoint(point, kind))
  }
  for (const point of profile.points) {
    addRank(plotRankForPoint(point, kind))
  }
  for (const node of approximationNodes ?? []) {
    addRank(node.x)
  }
  return values
}

function collectPositiveYValues(
  profile: PercentileProfile,
  displayPoints: PercentilePoint[],
  approximationNodes?: { x: number, y: number }[],
): number[] {
  const values: number[] = []
  for (const point of displayPoints) {
    if (point.value !== null && point.value > 0) values.push(point.value)
  }
  for (const point of profile.points) {
    if (point.value !== null && point.value > 0) values.push(point.value)
  }
  for (const node of approximationNodes ?? []) {
    if (node.y > 0) values.push(node.y)
  }
  return values
}

function buildTrapezoidContext(profile: PercentileProfile, options: TrapezoidChartOptions) {
  const displayPoints = options.displayPoints ?? profile.points
  const rankExtentStart = options.rankExtentStart ?? 0
  const rankExtentEnd = options.rankExtentEnd ?? 100
  const baseline = options.baseline ?? 0
  const trapezoidBreakpoints = options.trapezoidBreakpoints ?? []
  const showHistogram = options.showWatermarkBands === true && trapezoidBreakpoints.length > 0
  const logRichZoom = options.logRichZoom === true
  const logScaleX = options.logScaleX === true
  const logScaleY = options.logScaleY === true

  const { rank: rankScale, value: valueScale } = resolveTrapezoidAxisScales(
    logRichZoom,
    logScaleX,
    logScaleY,
    measureKind(profile.variable),
  )
  const valueAxisName = options.yAxisLabel ?? (profile.unit ? `Valeur · ${profile.unit}` : 'Valeur')

  const rankAxisConfig = buildEchartsAxis('Part de population (%)', rankScale, { nameGap: 32 })
  if (logScaleX) {
    const positiveRanks = collectPositiveRanks(
      profile,
      displayPoints,
      profile.kind,
      options.approximationNodes,
    )
    if (positiveRanks.length > 0) {
      const bounds = rankScale.axisBounds(Math.min(...positiveRanks), Math.max(...positiveRanks))
      rankAxisConfig.min = bounds.min
      rankAxisConfig.max = bounds.max
    }
  } else if (logRichZoom) {
    rankScale.applyRankExtent(rankAxisConfig, { rankLo: rankExtentStart, rankHi: rankExtentEnd })
  } else {
    rankAxisConfig.min = rankExtentStart
    rankAxisConfig.max = rankExtentEnd
  }

  const valueAxisConfig = buildEchartsAxis(valueAxisName, valueScale)
  // Always include 0 (the trapezoid baseline) in the Y axis range.
  if (!logScaleY) valueAxisConfig.scale = false

  const bandOptions = { rankScale, valueScale, empiricalCdf: false as const }
  const hidden = options.hiddenIntervalIndices
  const partitionPoints = buildPartitionPoints(profile.points, trapezoidBreakpoints)
    .filter((_, index) => !isIntervalHidden(index, hidden))
  const histogramBands: RankBandItem[] = showHistogram
    ? buildRankBandItems(partitionPoints, bandOptions)
    : []

  const bandBounds = computeBandAxisBounds(histogramBands, bandOptions)
  let logYExtent: AxisScaleBounds | null = null
  if (logScaleY) {
    const positiveValues = collectPositiveYValues(profile, displayPoints, options.approximationNodes)
    if (positiveValues.length > 0 || histogramBands.length > 0) {
      logYExtent = mergeLogValueAxisExtent(
        valueScale,
        positiveValues,
        histogramBands.length > 0 ? bandBounds : null,
      )
      valueAxisConfig.min = logYExtent.min
      valueAxisConfig.max = logYExtent.max
    }
  }

  const plotBaseline = logScaleY
    ? (logYExtent?.base ?? 1e-6)
    : (valueScale.toPlotCoord(baseline) ?? 0)

  return {
    displayPoints,
    rankScale,
    valueScale,
    rankAxisConfig,
    valueAxisConfig,
    valueAxisName,
    histogramBands,
    dataZoom: buildProfileDataZoom(false, undefined, {
      valueFilterMode: logScaleY ? 'none' : 'filter',
      rankFilterMode: logScaleX ? 'none' : 'filter',
      gridTop: 72,
    }),
    baseline,
    plotBaseline,
    logRichZoom,
    logScaleX,
    logScaleY,
  }
}

function originalProfileSeries(
  profile: PercentileProfile,
  ctx: ReturnType<typeof buildTrapezoidContext>,
  mode: ProfileChartLayer = 'line',
) {
  if (mode === 'bar') {
    const data = lineSeriesData(ctx.displayPoints, profile.kind, ctx.rankScale, ctx.valueScale)
    if (data.length === 0) return null
    return {
      name: 'Courbe d\'origine',
      type: 'custom' as const,
      clip: true,
      z: 1,
      renderItem: createRenderRankStick(ctx.plotBaseline),
      data: data.map(({ value, point }) => ({ value, point })),
      encode: { x: 0, y: 1 },
      itemStyle: { color: ORIGINAL_COLOR, opacity: 0.9 },
    }
  }

  const seriesType = mode === 'scatter' ? 'scatter' : 'line'
  return {
    name: 'Courbe d\'origine',
    type: seriesType,
    data: lineSeriesData(ctx.displayPoints, profile.kind, ctx.rankScale, ctx.valueScale),
    showSymbol: mode === 'scatter' || ctx.displayPoints.length <= 120,
    symbolSize: mode === 'scatter' ? 6 : 4,
    connectNulls: false,
    lineStyle: mode === 'line' ? { width: 1.5, color: ORIGINAL_COLOR } : undefined,
    itemStyle: { color: ORIGINAL_COLOR },
    z: 1,
  }
}

function histogramSeries(bands: RankBandItem[], yBase: number) {
  if (bands.length === 0) return null
  return {
    name: 'Histogrammes',
    type: 'custom' as const,
    clip: true,
    z: 0,
    renderItem: createRenderRankBand(yBase),
    data: bands.map((band) => ({
      name: band.name,
      value: band.value,
      i: band.i,
      k: band.k,
    })),
    encode: { x: [0, 1], y: 2 },
    itemStyle: { color: WATERMARK_COLOR, opacity: PROFILE_BAND_WATERMARK_OPACITY },
    emphasis: { itemStyle: { opacity: PROFILE_BAND_WATERMARK_OPACITY * 1.6 } },
  }
}

function chartShell(
  profile: PercentileProfile,
  options: TrapezoidChartOptions,
  legendItems: string[],
  dataZoom: ReturnType<typeof buildProfileDataZoom>,
) {
  return {
    color: [ORIGINAL_COLOR, APPROX_COLOR],
    title: {
      text: options.title ?? profile.label,
      subtext: options.subtitle,
      left: 'center' as const,
      textStyle: { fontSize: 14 },
      subtextStyle: { fontSize: 11 },
    },
    legend: { show: legendItems.length > 1, top: 28, data: legendItems },
    grid: {
      left: 64,
      right: PROFILE_CHART_LAYOUT.gridRight,
      top: 72,
      bottom: PROFILE_CHART_LAYOUT.gridBottom,
    },
    toolbox: buildChartToolbox(),
    dataZoom,
  }
}

function trapezoidTooltip(
  valueAxisName: string,
  valueScale: ReturnType<typeof resolveTrapezoidAxisScales>['value'],
) {
  return (params: unknown) => {
    const p = params as {
      seriesName?: string
      name?: string
      data?: {
        point?: PercentilePoint
        node?: { x: number, y: number }
        poly?: TrapezoidPolygon
        value?: [number, number, number]
      }
    }
    if (p.seriesName === 'Histogrammes') {
      const plotVal = p.data?.value?.[2]
      const shown = formatStoredAxisValue(valueScale, plotVal)
      const code = p.name ? `${p.name}<br/>` : ''
      return `${code}${valueAxisName} : ${shown}`
    }
    if (p.seriesName === 'Trapèzes' && p.data?.poly) {
      const { lo, hi, yLo, yHi } = p.data.poly
      return [
        `Intervalle : ${lo} → ${hi} %`,
        `Nœuds : ${valueScale.formatTick(yLo)} → ${valueScale.formatTick(yHi)}`,
        `Moyenne : ${valueScale.formatTick((yLo + yHi) / 2)}`,
      ].join('<br/>')
    }
    if (p.seriesName === 'Approximation' && p.data?.node) {
      return [
        `Rang : ${p.data.node.x} %`,
        `${valueAxisName} : ${valueScale.formatTick(p.data.node.y)}`,
      ].join('<br/>')
    }
    const point = p.data?.point
    if (point) {
      const shown = point.value === null || !Number.isFinite(point.value)
        ? '—'
        : valueScale.formatTick(valueScale.toPlotCoord(point.value) ?? point.value)
      return [
        point.percentile,
        `${valueAxisName} : ${shown}`,
      ].join('<br/>')
    }
    return ''
  }
}

export function buildOriginalProfileOption(
  profile: PercentileProfile,
  options: TrapezoidChartOptions = {},
): EChartsOption {
  const ctx = buildTrapezoidContext(profile, options)
  const originalSeries = originalProfileSeries(profile, ctx, options.originalViewMode ?? 'line')
  return {
    ...chartShell(profile, options, ['Courbe d\'origine'], ctx.dataZoom),
    tooltip: { trigger: 'item', formatter: trapezoidTooltip(ctx.valueAxisName, ctx.valueScale) },
    xAxis: ctx.rankAxisConfig,
    yAxis: ctx.valueAxisConfig,
    series: originalSeries ? [originalSeries] : [],
  }
}

export function buildTrapezoidProfileOption(
  profile: PercentileProfile,
  approximation: MeanPreservingApproximation,
  options: TrapezoidChartOptions = {},
): EChartsOption {
  const ctx = buildTrapezoidContext(profile, {
    ...options,
    approximationNodes: approximation.nodes,
  })

  const histogram = histogramSeries(ctx.histogramBands, ctx.plotBaseline)
  const showTrapezoids = options.showTrapezoids !== false
  const hidden = options.hiddenIntervalIndices
  const originalSeries = originalProfileSeries(profile, ctx, options.originalViewMode ?? 'line')
  const legendItems = ['Courbe d\'origine']
  if (histogram) legendItems.push('Histogrammes')
  if (showTrapezoids) legendItems.push('Trapèzes', 'Approximation')

  return {
    ...chartShell(profile, options, legendItems, ctx.dataZoom),
    tooltip: { trigger: 'item', formatter: trapezoidTooltip(ctx.valueAxisName, ctx.valueScale) },
    xAxis: ctx.rankAxisConfig,
    yAxis: ctx.valueAxisConfig,
    series: [
      ...(histogram ? [histogram] : []),
      ...(originalSeries ? [originalSeries] : []),
      ...(showTrapezoids ? [{
        name: 'Trapèzes',
        type: 'custom' as const,
        clip: true,
        renderItem: renderTrapezoid(ctx.plotBaseline),
        data: trapezoidSeriesData(approximation.nodes, ctx.rankScale, ctx.valueScale, hidden),
        encode: { x: [0, 1], y: [2, 3] },
        itemStyle: {
          color: TRAPEZOID_FILL,
          borderColor: TRAPEZOID_STROKE,
          borderWidth: 1,
        },
        z: 2,
      }, {
        name: 'Approximation',
        type: 'line' as const,
        data: approxLineData(approximation.nodes, ctx.rankScale, ctx.valueScale, hidden),
        showSymbol: true,
        symbol: 'circle',
        symbolSize: 8,
        connectNulls: false,
        lineStyle: { width: 2.5, color: APPROX_COLOR },
        itemStyle: { color: APPROX_COLOR, borderColor: '#fff', borderWidth: 1 },
        z: 3,
      }] : []),
    ],
  }
}
