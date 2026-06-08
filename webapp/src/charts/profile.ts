import type { EChartsOption } from 'echarts'
import type { PercentileProfile } from '@src/domain/types'

export type ProfileXScale = 'category' | 'tail'

export interface ProfileChartOptions {
  /** Visual encoding of the profile. */
  chartType?: 'bar' | 'scatter' | 'line'
  /** Log scale on the value (Y) axis. Non-positive values are dropped. */
  logScaleY?: boolean
  /**
   * X-axis mode:
   * - `category` : the 127 percentile codes as ordered categories;
   * - `tail`     : numeric "high-tail" coordinate log₁₀(1/(1−p)) that spreads
   *                out the top of the distribution (version1.md, graphe #4).
   */
  xScale?: ProfileXScale
  title?: string
}

/**
 * High-tail X coordinate log₁₀(1/(1−p)) for a percentile rank in percent.
 * p = rank/100. Returns null when p ≥ 1 (no finite coordinate).
 * Examples: rank 0 → 0, rank 90 → 1, rank 99 → 2, rank 99.9 → 3.
 */
export function tailCoordinate(rank: number): number | null {
  if (!Number.isFinite(rank)) return null
  const p = rank / 100
  if (p >= 1) return null
  return Math.log10(1 / (1 - p))
}

/**
 * Profil moyen / seuil : abscisse = 127 g-percentiles ordonnés par rang,
 * ordonnée = `value`. See spec/version1.md (graphes #2 et #4) and C1/C3.
 *
 * The Y axis can switch to log; non-positive values (e.g. net debt at the
 * bottom of the wealth distribution) are turned into gaps so a log axis cannot
 * break (version1.md point 3). The X axis can switch from ordered categories to
 * the high-tail coordinate log₁₀(1/(1−p)) to zoom into the top percentiles.
 */
export function buildProfileOption(
  profile: PercentileProfile,
  options: ProfileChartOptions = {},
): EChartsOption {
  const { chartType = 'bar', logScaleY = false, xScale = 'category', title } = options
  const ordered = [...profile.points].sort((a, b) => a.rank - b.rank)

  const valueAxisName = profile.unit ? `Valeur (${profile.unit})` : 'Valeur'
  const seriesType = chartType === 'line' ? 'line' : chartType === 'scatter' ? 'scatter' : 'bar'

  const cleanValue = (value: number | null): number | null => {
    if (value === null || Number.isNaN(value)) return null
    if (logScaleY && value <= 0) return null
    return value
  }

  const yAxis = {
    type: logScaleY ? ('log' as const) : ('value' as const),
    name: valueAxisName,
    scale: true,
  }

  const base: EChartsOption = {
    title: { text: title ?? profile.label, left: 'center', textStyle: { fontSize: 14 } },
    grid: { left: 72, right: 24, top: 56, bottom: 72 },
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
      { type: 'slider', start: 0, end: 100, height: 18, bottom: 16 },
    ],
    yAxis,
  }

  if (xScale === 'tail') {
    // Numeric X axis: each point is [log₁₀(1/(1−p)), value].
    const data = ordered
      .map((point) => {
        const x = tailCoordinate(point.rank)
        const y = cleanValue(point.value)
        return x === null ? null : [x, y]
      })
      .filter((pair): pair is [number, number | null] => pair !== null)

    return {
      ...base,
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          const p = params as { value?: [number, number | null] }
          const pair = p?.value
          const shown = pair?.[1] === null || pair?.[1] === undefined
            ? '—'
            : pair[1].toLocaleString('fr-FR')
          return `log₁₀(1/(1−p)): ${pair?.[0]?.toFixed?.(3) ?? ''}<br/>${valueAxisName}: ${shown}`
        },
      },
      xAxis: {
        type: 'value',
        name: 'Queue haute — log₁₀(1/(1−p))',
        nameLocation: 'middle',
        nameGap: 32,
        scale: true,
      },
      series: [
        {
          name: profile.variable,
          type: seriesType,
          data,
          showSymbol: chartType !== 'line',
          symbolSize: chartType === 'scatter' ? 6 : undefined,
          connectNulls: false,
        },
      ],
    }
  }

  // Categorical X axis: one category per ordered percentile code.
  return {
    ...base,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const list = Array.isArray(params) ? params : [params]
        const first = list[0] as { name?: string, value?: number | null }
        const raw = first?.value
        const shown = raw === null || raw === undefined ? '—' : raw.toLocaleString('fr-FR')
        return `${first?.name ?? ''}<br/>${valueAxisName}: ${shown}`
      },
    },
    xAxis: {
      type: 'category',
      data: ordered.map((point) => point.percentile),
      name: 'Percentile (rang croissant)',
      nameLocation: 'middle',
      nameGap: 32,
      axisLabel: { interval: 'auto', hideOverlap: true },
    },
    series: [
      {
        name: profile.variable,
        type: seriesType,
        data: ordered.map((point) => cleanValue(point.value)),
        showSymbol: chartType !== 'line',
        symbolSize: chartType === 'scatter' ? 6 : undefined,
        connectNulls: false,
        itemStyle: seriesType === 'bar' ? { borderRadius: [2, 2, 0, 0] } : undefined,
      },
    ],
  }
}
