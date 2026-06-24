import type { EChartsOption } from 'echarts'
import type { Ref } from 'vue'
import { buildTimeSeriesOption } from '~/visualization/timeSeries'
import type { CountryOption, DataSeries, SourceIndicator } from '@domain/entities'
import { WID_DEFAULT_AGE, WID_DEFAULT_POP } from '@domain/catalog/widCodes'
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
import { PanelScope, yearCountLabel } from '~/composables/panelBase'
import { useWidParamConstraints } from '~/composables/useWidParamConstraints'

export interface TimeSeriesComparePanelStateOptions {
  countries?: Ref<CountryOption[]>
  initialVariable?: string
  initialCountryCodes?: string[]
  initialPercentile?: string
  panelIndex?: number
}

export function createTimeSeriesComparePanelState(
  options: TimeSeriesComparePanelStateOptions = {},
) {
  const app = useApplication()
  const { selectedSource } = usePanneauDataSource()
  const scope = new PanelScope(app, options.countries)

  const hasPercentileProfile = computed(
    () => selectedSource.value.capabilities?.percentileProfile === true,
  )

  const indicators = computed<readonly SourceIndicator[]>(
    () => selectedSource.value.indicators ?? [],
  )

  const variable = ref(
    options.initialVariable ?? indicators.value[0]?.id ?? 'ahweal',
  )
  const variableMeta = computed(() =>
    indicators.value.find((item) => item.id === variable.value),
  )

  const age = ref('')
  const pop = ref('')

  watch(hasPercentileProfile, (enabled) => {
    if (enabled) {
      age.value = WID_DEFAULT_AGE
      pop.value = WID_DEFAULT_POP
    } else {
      age.value = ''
      pop.value = ''
    }
  }, { immediate: true })

  const countryCodes = ref<string[]>(options.initialCountryCodes ?? ['FR', 'US'])
  const percentile = ref(options.initialPercentile ?? 'p0p50')
  const customLo = ref(50)
  const customHi = ref(51)
  const paramCountryCode = ref(countryCodes.value[0] ?? 'FR')

  const constraintsEnabled = computed(() => hasPercentileProfile.value)

  const constraints = useWidParamConstraints({
    app: scope.app,
    source: selectedSource,
    variable,
    params: { countryCode: paramCountryCode, age, pop },
    countries: scope.countries,
    enabled: constraintsEnabled,
  })

  const seriesList = ref<DataSeries[]>([])
  const chartOption = ref<EChartsOption | null>(null)

  const populationOptions = TIME_SERIES_COMPARE_POPULATION_OPTIONS
  const availableBoundaries = standardPopulationBoundaries()

  const sourceOptions = computed(() => ({ source: selectedSource.value }))

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
    if (!hasPercentileProfile.value) return undefined
    if (percentile.value !== TIME_SERIES_COMPARE_CUSTOM_SENTINEL) {
      return percentile.value
    }
    return customIntervalValidation.value.valid
      ? formatBracketCode(customLo.value, customHi.value)
      : null
  })

  const populationLabel = computed(() => {
    if (!hasPercentileProfile.value) return ''
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
    const meta = variableMeta.value
    const title = meta?.label ?? variable.value
    const subtitle = hasPercentileProfile.value
      ? `${populationLabel.value} · ${seriesList.value.length} pays`
      : `${seriesList.value.length} pays`
    chartOption.value = buildTimeSeriesOption(seriesList.value, title, {
      subtitle,
      yAxisLabel: meta?.unit,
      measureKind: meta?.kind ?? 'average',
    })
  }

  const load = async () => {
    const codes = countryCodes.value.length > 0 ? countryCodes.value : ['FR']
    if (countryCodes.value.length === 0) {
      countryCodes.value = codes
    }

    const resolvedPercentile = activePercentileCode.value
    if (hasPercentileProfile.value && !resolvedPercentile) {
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
          variable: variable.value,
          age: age.value,
          pop: pop.value,
          ...(resolvedPercentile ? { percentile: resolvedPercentile } : {}),
        },
        countryLabel: scope.countryLabel.bind(scope),
      }, sourceOptions.value)

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
    await scope.initCountries(selectedSource.value, variable.value)
    paramCountryCode.value = countryCodes.value[0] ?? 'FR'
    if (hasPercentileProfile.value) {
      await constraints.loadCountriesForVariable(variable.value)
      await constraints.refreshConstraints('variableChange')
    }
    await load()
  }

  const refreshParamsAndLoad = async (mode: 'variableChange' | 'clamp') => {
    paramCountryCode.value = countryCodes.value[0] ?? 'FR'
    if (hasPercentileProfile.value) {
      const ready = await constraints.refreshConstraints(mode)
      if (!ready) {
        scope.error.value = constraints.constraintsError.value ?? 'Paramètres indisponibles pour cette sélection.'
        seriesList.value = []
        chartOption.value = null
        return
      }
    }
    await load()
  }

  watch([countryCodes, percentile, customLo, customHi, age, pop], () => {
    void refreshParamsAndLoad('clamp')
  }, { deep: true })

  watch(variable, (next) => {
    if (hasPercentileProfile.value) {
      constraints.applyOptimisticDefaults(next)
      void constraints.loadCountriesForVariable(next).then(() => refreshParamsAndLoad('variableChange'))
    } else {
      void load()
    }
  })

  watch(() => selectedSource.value.id, async () => {
    const panelIndex = options.panelIndex ?? 0
    const nextVariable = selectedSource.value.indicators?.[panelIndex]?.id
      ?? selectedSource.value.indicators?.[0]?.id
    if (nextVariable) {
      variable.value = nextVariable
    }
    await scope.initCountries(selectedSource.value, variable.value)
    paramCountryCode.value = countryCodes.value[0] ?? 'FR'
    if (hasPercentileProfile.value) {
      await constraints.loadCountriesForVariable(variable.value)
      await constraints.refreshConstraints('variableChange')
    }
    await load()
  })

  const panelCountries = computed(() =>
    hasPercentileProfile.value ? constraints.countries.value : scope.countries.value,
  )

  return {
    countryCodes,
    variable,
    percentile,
    customLo,
    customHi,
    availableBoundaries,
    customIntervalValidation,
    activePercentileCode,
    age,
    pop,
    countries: panelCountries,
    variables: indicators,
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
    variableMeta,
    hasPercentileProfile,
    populationLabel,
    yearCountLabel: computed(() =>
      yearCountLabel(seriesList.value.map((series) => series.points.length)),
    ),
    load,
    init,
  }
}
