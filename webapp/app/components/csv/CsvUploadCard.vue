<script setup lang="ts">
import type { CsvParseResult } from '@src/csv/CsvReaderFactory'
import { createCsvReader, mapCsvToSeries } from '@src/csv/CsvReaderFactory'
import { buildTimeSeriesOption } from '@src/charts/timeSeries'
import type { EChartsOption } from 'echarts'

const emit = defineEmits<{
  parsed: [result: CsvParseResult]
  seriesBuilt: [option: EChartsOption]
}>()

const file = ref<File | null>(null)
const parseResult = ref<CsvParseResult | null>(null)
const yearColumn = ref('')
const valueColumn = ref('')
const seriesLabel = ref('Imported series')
const loading = ref(false)
const error = ref<string | null>(null)

const previewHeaders = computed(() => parseResult.value?.columns ?? [])
const previewRows = computed(() => parseResult.value?.rows.slice(0, 5) ?? [])

const onFileChange = async (files: File[] | File | null) => {
  const selected = Array.isArray(files) ? files[0] : files
  file.value = selected ?? null
  parseResult.value = null
  error.value = null

  if (!file.value) return

  loading.value = true
  try {
    const reader = createCsvReader({ type: 'file', file: file.value })
    const result = await reader.parse()
    parseResult.value = result
    yearColumn.value = result.columns.find((column) =>
      /year|date|annee/i.test(column),
    ) ?? result.columns[0] ?? ''
    valueColumn.value = result.columns.find((column) =>
      /value|amount|share|index/i.test(column),
    ) ?? result.columns[1] ?? ''
    emit('parsed', result)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to parse CSV'
  } finally {
    loading.value = false
  }
}

const buildChart = () => {
  if (!parseResult.value || !yearColumn.value || !valueColumn.value) return

  const series = mapCsvToSeries(
    parseResult.value.rows,
    yearColumn.value,
    valueColumn.value,
    seriesLabel.value,
  )
  const option = buildTimeSeriesOption([series], `CSV: ${seriesLabel.value}`)
  emit('seriesBuilt', option)
}
</script>

<template>
  <v-card variant="outlined" class="pa-4">
    <v-card-title class="px-0 pt-0">Upload CSV</v-card-title>
    <v-card-text class="px-0">
      <v-file-input
        label="Select CSV file"
        accept=".csv,text/csv"
        prepend-icon="mdi-file-delimited"
        show-size
        @update:model-value="onFileChange"
      />

      <v-alert
        v-if="error"
        type="error"
        variant="tonal"
        density="compact"
        class="mb-4"
      >
        {{ error }}
      </v-alert>

      <v-row v-if="parseResult" class="mt-2">
        <v-col cols="12" md="4">
          <v-select
            v-model="yearColumn"
            :items="previewHeaders"
            label="Year column"
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-select
            v-model="valueColumn"
            :items="previewHeaders"
            label="Value column"
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="seriesLabel"
            label="Series label"
          />
        </v-col>
      </v-row>

      <v-btn
        v-if="parseResult"
        color="primary"
        class="mt-2"
        :loading="loading"
        @click="buildChart"
      >
        Build chart
      </v-btn>

      <v-table v-if="previewRows.length" density="compact" class="mt-4">
        <thead>
          <tr>
            <th v-for="column in previewHeaders" :key="column">
              {{ column }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in previewRows" :key="index">
            <td v-for="column in previewHeaders" :key="column">
              {{ row[column] }}
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>
