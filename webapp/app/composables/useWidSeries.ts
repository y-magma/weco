import type { EChartsOption } from 'echarts'
import type { Ref } from 'vue'
import { buildStackedTimeSeriesOption, type CountryTrancheSeries } from '~/visualization/timeSeries'
import type { CountryOption, DataSeries } from '@domain/entities'
import {
  breakpointsForMode,
  buildTimeSeriesTranches,
  standardPopulationBoundaries,
  TIME_SERIES_PARTITION_OPTIONS,
  type TimeSeriesPartitionMode,
  type TimeSeriesTranche,
} from '~/visualization/timeSeriesPartition'
import {
  isCustomPartitionComplete as isPopulationPartitionComplete,
  validateCustomBreakpoints,
} from '~/visualization/populationPartition'
import { WidDemographicFilters, WidPanelScope, yearCountLabel } from '~/composables/widPanelBase'

export interface WidSeriesStateOptions {
  countries?: Ref<CountryOption[]>
  initialVariable?: string
  initialCountryCode?: string
}

export function createWidSeriesState(options: WidSeriesStateOptions = {}) {
  const scope = new WidPanelScope(useApplication(), options.countries)
  const filters = new WidDemographicFilters(options.initialVariable)

  const countryCode = ref(options.initialCountryCode ?? 'FR')
  const partitionMode = ref<TimeSeriesPartitionMode>('wealth')
  const customBreakpoints = ref<number[]>([])

  const trancheSeriesByCountry = ref<CountryTrancheSeries[]>([])
  const chartOption = ref<EChartsOption | null>(null)

  const partitionOptions = TIME_SERIES_PARTITION_OPTIONS
  const availableBoundaries = standardPopulationBoundaries()

  const customPartitionValidation = computed(() =>
    validateCustomBreakpoints(customBreakpoints.value, availableBoundaries),
  )

  const customPartitionComplete = computed(() =>
    isPopulationPartitionComplete(customBreakpoints.value) && customPartitionValidation.value.valid,
  )

  const activeBreakpoints = computed(() => {
    if (partitionMode.value === 'custom') {
      return customPartitionComplete.value ? customBreakpoints.value : []
    }
    return breakpointsForMode(partitionMode.value, customBreakpoints.value)
  })

  const activeTranches = computed<TimeSeriesTranche[]>(() => {
    if (activeBreakpoints.value.length === 0) return []
    return buildTimeSeriesTranches(activeBreakpoints.value, partitionMode.value)
  })

  const trancheCountLabel = computed(() => {
    const count = activeTranches.value.length
    return count > 0 ? `${count} tranches` : ''
  })

  const rebuild = () => {
    if (trancheSeriesByCountry.value.length === 0) {
      chartOption.value = null
      return
    }
    const meta = filters.variableMeta.value
    const title = meta?.label ?? filters.variable.value
    const subtitle = `${trancheSeriesByCountry.value[0]!.countryLabel} · par tranche de population`
    chartOption.value = buildStackedTimeSeriesOption(trancheSeriesByCountry.value, title, subtitle, meta?.unit)
  }

  const organizeSeries = (
    tranches: TimeSeriesTranche[],
    codes: string[],
    series: DataSeries[],
  ): CountryTrancheSeries[] => {
    const byKey = new Map<string, DataSeries>()
    for (const item of series) {
      byKey.set(item.id, item)
    }

    return codes.map((code) => ({
      countryCode: code,
      countryLabel: scope.countryLabel(code),
      tranches: tranches.map((tranche) => {
        const id = `${code}-${filters.variable.value}-${tranche.code}-${filters.age.value}-${filters.pop.value}`
        const match = byKey.get(id)
        const byYear = new Map<number, number>()
        for (const point of match?.points ?? []) {
          byYear.set(point.year, point.value)
        }
        return { tranche, byYear }
      }),
    }))
  }

  const load = async () => {
    const code = countryCode.value || 'FR'
    if (!countryCode.value) {
      countryCode.value = code
    }

    const tranches = activeTranches.value
    if (tranches.length === 0) {
      scope.error.value = partitionMode.value === 'custom'
        ? (customPartitionValidation.value.error ?? 'Définissez les tranches personnalisées jusqu’à 100 %.')
        : 'Aucune tranche sélectionnée'
      trancheSeriesByCountry.value = []
      chartOption.value = null
      return
    }

    scope.loading.value = true
    scope.error.value = null
    scope.loadWarning.value = null

    try {
      const requests = tranches.map((tranche) =>
        scope.app.loadTimeSeries.execute({
          countryCodes: [code],
          params: {
            variable: filters.variable.value,
            age: filters.age.value,
            pop: filters.pop.value,
            percentile: tranche.code,
          },
          countryLabel: scope.countryLabel.bind(scope),
        }),
      )

      const results = await Promise.all(requests)
      const allSeries: DataSeries[] = []
      const failures: string[] = []

      for (const result of results) {
        allSeries.push(...result.series)
        failures.push(...result.failures)
      }

      if (allSeries.length === 0) {
        scope.error.value = failures[0] ?? 'Échec du chargement des séries'
        trancheSeriesByCountry.value = []
        chartOption.value = null
        return
      }

      trancheSeriesByCountry.value = organizeSeries(tranches, [code], allSeries)

      if (failures.length > 0) {
        scope.loadWarning.value = failures.join(' · ')
      }

      rebuild()
    } catch (err) {
      scope.error.value = err instanceof Error ? err.message : 'Échec du chargement des séries'
      trancheSeriesByCountry.value = []
      chartOption.value = null
    } finally {
      scope.loading.value = false
    }
  }

  const init = async () => {
    await scope.initCountries()
    await load()
  }

  watch(
    [countryCode, filters.variable, filters.age, filters.pop, partitionMode, customBreakpoints],
    load,
    { deep: true },
  )

  return {
    countryCode,
    variable: filters.variable,
    age: filters.age,
    pop: filters.pop,
    partitionMode,
    customBreakpoints,
    countries: scope.countries,
    variables: filters.variables,
    ageOptions: filters.ageOptions,
    popOptions: filters.popOptions,
    partitionOptions,
    availableBoundaries,
    customPartitionValidation,
    customPartitionComplete,
    activeTranches,
    loading: scope.loading,
    error: scope.error,
    loadWarning: scope.loadWarning,
    trancheSeriesByCountry,
    chartOption,
    variableMeta: filters.variableMeta,
    yearCountLabel: computed(() =>
      yearCountLabel(trancheSeriesByCountry.value.flatMap((country) =>
        country.tranches.flatMap((layer) => layer.byYear.size),
      )),
    ),
    trancheCountLabel,
    load,
    init,
  }
}
