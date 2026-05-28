import type { DistributionSeries } from '@src/domain/types'
import type { EChartsOption } from 'echarts'

export function buildDistributionOption(
  distribution: DistributionSeries,
): EChartsOption {
  return {
    title: {
      text: distribution.label,
      left: 'center',
      textStyle: { fontSize: 14 },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    grid: {
      left: 48,
      right: 24,
      top: 56,
      bottom: 48,
    },
    xAxis: {
      type: 'category',
      data: distribution.points.map((point) => point.percentile),
      name: 'Percentile',
    },
    yAxis: {
      type: 'value',
      name: 'Value',
    },
    series: [
      {
        name: 'Distribution',
        type: 'bar',
        data: distribution.points.map((point) => point.value),
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  }
}
