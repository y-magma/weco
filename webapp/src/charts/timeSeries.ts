import type { DataSeries } from '@src/domain/types'
import type { EChartsOption } from 'echarts'

const COLORS = ['#1565C0', '#00897B', '#EF6C00', '#6A1B9A']

export function buildTimeSeriesOption(
  seriesList: DataSeries[],
  title = 'Time series comparison',
): EChartsOption {
  const years = Array.from(
    new Set(seriesList.flatMap((series) => series.points.map((point) => point.year))),
  ).sort((a, b) => a - b)

  return {
    color: COLORS,
    title: { text: title, left: 'center', textStyle: { fontSize: 14 } },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (value) => `${value}`,
    },
    legend: {
      top: 28,
      type: 'scroll',
    },
    grid: {
      left: 48,
      right: 24,
      top: 72,
      bottom: 64,
    },
    toolbox: {
      feature: {
        saveAsImage: {},
        dataZoom: { yAxisIndex: 'none' },
        restore: {},
      },
    },
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
      { type: 'slider', start: 0, end: 100, height: 18, bottom: 12 },
    ],
    xAxis: {
      type: 'category',
      data: years.map(String),
      name: 'Year',
    },
    yAxis: {
      type: 'value',
      scale: true,
    },
    series: seriesList.map((series) => ({
      name: series.label,
      type: 'line',
      smooth: true,
      showSymbol: false,
      data: years.map((year) => {
        const point = series.points.find((item) => item.year === year)
        return point?.value ?? null
      }),
    })),
  }
}
