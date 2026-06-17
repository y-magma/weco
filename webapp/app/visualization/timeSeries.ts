import type { DataSeries } from '@domain/entities'
import type { EChartsOption } from 'echarts'
import { formatCompactAxisValue } from '~/visualization/axisFormat'
import {
  buildChartAxisDataZoom,
  buildChartToolbox,
  CHART_ZOOM_GRID_BOTTOM,
} from '~/visualization/chartZoom'
import {
  stackValueFromAverage,
  type TimeSeriesTranche,
} from '~/visualization/timeSeriesPartition'

const COLORS = ['#1565C0', '#00897B', '#EF6C00', '#6A1B9A']

export interface TimeSeriesChartOptions {
  logScaleY?: boolean
  subtitle?: string
  /** Label de l'axe Y (ex. l'unité de la variable sélectionnée). */
  yAxisLabel?: string
}

function valuesByYear(points: DataSeries['points']): Map<number, number> {
  const byYear = new Map<number, number>()
  for (const point of points) {
    byYear.set(point.year, point.value)
  }
  return byYear
}

export function buildTimeSeriesOption(
  seriesList: DataSeries[],
  title = 'Time series comparison',
  options: TimeSeriesChartOptions = {},
): EChartsOption {
  const { logScaleY = false, subtitle, yAxisLabel } = options
  const years = Array.from(
    new Set(seriesList.flatMap((series) => series.points.map((point) => point.year))),
  ).sort((a, b) => a - b)

  return {
    color: COLORS,
    title: {
      text: title,
      subtext: subtitle,
      left: 'center',
      textStyle: { fontSize: 14 },
      subtextStyle: { fontSize: 11 },
    },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (value) =>
        value === null || value === undefined ? '—' : formatCompactAxisValue(Number(value)),
    },
    legend: {
      show: seriesList.length > 0,
      top: 28,
      type: 'scroll',
    },
    grid: {
      left: 48,
      right: 24,
      top: seriesList.length > 1 ? 88 : 72,
      bottom: CHART_ZOOM_GRID_BOTTOM,
    },
    toolbox: buildChartToolbox(),
    // 'filter' drops points outside the zoom window and breaks multi-country lines with gaps.
    dataZoom: buildChartAxisDataZoom({ filterMode: 'none' }),
    xAxis: {
      type: 'category',
      data: years.map(String),
      name: 'Année',
    },
    yAxis: {
      type: logScaleY ? 'log' : 'value',
      scale: !logScaleY,
      name: yAxisLabel,
      nameLocation: 'middle',
      nameGap: 48,
      nameTextStyle: { fontSize: 11 },
      axisLabel: {
        formatter: (value: number) => formatCompactAxisValue(value),
      },
    },
    series: seriesList.map((series) => {
      const byYear = valuesByYear(series.points)
      return {
        name: series.label,
        type: 'line',
        smooth: false,
        connectNulls: false,
        showSymbol: false,
        data: years.map((year) => {
          const value = byYear.get(year) ?? null
          if (logScaleY && (value === null || value <= 0)) return null
          return value
        }),
      }
    }),
  }
}

export interface CountryTrancheSeries {
  countryCode: string
  countryLabel: string
  tranches: Array<{
    tranche: TimeSeriesTranche
    byYear: Map<number, number>
  }>
}

function collectYears(countries: CountryTrancheSeries[]): number[] {
  const set = new Set<number>()
  for (const country of countries) {
    for (const layer of country.tranches) {
      for (const year of layer.byYear.keys()) set.add(year)
    }
  }
  return [...set].sort((a, b) => a - b)
}

function gridLayout(count: number, index: number): { top: number | string, height?: string, bottom?: number | string } {
  if (count <= 1) {
    return { top: 72, bottom: CHART_ZOOM_GRID_BOTTOM }
  }
  const gap = 8
  const usable = 100 - 14
  const band = (usable - gap * (count - 1)) / count
  const top = 10 + index * (band + gap)
  return { top: `${top}%`, height: `${band}%` }
}

/**
 * Aires empilées par tranche de population (style distribution patrimoniale).
 * Une sous-grille par pays lorsque plusieurs pays sont sélectionnés.
 */
export function buildStackedTimeSeriesOption(
  countries: CountryTrancheSeries[],
  title: string,
  subtitle?: string,
  yAxisLabel?: string,
): EChartsOption {
  if (countries.length === 0) {
    return { title: { text: title, left: 'center' } }
  }

  const years = collectYears(countries)
  const multi = countries.length > 1
  const grids = countries.map((country, index) => {
    const layout = gridLayout(countries.length, index)
    return {
      left: 56,
      right: multi ? 160 : 148,
      top: layout.top,
      height: layout.height,
      bottom: layout.bottom,
      containLabel: false,
    }
  })

  const xAxes = countries.map((country, index) => ({
    type: 'category' as const,
    gridIndex: index,
    data: years.map(String),
    name: index === countries.length - 1 ? 'Année' : undefined,
    axisLabel: { show: index === countries.length - 1 || !multi },
  }))

  const yAxes = countries.map((country, index) => ({
    type: 'value' as const,
    gridIndex: index,
    name: index === 0 ? (yAxisLabel ?? 'Valeur') : undefined,
    nameLocation: 'middle' as const,
    nameGap: 42,
    axisLabel: {
      formatter: (value: number) => formatCompactAxisValue(value),
    },
  }))

  const series = countries.flatMap((country, countryIndex) =>
    country.tranches.map(({ tranche, byYear }) => ({
      name: tranche.label,
      type: 'line' as const,
      stack: country.countryCode,
      xAxisIndex: countryIndex,
      yAxisIndex: countryIndex,
      smooth: true,
      showSymbol: false,
      connectNulls: false,
      itemStyle: { color: tranche.color },
      areaStyle: { opacity: 0.88 },
      emphasis: { focus: 'series' as const },
      data: years.map((year) => stackValueFromAverage(byYear.get(year), tranche.width)),
    })),
  )

  const dataZoom = buildChartAxisDataZoom({ filterMode: 'none' }).map((zoom) => ({
    ...zoom,
    xAxisIndex: countries.map((_, index) => index),
  }))

  return {
    title: {
      text: title,
      subtext: subtitle,
      left: 'center',
      textStyle: { fontSize: 15, fontWeight: 600 },
      subtextStyle: { fontSize: 11 },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      valueFormatter: (value) =>
        value === null || value === undefined ? '—' : formatCompactAxisValue(Number(value)),
    },
    legend: {
      show: true,
      orient: 'vertical',
      right: 8,
      top: multi ? 'middle' : 88,
      type: 'scroll',
      itemWidth: 14,
      itemHeight: 10,
      textStyle: { fontSize: 11 },
    },
    grid: grids,
    xAxis: xAxes,
    yAxis: yAxes,
    toolbox: buildChartToolbox(),
    dataZoom,
    series,
  }
}
