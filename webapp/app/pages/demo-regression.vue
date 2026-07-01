<script setup lang="ts">
import { use, registerTransform } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, ScatterChart, BarChart } from 'echarts/charts'
import {
  DatasetComponent,
  TransformComponent,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  ToolboxComponent,
  TitleComponent,
  DataZoomComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import ecStat from 'echarts-stat'

const ecStatTransforms = (ecStat as unknown as { transform: { regression: Parameters<typeof registerTransform>[0] } }).transform

use([
  CanvasRenderer,
  LineChart,
  ScatterChart,
  BarChart,
  DatasetComponent,
  TransformComponent,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  ToolboxComponent,
  TitleComponent,
  DataZoomComponent,
])

registerTransform(ecStatTransforms.regression)

const rawSource: [number, number][] = [
  [1, 4862.4],
  [2, 5294.7],
  [3, 5934.5],
  [4, 7171.0],
  [5, 8964.4],
  [6, 10202.2],
  [7, 11962.5],
  [8, 14928.3],
  [9, 16909.2],
  [10, 18547.9],
  [11, 21617.8],
  [12, 26638.1],
  [13, 34634.4],
  [14, 46759.4],
  [15, 58478.1],
  [16, 67884.6],
  [17, 74462.6],
  [18, 79395.7],
]

const logSource = rawSource.map(([x, y]) => [x, Math.log(y)] as [number, number])

const chartRef = ref<InstanceType<typeof VChart> | null>(null)

const option = {
  dataset: [
    { source: rawSource },
    {
      transform: {
        type: 'ecStat:regression',
        config: { method: 'exponential' },
      },
    },
    { source: logSource },
  ],
  title: {
    text: '1981 - 1998 gross domestic product GDP (trillion yuan)',
    subtext: 'By ecStat.regression',
    sublink: 'https://github.com/ecomfe/echarts-stat',
    left: 'center',
  },
  legend: { top: 40 },
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'cross' },
  },
  toolbox: {
    feature: {
      dataZoom: { yAxisIndex: 'none' },
      dataView: { readOnly: false },
      magicType: { type: ['line', 'bar'] },
      restore: {},
      saveAsImage: {},
      myLogY: {
        show: true,
        title: 'LogY',
        icon: 'path://M16 22l-4-4h3V8h-3l4-4 4 4h-3v10h3l-4 4zM6 18l-4-4h3V4h-3l4-4 4 4H7v10h3l-4 4z',
        onclick: () => {
          const chart = chartRef.value?.chart
          if (!chart) return
          const yAxis = chart.getOption().yAxis as Array<{ type?: string }> | undefined
          const currentType = yAxis?.[0]?.type ?? 'value'
          const newType = currentType === 'log' ? 'value' : 'log'
          chart.setOption({ yAxis: [{ type: newType }, {}] })
        },
      },
      myLogX: {
        show: true,
        title: 'LogX',
        icon: 'path://M16 22l-4-4h3V8h-3l4-4 4 4h-3v10h3l-4 4zM6 18l-4-4h3V4h-3l4-4 4 4H7v10h3l-4 4z',
        onclick: () => {
          const chart = chartRef.value?.chart
          if (!chart) return
          const xAxis = chart.getOption().xAxis as Array<{ type?: string }> | undefined
          const currentType = xAxis?.[0]?.type ?? 'value'
          const newType = currentType === 'log' ? 'value' : 'log'
          chart.setOption({ xAxis: { type: newType } })
        },
      },
    },
  },
  xAxis: {
    type: 'value',
    splitLine: { lineStyle: { type: 'dashed' } },
  },
  grid: { show: true, top: 80 },
  yAxis: [
    {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed' } },
    },
    {
      type: 'value',
      name: 'ln(Y)',
      position: 'right',
      splitLine: { show: false },
    },
  ],
  series: [
    {
      name: 'scatter',
      type: 'scatter',
      datasetIndex: 0,
    },
    {
      name: 'line',
      type: 'line',
      smooth: true,
      datasetIndex: 1,
      symbolSize: 0.1,
      symbol: 'circle',
      label: { show: true, fontSize: 16 },
      labelLayout: { dx: -20 },
      encode: { label: 2, tooltip: 1 },
    },
    {
      name: 'log(Y)',
      type: 'line',
      datasetIndex: 2,
      yAxisIndex: 1,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
    },
  ],
}
</script>

<template>
  <v-container class="py-6" max-width="1000">
    <h1 class="text-h6 mb-4">
      1981–1998 GDP — scatter, régression exponentielle, ln(Y)
    </h1>
    <VChart
      ref="chartRef"
      :option="option"
      autoresize
      style="height: 520px; width: 100%"
    />
  </v-container>
</template>
