import type { EChartsOption } from 'echarts'
import type { PercentilePoint, PercentileProfile } from '@src/domain/types'

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
  title?: string
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
  const rank = rankFromDisplayCoordinate(displayValue)
  if (!Number.isFinite(rank) || rank < 0 || rank >= 100) return ''
  return `${formatRankPercent(rank)} %`
}

function rankCoordinate(rank: number, logRank: boolean): number | null {
  if (!Number.isFinite(rank)) return null
  if (logRank) return rankDisplayCoordinate(rank)
  return rank
}

function buildRankAxis(logRank: boolean) {
  return {
    type: 'value' as const,
    name: 'Part de population (%)',
    nameLocation: 'middle' as const,
    nameGap: 32,
    scale: logRank,
    min: logRank ? rankDisplayCoordinate(0)! : 0,
    max: logRank ? undefined : 100,
    axisLabel: logRank
      ? { formatter: (value: number) => formatRankAxisLabel(value) }
      : { formatter: (value: number) => `${formatRankPercent(value)} %` },
  }
}

function buildValueAxis(valueAxisName: string, logValue: boolean) {
  return {
    type: logValue ? ('log' as const) : ('value' as const),
    name: valueAxisName,
    scale: true,
  }
}

function buildDensityAxis(unit: string | undefined, logDensity: boolean) {
  const unitSuffix = unit ? ` · 1/${unit}` : ''
  return {
    type: logDensity ? ('log' as const) : ('value' as const),
    name: `Densité de probabilité${unitSuffix}`,
    scale: true,
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
    title,
  } = options

  const showPdf = populationDensity && probabilityDensity
  const ordered = [...profile.points].sort((a, b) => a.rank - b.rank)

  const valueAxisName = profile.unit ? `Valeur (${profile.unit})` : 'Valeur'
  const logOnRank = populationDensity && !showPdf ? logScaleY : false
  const logOnValue = populationDensity ? logScaleX : logScaleY
  const logOnDensity = showPdf ? logScaleY : false

  const base = {
    title: { text: title ?? profile.label, left: 'center', textStyle: { fontSize: 14 } },
    grid: { left: 72, right: 24, top: 56, bottom: 72 },
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
      { type: 'slider', start: 0, end: 100, height: 18, bottom: 16 },
    ],
  }

  if (showPdf) {
    const bins = computePdfBins(ordered, { logOnValue })
    const seriesType = chartType === 'scatter' ? 'scatter' : chartType === 'bar' ? 'bar' : 'line'
    const xAxis = buildValueAxis(valueAxisName, logOnValue)
    const yAxis = buildDensityAxis(profile.unit, logOnDensity)

    const data = bins
      .map((bin) => {
        const density = cleanDensity(bin.density, logOnDensity)
        if (density === null) return null

        const x = seriesType === 'bar' ? bin.midpoint : bin.valueLo
        return { bin, pair: [x, density] as [number, number] }
      })
      .filter((entry): entry is { bin: PdfBin, pair: [number, number] } => entry !== null)

    return {
      ...base,
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          const p = params as { value?: [number, number], data?: { bin?: PdfBin } }
          const bin = p?.data?.bin
          if (!bin) return ''
          return [
            `${bin.percentileLo} → ${bin.percentileHi}`,
            `Richesse: ${bin.valueLo.toLocaleString('fr-FR')} – ${bin.valueHi.toLocaleString('fr-FR')}`,
            `Population: ${formatRankPercent(bin.rankLo)} % → ${formatRankPercent(bin.rankHi)} %`,
            `Densité: ${bin.density.toExponential(3)}`,
          ].join('<br/>')
        },
      },
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
          itemStyle: seriesType === 'bar' ? { borderRadius: [2, 2, 0, 0] } : undefined,
        },
      ],
    }
  }

  const seriesType = chartType === 'line' ? 'line' : chartType === 'scatter' ? 'scatter' : 'bar'

  const data = ordered
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
