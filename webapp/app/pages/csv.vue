<script setup lang="ts">
import type { EChartsOption } from 'echarts'

definePageMeta({
  layout: 'default',
})

const chartOption = ref<EChartsOption | null>(null)
</script>

<template>
  <div>
    <h1 class="text-h4 font-weight-bold mb-2">CSV import</h1>
    <p class="text-body-1 text-medium-emphasis mb-6">
      Load local CSV files with the reader factory. Map columns to year and value
      fields, then preview the resulting time-series chart.
    </p>

    <v-row>
      <v-col cols="12" lg="5">
        <CsvUploadCard @series-built="chartOption = $event" />
      </v-col>
      <v-col cols="12" lg="7">
        <v-card variant="outlined" class="pa-4 h-100">
          <v-card-title class="px-0 pt-0">Preview chart</v-card-title>
          <EChart :option="chartOption" height="420px" />
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
