import type { ScatterPoint } from '@src/domain/types'
import type { EChartsOption } from 'echarts'

export function buildScatterOption(
  points: ScatterPoint[],
  xLabel: string,
  yLabel: string,
  title = 'Cross-country comparison',
): EChartsOption {
  return {
    title: { text: title, left: 'center', textStyle: { fontSize: 14 } },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const data = params.data as number[]
        const point = points.find((item) => item.x === data[0] && item.y === data[1])
        const label = point?.label ?? 'Unknown'
        const year = point?.year ?? ''
        return `${label} (${year})<br/>${xLabel}: ${data[0]}<br/>${yLabel}: ${data[1]}`
      },
    },
    grid: {
      left: 56,
      right: 24,
      top: 56,
      bottom: 48,
    },
    xAxis: {
      type: 'value',
      name: xLabel,
      scale: true,
    },
    yAxis: {
      type: 'value',
      name: yLabel,
      scale: true,
    },
    series: [
      {
        name: 'Observations',
        type: 'scatter',
        symbolSize: 10,
        data: points.map((point) => [point.x, point.y]),
        emphasis: {
          focus: 'series',
        },
      },
    ],
  }
}
