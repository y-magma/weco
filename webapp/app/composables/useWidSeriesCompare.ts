import type { EChartsOption } from 'echarts'
import type { Ref } from 'vue'
import { buildTimeSeriesOption } from '~/visualization/timeSeries'
import type { CountryOption, DataSeries } from '@domain/entities'
import {
  standardPopulationBoundaries,
  TIME_SERIES_COMPARE_CUSTOM_SENTINEL,
  TIME_SERIES_COMPARE_POPULATION_OPTIONS,
} from '~/visualization/timeSeriesPartition'
import {
  formatBoundaryLabel,
  formatBracketCode,
  isBoundaryAvailable,
} from '~/visualization/populationPartition'
import { WidDemographicFilters, WidPanelScope, yearCountLabel } from '~/composables/widPanelBase'
import { useWidParamConstraints } from '~/composables/useWidParamConstraints'

export interface WidSeriesCompareStateOptions {
  countries?: Ref<CountryOption[]>
  initialVariable?: string
  initialCountryCodes?: string[]
  initialPercentile?: string
}

export function createWidSeriesCompareState(options: WidSeriesCompareStateOptions = {}) {
  const scope = new WidPanelScope(useApplication(), options.countries)
  const filters = new WidDemographicFilters(options.initialVariable)

  const countryCodes = ref<string[]>(options.initialCountryCodes ?? ['FR', 'US'])
  const percentile = ref(options.initialPercentile ?? 'p0p50')
  const customLo = ref(50)
  const customHi = ref(51)
  const paramCountryCode = ref(countryCodes.value[0] ?? 'FR')

  const constraints = useWidParamConstraints({
    app: scope.app,
    variable: filters.variable,
    params: { countryCode: paramCountryCode, age: filters.age, pop: filters.pop },
    countries: scope.countries,
  })

  const seriesList = ref<DataSeries[]>([])
  const chartOption = ref<EChartsOption | null>(null)

  const populationOptions = TIME_SERIES_COMPARE_POPULATION_OPTIONS
  const availableBoundaries = standardPopulationBoundaries()

  const customIntervalValidation = computed(() => {
    if (percentile.value !== TIME_SERIES_COMPARE_CUSTOM_SENTINEL) {
      return { valid: true, error: null as string | null }
    }
    const lo = customLo.value
    const hi = customHi.value
    if (!isBoundaryAvailable(lo, availableBoundaries)) {
      return {
        valid: false,
        error: `${formatBoundaryLabel(lo)} n’est pas une borne disponible.`,
      }
    }
    if (!isBoundaryAvailable(hi, availableBoundaries)) {
      return {
        valid: false,
        error: `${formatBoundaryLabel(hi)} n’est pas une borne disponible.`,
      }
    }
    if (hi <= lo) {
      return {
        valid: false,
        error: 'La borne haute doit être strictement supérieure à la borne basse.',
      }
    }
    return { valid: true, error: null }
  })

  const activePercentileCode = computed(() => {
    if (percentile.value !== TIME_SERIES_COMPARE_CUSTOM_SENTINEL) {
      return percentile.value
    }
    return customIntervalValidation.value.valid
      ? formatBracketCode(customLo.value, customHi.value)
      : null
  })

  const populationLabel = computed(() => {
    if (percentile.value === TIME_SERIES_COMPARE_CUSTOM_SENTINEL) {
      if (!customIntervalValidation.value.valid) {
        return 'Tranche personnalisée'
      }
      return `]${formatBoundaryLabel(customLo.value)}, ${formatBoundaryLabel(customHi.value)}]`
    }
    return populationOptions.find((item) => item.value === percentile.value)?.label ?? percentile.value
  })

  const rebuild = () => {
    if (seriesList.value.length === 0) {
      chartOption.value = null
      return
    }
    const meta = filters.variableMeta.value
    const title = meta?.label ?? filters.variable.value
    const subtitle = `${populationLabel.value} · ${seriesList.value.length} pays`
    chartOption.value = buildTimeSeriesOption(seriesList.value, title, { subtitle, yAxisLabel: meta?.unit })
  }

  const load = async () => {
    const codes = countryCodes.value.length > 0 ? countryCodes.value : ['FR']
    if (countryCodes.value.length === 0) {
      countryCodes.value = codes
    }

    const resolvedPercentile = activePercentileCode.value
    if (!resolvedPercentile) {
      scope.error.value = customIntervalValidation.value.error
        ?? 'Définissez une tranche personnalisée valide.'
      seriesList.value = []
      chartOption.value = null
      return
    }

    scope.loading.value = true
    scope.error.value = null
    scope.loadWarning.value = null

    try {
      const result = await scope.app.loadTimeSeries.execute({
        countryCodes: codes,
        params: {
          variable: filters.variable.value,
          age: filters.age.value,
          pop: filters.pop.value,
          percentile: resolvedPercentile,
        },
        countryLabel: scope.countryLabel.bind(scope),
      })

      if (result.series.length === 0) {
        scope.error.value = result.failures[0] ?? 'Échec du chargement des séries'
        seriesList.value = []
        chartOption.value = null
        return
      }

      seriesList.value = result.series

      if (result.failures.length > 0) {
        scope.loadWarning.value = result.failures.join(' · ')
      }

      rebuild()
    } catch (err) {
      scope.error.value = err instanceof Error ? err.message : 'Échec du chargement des séries'
      seriesList.value = []
      chartOption.value = null
    } finally {
      scope.loading.value = false
    }
  }

  const init = async () => {
    await scope.initCountries(filters.variable.value)
    paramCountryCode.value = countryCodes.value[0] ?? 'FR'
    await constraints.loadCountriesForVariable(filters.variable.value)
    await constraints.refreshConstraints('variableChange')
    await load()
  }

  const refreshParamsAndLoad = async (mode: 'variableChange' | 'clamp') => {
    paramCountryCode.value = countryCodes.value[0] ?? 'FR'
    await constraints.refreshConstraints(mode)
    await load()
  }

  watch([countryCodes, percentile, customLo, customHi, filters.age, filters.pop], () => {
    void refreshParamsAndLoad('clamp')
  }, { deep: true })

  watch(filters.variable, (next) => {
    constraints.applyOptimisticDefaults(next)
    void constraints.loadCountriesForVariable(next).then(() => refreshParamsAndLoad('variableChange'))
  })

  return {
    countryCodes,
    variable: filters.variable,
    percentile,
    customLo,
    customHi,
    availableBoundaries,
    customIntervalValidation,
    activePercentileCode,
    age: filters.age,
    pop: filters.pop,
    countries: constraints.countries,
    variables: filters.variables,
    ageOptions: constraints.ageOptions,
    popOptions: constraints.popOptions,
    paramsLoading: constraints.constraintsLoading,
    yearRangeLabel: constraints.yearRangeLabel,
    populationOptions,
    loading: scope.loading,
    error: scope.error,
    loadWarning: scope.loadWarning,
    seriesList,
    chartOption,
    variableMeta: filters.variableMeta,
    populationLabel,
    yearCountLabel: computed(() =>
      yearCountLabel(seriesList.value.map((series) => series.points.length)),
    ),
    load,
    init,
  }
}
