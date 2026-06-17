import type {
  CustomSeriesRenderItemAPI,
  CustomSeriesRenderItemParams,
  EChartsOption,
} from 'echarts'
import type { PercentilePoint, PercentileProfile } from '@domain/entities'
import {
  buildEchartsAxis,
  formatStoredAxisValue,
  resolveProfileAxisScales,
} from '~/visualization/axisScale'
import { formatCompactAxisValue } from '~/visualization/axisFormat'
import { buildChartToolbox } from '~/visualization/chartZoom'
import { buildPartitionPoints } from '~/visualization/populationPartition'
import {
  buildProfileDataZoom,
  buildRankBandItems,
  createRenderRankBand,
  plotRankForPoint,
  PROFILE_BAND_WATERMARK_OPACITY,
  PROFILE_CHART_LAYOUT,
  type RankBandItem,
} from '~/visualization/profile'
import type { MeanPreservingApproximation, TrapezoidPolygon } from '~/visualization/trapezoidApproximation'

const ORIGINAL_COLOR = '#1565C0'
const APPROX_COLOR = '#C62828'
const TRAPEZOID_FILL = 'rgba(198, 40, 40, 0.22)'
const TRAPEZOID_STROKE = '#C62828'
const WATERMARK_COLOR = '#1565C0'

const TRAPEZOID_SCALES = {
  logScaleX: false,
  logScaleY: false,
  populationDensity: false,
  showPdf: false,
} as const

export interface TrapezoidChartOptions {
  title?: string
  subtitle?: string
  yAxisLabel?: string
  baseline?: number
  displayPoints?: PercentilePoint[]
  trapezoidBreakpoints?: number[]
  showWatermarkBands?: boolean
  showTrapezoids?: boolean
  rankExtentEnd?: number
  approximationNodes?: { x: number, y: number }[]
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
  rankScale: ReturnType<typeof resolveProfileAxisScales>['rank'],
  valueScale: ReturnType<typeof resolveProfileAxisScales>['value'],
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
  rankScale: ReturnType<typeof resolveProfileAxisScales>['rank'],
  valueScale: ReturnType<typeof resolveProfileAxisScales>['value'],
) {
  return nodes.flatMap((node) => {
    const rankCoord = rankScale.toPlotCoord(node.x)
    const valueCoord = valueScale.toPlotCoord(node.y)
    if (rankCoord === null || valueCoord === null) return []
    return [{ value: [rankCoord, valueCoord] as [number, number], node }]
  })
}

function trapezoidSeriesData(
  nodes: MeanPreservingApproximation['nodes'],
  rankScale: ReturnType<typeof resolveProfileAxisScales>['rank'],
  valueScale: ReturnType<typeof resolveProfileAxisScales>['value'],
) {
  return nodes.slice(1).flatMap((node, index) => {
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

function buildTrapezoidContext(profile: PercentileProfile, options: TrapezoidChartOptions) {
  const displayPoints = options.displayPoints ?? profile.points
  const rankExtentEnd = options.rankExtentEnd ?? 100
  const baseline = options.baseline ?? 0
  const trapezoidBreakpoints = options.trapezoidBreakpoints ?? []
  const showHistogram = options.showWatermarkBands === true && trapezoidBreakpoints.length > 0

  const { rank: rankScale, value: valueScale } = resolveProfileAxisScales(TRAPEZOID_SCALES)
  const valueAxisName = options.yAxisLabel ?? (profile.unit ? `Valeur · ${profile.unit}` : 'Valeur')

  const rankAxisConfig = buildEchartsAxis('Part de population (%)', rankScale, { nameGap: 32 })
  rankScale.applyRankExtent(rankAxisConfig, { rankLo: 0, rankHi: rankExtentEnd })
  rankAxisConfig.min = 0
  rankAxisConfig.max = rankExtentEnd

  // L'axe des valeurs reste auto-ajusté (scale: true) : comme le panneau profil,
  // ECharts recadre Y sur les séries visibles à chaque zoom (filterMode).
  const valueAxisConfig = buildEchartsAxis(valueAxisName, valueScale)

  const bandOptions = { rankScale, valueScale, populationDensity: false as const }
  const histogramBands: RankBandItem[] = showHistogram
    ? buildRankBandItems(buildPartitionPoints(profile.points, trapezoidBreakpoints), bandOptions)
    : []

  return {
    displayPoints,
    rankScale,
    valueScale,
    rankAxisConfig,
    valueAxisConfig,
    valueAxisName,
    histogramBands,
    dataZoom: buildProfileDataZoom(false),
    baseline,
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
      left: 88,
      right: 24,
      top: 72,
      bottom: PROFILE_CHART_LAYOUT.gridBottom,
    },
    toolbox: buildChartToolbox(),
    dataZoom,
  }
}

function trapezoidTooltip(
  valueAxisName: string,
  valueScale: ReturnType<typeof resolveProfileAxisScales>['value'],
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
        `Nœuds : ${formatCompactAxisValue(yLo)} → ${formatCompactAxisValue(yHi)}`,
        `Moyenne : ${formatCompactAxisValue((yLo + yHi) / 2)}`,
      ].join('<br/>')
    }
    if (p.seriesName === 'Approximation' && p.data?.node) {
      return [
        `Rang : ${p.data.node.x} %`,
        `${valueAxisName} : ${formatCompactAxisValue(p.data.node.y)}`,
      ].join('<br/>')
    }
    const point = p.data?.point
    if (point) {
      return [
        point.percentile,
        `${valueAxisName} : ${point.value?.toLocaleString('fr-FR') ?? '—'}`,
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
  return {
    ...chartShell(profile, options, ['Courbe d\'origine'], ctx.dataZoom),
    tooltip: { trigger: 'item', formatter: trapezoidTooltip(ctx.valueAxisName, ctx.valueScale) },
    xAxis: ctx.rankAxisConfig,
    yAxis: ctx.valueAxisConfig,
    series: [{
      name: 'Courbe d\'origine',
      type: 'line',
      data: lineSeriesData(ctx.displayPoints, profile.kind, ctx.rankScale, ctx.valueScale),
      showSymbol: ctx.displayPoints.length <= 120,
      symbolSize: 4,
      lineStyle: { width: 1.5, color: ORIGINAL_COLOR },
      itemStyle: { color: ORIGINAL_COLOR },
      z: 1,
    }],
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

  const plotBaseline = ctx.valueScale.toPlotCoord(ctx.baseline) ?? 0

  const histogram = histogramSeries(ctx.histogramBands, plotBaseline)
  const showTrapezoids = options.showTrapezoids !== false
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
      {
        name: 'Courbe d\'origine',
        type: 'line',
        data: lineSeriesData(ctx.displayPoints, profile.kind, ctx.rankScale, ctx.valueScale),
        showSymbol: ctx.displayPoints.length <= 120,
        symbolSize: 4,
        lineStyle: { width: 1.5, color: ORIGINAL_COLOR },
        itemStyle: { color: ORIGINAL_COLOR },
        z: 1,
      },
      ...(showTrapezoids ? [{
        name: 'Trapèzes',
        type: 'custom' as const,
        clip: true,
        renderItem: renderTrapezoid(plotBaseline),
        data: trapezoidSeriesData(approximation.nodes, ctx.rankScale, ctx.valueScale),
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
        data: approxLineData(approximation.nodes, ctx.rankScale, ctx.valueScale),
        showSymbol: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 2.5, color: APPROX_COLOR },
        itemStyle: { color: APPROX_COLOR, borderColor: '#fff', borderWidth: 1 },
        z: 3,
      }] : []),
    ],
  }
}
