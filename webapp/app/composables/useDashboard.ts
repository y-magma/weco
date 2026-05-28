import type { EChartsOption } from 'echarts'
import { buildDistributionOption } from '@src/charts/distribution'
import { buildScatterOption } from '@src/charts/scatter'
import { buildTimeSeriesOption } from '@src/charts/timeSeries'
import type { DataSeries } from '@src/domain/types'
import { stressHypothesis } from '@src/hypotheses/stressHypothesis'
import { WidDataSource } from '@src/data-sources/wid/widSource'

export function useDashboard() {
  const { defaultSource } = useDataSources()
  const hypothesis = stressHypothesis

  const countryCode = ref(hypothesis.defaultCountry)
  const yearFrom = ref(hypothesis.defaultYearFrom)
  const yearTo = ref(hypothesis.defaultYearTo)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const inequalityIndicator = hypothesis.variables.find(
    (variable) => variable.role === 'independent',
  )!
  const stressIndicator = hypothesis.variables.find(
    (variable) => variable.role === 'dependent',
  )!

  const inequalitySeries = ref<DataSeries | null>(null)
  const stressSeries = ref<DataSeries | null>(null)
  const distributionOption = ref<EChartsOption | null>(null)
  const scatterOption = ref<EChartsOption | null>(null)
  const timeSeriesOption = ref<EChartsOption | null>(null)

  const countries = ref<{ code: string; label: string }[]>([])

  const loadCountries = async () => {
    countries.value = await defaultSource.value.listCountries()
  }

  const loadDashboardData = async () => {
    loading.value = true
    error.value = null

    try {
      const source = defaultSource.value
      const params = {
        countryCode: countryCode.value,
        yearFrom: yearFrom.value,
        yearTo: yearTo.value,
      }

      const [inequality, stress, distribution] = await Promise.all([
        source.fetchSeries({
          ...params,
          indicatorId: inequalityIndicator.indicatorId,
        }),
        source.fetchSeries({
          ...params,
          indicatorId: stressIndicator.indicatorId,
        }),
        source.fetchDistribution({
          countryCode: countryCode.value,
          indicatorId: inequalityIndicator.indicatorId,
          year: yearTo.value,
        }),
      ])

      inequalitySeries.value = inequality
      stressSeries.value = stress

      timeSeriesOption.value = buildTimeSeriesOption(
        [inequality, stress],
        hypothesis.chartDefaults.timeSeriesTitle,
      )

      distributionOption.value = buildDistributionOption(distribution)

      if (source instanceof WidDataSource) {
        const scatterPoints = source.getSampleScatterData(
          inequalityIndicator.indicatorId,
          stressIndicator.indicatorId,
          yearFrom.value,
          yearTo.value,
        )
        scatterOption.value = buildScatterOption(
          scatterPoints,
          inequalityIndicator.label,
          stressIndicator.label,
          hypothesis.chartDefaults.scatterTitle,
        )
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load dashboard data'
    } finally {
      loading.value = false
    }
  }

  watch([countryCode, yearFrom, yearTo], () => {
    loadDashboardData()
  })

  onMounted(async () => {
    await loadCountries()
    await loadDashboardData()
  })

  return {
    hypothesis,
    countryCode,
    yearFrom,
    yearTo,
    countries,
    loading,
    error,
    timeSeriesOption,
    distributionOption,
    scatterOption,
    loadDashboardData,
  }
}
