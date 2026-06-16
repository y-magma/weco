import type { DataSeries } from '@domain/entities'
import type { EChartsOption } from 'echarts'
import { formatCompactAxisValue } from '~/visualization/axisFormat'
import {
  buildChartAxisDataZoom,
  buildChartToolbox,
  CHART_ZOOM_GRID_BOTTOM,
} from '~/visualization/chartZoom'

const COLORS = ['#1565C0', '#00897B', '#EF6C00', '#6A1B9A']

export interface TimeSeriesChartOptions {
  logScaleY?: boolean
}

export function buildTimeSeriesOption(
  seriesList: DataSeries[],
  title = 'Time series comparison',
  options: TimeSeriesChartOptions = {},
): EChartsOption {
  const { logScaleY = false } = options
  const years = Array.from(
    new Set(seriesList.flatMap((series) => series.points.map((point) => point.year))),
  ).sort((a, b) => a - b)

  return {
    color: COLORS,
    title: { text: title, left: 'center', textStyle: { fontSize: 14 } },
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
    dataZoom: buildChartAxisDataZoom(),
    xAxis: {
      type: 'category',
      data: years.map(String),
      name: 'Année',
    },
    yAxis: {
      type: logScaleY ? 'log' : 'value',
      scale: !logScaleY,
      axisLabel: {
        formatter: (value: number) => formatCompactAxisValue(value),
      },
    },
    series: seriesList.map((series) => ({
      name: series.label,
      type: 'line',
      smooth: true,
      showSymbol: false,
      data: years.map((year) => {
        const point = series.points.find((item) => item.year === year)
        const value = point?.value ?? null
        if (logScaleY && (value === null || value <= 0)) return null
        return value
      }),
    })),
  }
}
