<script setup lang="ts">
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, CustomChart, LineChart, ScatterChart } from 'echarts/charts'
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import type { EChartsOption } from 'echarts'

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  ScatterChart,
  CustomChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  ToolboxComponent,
  TitleComponent,
  VisualMapComponent,
])

withDefaults(
  defineProps<{
    option: EChartsOption | null
    loading?: boolean
    error?: string | null
    height?: string
  }>(),
  {
    loading: false,
    error: null,
    height: '360px',
  },
)

const emit = defineEmits<{ chartClick: [params: unknown], dataZoom: [params: unknown] }>()
</script>

<template>
  <div class="chart-card">
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      {{ error }}
    </v-alert>

    <v-skeleton-loader
      v-if="loading"
      type="image"
      :height="height"
    />

    <div
      v-else-if="option"
      class="chart-container"
      :style="{ height, width: '100%' }"
    >
      <VChart
        :option="option"
        :update-options="{ notMerge: true }"
        autoresize
        class="chart-instance"
        @click="(params: unknown) => emit('chartClick', params)"
        @datazoom="(params: unknown) => emit('dataZoom', params)"
      />
    </div>

    <v-sheet
      v-else
      :height="height"
      class="d-flex align-center justify-center text-medium-emphasis"
      rounded="lg"
      border
    >
      No chart data available
    </v-sheet>
  </div>
</template>

<style scoped>
.chart-container {
  min-height: 240px;
}

.chart-instance {
  height: 100%;
  width: 100%;
}
</style>
