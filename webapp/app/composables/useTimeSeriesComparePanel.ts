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
import { yearCountLabel } from '~/composables/panelBase'
import { createTimeSeriesSharedContext, defaultTimeSeriesVariable } from '~/composables/timeSeriesPanelShared'
import type { TimeSeriesComparePanelSnapshot } from '@application/share/shareSnapshot'
import {
  applyTimeSeriesCompareSnapshot,
  serializeTimeSeriesCompareState,
  type TimeSeriesComparePanelRefs,
} from '@application/share/panelSnapshots'

export interface TimeSeriesComparePanelStateOptions {
  countries?: Ref<CountryOption[]>
  initialVariable?: string
  initialCountryCodes?: string[]
  initialPercentile?: string
  initialSnapshot?: TimeSeriesComparePanelSnapshot
  panelIndex?: number
}

export { applyTimeSeriesCompareSnapshot, serializeTimeSeriesCompareState }
export type { TimeSeriesComparePanelSnapshot }

export function createTimeSeriesComparePanelState(
  options: TimeSeriesComparePanelStateOptions = {},
) {
  const countryCodes = ref<string[]>(options.initialCountryCodes ?? ['FR', 'US'])
  const paramCountryCode = ref(countryCodes.value[0] ?? 'FR')

  const shared = createTimeSeriesSharedContext({
    countries: options.countries,
    panelIndex: options.panelIndex,
    initialVariable: options.initialVariable,
    constraintsCountryCode: paramCountryCode,
  })
  const { scope } = shared

  const percentile = ref(options.initialPercentile ?? 'p0p50')
  const decileSubSelection = ref('')
  watch(shared.decileBundleOptions, (bundleOptions) => {
    if (bundleOptions.length > 0 && !bundleOptions.some((item) => item.id === decileSubSelection.value)) {
      decileSubSelection.value = bundleOptions[0]!.id
    }
  }, { immediate: true })
  const customLo = ref(50)
  const customHi = ref(51)

  const compareRefs: TimeSeriesComparePanelRefs = {
    countryCodes,
    variable: shared.variable,
    percentile,
    customLo,
    customHi,
    decileSubSelection,
    age: shared.age,
    pop: shared.pop,
  }

  if (options.initialSnapshot) {
    applyTimeSeriesCompareSnapshot(compareRefs, options.initialSnapshot)
  }

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
    if (!shared.hasPercentileProfile.value) return undefined
    if (percentile.value !== TIME_SERIES_COMPARE_CUSTOM_SENTINEL) {
      return percentile.value
    }
    return customIntervalValidation.value.valid
      ? formatBracketCode(customLo.value, customHi.value)
      : null
  })

  const populationLabel = computed(() => {
    if (!shared.hasPercentileProfile.value) return ''
    if (percentile.value === TIME_SERIES_COMPARE_CUSTOM_SENTINEL) {
      if (!customIntervalValidation.value.valid) {
        return 'Tranche personnalisée'
      }
      return `]${formatBoundaryLabel(customLo.value)}, ${formatBoundaryLabel(customHi.value)}]`
    }
    return populationOptions.find((item) => item.value === percentile.value)?.label ?? percentile.value
  })

  const decileSubLabel = computed(() =>
    shared.decileBundleOptions.value.find((item) => item.id === decileSubSelection.value)?.label
      ?? decileSubSelection.value,
  )

  const clearChart = () => {
    seriesList.value = []
    chartOption.value = null
  }

  const rebuild = () => {
    if (seriesList.value.length === 0) {
      chartOption.value = null
      return
    }
    const meta = shared.variableMeta.value
    const title = meta?.label ?? shared.variable.value
    const subtitle = shared.hasPercentileProfile.value
      ? `${populationLabel.value} · ${seriesList.value.length} pays`
      : shared.isDecileBundle.value
        ? `${decileSubLabel.value} · ${seriesList.value.length} pays`
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

    paramCountryCode.value = codes[0] ?? 'FR'

    const resolvedPercentile = activePercentileCode.value
    if (shared.hasPercentileProfile.value && !resolvedPercentile) {
      scope.error.value = customIntervalValidation.value.error
        ?? 'Définissez une tranche personnalisée valide.'
      clearChart()
      return
    }

    if (shared.isDecileBundle.value && !decileSubSelection.value) {
      scope.error.value = `Sélectionnez un ${shared.decileBundleConfig.value?.subSelectorLabel?.toLowerCase() ?? 'sous-indicateur'}.`
      clearChart()
      return
    }

    scope.loading.value = true
    scope.error.value = null
    scope.loadWarning.value = null

    try {
      const result = await scope.app.loadTimeSeries.execute({
        countryCodes: codes,
        params: {
          variable: shared.isDecileBundle.value ? shared.decileBundleConfig.value!.bundleId : shared.variable.value,
          age: shared.age.value,
          pop: shared.pop.value,
          ...(resolvedPercentile ? { percentile: resolvedPercentile } : {}),
          ...(shared.isDecileBundle.value ? { percentile: decileSubSelection.value } : {}),
        },
        countryLabel: scope.countryLabel.bind(scope),
      }, shared.sourceOptions.value)

      if (result.series.length === 0) {
        scope.error.value = result.failures[0] ?? 'Échec du chargement des séries'
        clearChart()
        return
      }

      seriesList.value = result.series

      if (result.failures.length > 0) {
        scope.loadWarning.value = result.failures.join(' · ')
      }

      rebuild()
    } catch (err) {
      scope.error.value = err instanceof Error ? err.message : 'Échec du chargement des séries'
      clearChart()
    } finally {
      scope.loading.value = false
    }
  }

  const init = async () => {
    await scope.initCountries(shared.selectedSource.value, shared.variable.value)
    paramCountryCode.value = countryCodes.value[0] ?? 'FR'
    if (shared.hasPercentileProfile.value) {
      await shared.constraints.loadCountriesForVariable(shared.variable.value)
      await shared.constraints.refreshConstraints('variableChange')
    }
    await load()
  }

  watch([countryCodes, percentile, decileSubSelection, customLo, customHi, shared.age, shared.pop], () => {
    void shared.refreshParamsAndLoad('clamp', load, clearChart)
  }, { deep: true })

  watch(shared.variable, (next) => {
    if (shared.hasPercentileProfile.value) {
      shared.constraints.applyOptimisticDefaults(next)
      void shared.constraints.loadCountriesForVariable(next).then(() =>
        shared.refreshParamsAndLoad('variableChange', load, clearChart),
      )
    } else {
      void load()
    }
  })

  watch(() => shared.selectedSource.value.id, async () => {
    const nextVariable = defaultTimeSeriesVariable(shared.selectedSource.value, shared.panelIndex)
    if (nextVariable) {
      shared.variable.value = nextVariable
    }
    await scope.initCountries(shared.selectedSource.value, shared.variable.value)
    paramCountryCode.value = countryCodes.value[0] ?? 'FR'
    if (shared.hasPercentileProfile.value) {
      await shared.constraints.loadCountriesForVariable(shared.variable.value)
      await shared.constraints.refreshConstraints('variableChange')
    }
    await load()
  })

  return {
    countryCodes,
    variable: shared.variable,
    percentile,
    customLo,
    customHi,
    availableBoundaries,
    customIntervalValidation,
    activePercentileCode,
    age: shared.age,
    pop: shared.pop,
    countries: shared.panelCountries,
    variables: shared.indicators,
    ageOptions: shared.constraints.ageOptions,
    popOptions: shared.constraints.popOptions,
    paramsLoading: shared.constraints.constraintsLoading,
    yearRangeLabel: shared.constraints.yearRangeLabel,
    populationOptions,
    loading: scope.loading,
    error: scope.error,
    loadWarning: scope.loadWarning,
    seriesList,
    chartOption,
    variableMeta: shared.variableMeta,
    hasPercentileProfile: shared.hasPercentileProfile,
    hasDecileProfile: shared.hasDecileProfile,
    isDecileBundle: shared.isDecileBundle,
    decileSubSelection,
    decileBundleOptions: shared.decileBundleOptions,
    decileBundleConfig: shared.decileBundleConfig,
    decileSubLabel,
    populationLabel,
    yearCountLabel: computed(() =>
      yearCountLabel(seriesList.value.map((series) => series.points.length)),
    ),
    serializeSnapshot: () => serializeTimeSeriesCompareState(compareRefs),
    applySnapshot: (snapshot: TimeSeriesComparePanelSnapshot) => {
      applyTimeSeriesCompareSnapshot(compareRefs, snapshot)
    },
    load,
    init,
  }
}
