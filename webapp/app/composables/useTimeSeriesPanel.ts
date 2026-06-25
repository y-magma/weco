import type { EChartsOption } from 'echarts'
import type { Ref } from 'vue'
import { buildStackedTimeSeriesOption, buildTimeSeriesOption, type CountryTrancheSeries } from '~/visualization/timeSeries'
import type { CountryOption, DataSeries, SourceIndicator } from '@domain/entities'
import { WID_DEFAULT_AGE, WID_DEFAULT_POP } from '@domain/catalog/widCodes'
import {
  isCustomPartitionComplete,
  validatePartialCustomBreakpoints,
} from '~/visualization/populationPartition'
import {
  breakpointsForTimeSeriesPopulationMode,
  buildTimeSeriesTranches,
  standardPopulationBoundaries,
  TIME_SERIES_POPULATION_VIEW_OPTIONS,
  trancheLabelModeForPopulation,
  type TimeSeriesPopulationMode,
  type TimeSeriesTranche,
} from '~/visualization/timeSeriesPartition'
import { PanelScope, yearCountLabel } from '~/composables/panelBase'
import { useWidParamConstraints } from '~/composables/useWidParamConstraints'
import {
  isOecdDecileBundleVariable,
  OECD_DECILE_BUNDLE_ID,
  OECD_DECILE_RATIO_IDS,
  OECD_DECILE_RATIO_OPTIONS,
} from '@infrastructure/data-sources/oecd-idd/oecdDeciles'

export interface TimeSeriesPanelStateOptions {
  countries?: Ref<CountryOption[]>
  initialVariable?: string
  initialCountryCode?: string
  panelIndex?: number
}

export function createTimeSeriesPanelState(options: TimeSeriesPanelStateOptions = {}) {
  const app = useApplication()
  const { selectedSource } = usePanneauDataSource()
  const scope = new PanelScope(app, options.countries)

  const hasPercentileProfile = computed(
    () => selectedSource.value.capabilities?.percentileProfile === true,
  )

  const hasDecileProfile = computed(
    () => selectedSource.value.capabilities?.decileProfile === true,
  )

  const indicators = computed<readonly SourceIndicator[]>(
    () => selectedSource.value.indicators ?? [],
  )

  const variable = ref(
    options.initialVariable ?? indicators.value[0]?.id ?? 'ahweal',
  )

  const isDecileBundle = computed(() => isOecdDecileBundleVariable(variable.value))
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

  const countryCode = ref(options.initialCountryCode ?? 'FR')
  const partitionMode = ref<TimeSeriesPopulationMode>('distribution')
  const customBreakpoints = ref<number[]>([])

  const constraintsEnabled = computed(() => hasPercentileProfile.value)

  const constraints = useWidParamConstraints({
    app: scope.app,
    source: selectedSource,
    variable,
    params: { countryCode, age, pop },
    countries: scope.countries,
    enabled: constraintsEnabled,
  })

  const trancheSeriesByCountry = ref<CountryTrancheSeries[]>([])
  const scalarSeries = ref<DataSeries[]>([])
  const chartOption = ref<EChartsOption | null>(null)

  const partitionViewOptions = TIME_SERIES_POPULATION_VIEW_OPTIONS
  const availableBoundaries = standardPopulationBoundaries()

  const customPartitionValidation = computed(() =>
    validatePartialCustomBreakpoints(customBreakpoints.value, availableBoundaries),
  )

  const customPartitionReady = computed(() => customPartitionValidation.value.valid)

  const customPartitionComplete = computed(() =>
    isCustomPartitionComplete(customBreakpoints.value) && customPartitionValidation.value.valid,
  )

  const activeBreakpoints = computed(() => {
    if (!hasPercentileProfile.value) return []
    const mode = partitionMode.value
    if (mode === 'custom') {
      return customPartitionReady.value ? customBreakpoints.value : []
    }
    return breakpointsForTimeSeriesPopulationMode(mode)
  })

  const activeTranches = computed<TimeSeriesTranche[]>(() => {
    if (activeBreakpoints.value.length === 0) return []
    return buildTimeSeriesTranches(activeBreakpoints.value, trancheLabelModeForPopulation(partitionMode.value))
  })

  const trancheCountLabel = computed(() => {
    const count = activeTranches.value.length
    return count > 0 ? `${count} tranches` : ''
  })

  const sourceOptions = computed(() => ({ source: selectedSource.value }))

  const rebuild = () => {
    if (hasPercentileProfile.value) {
      if (trancheSeriesByCountry.value.length === 0) {
        chartOption.value = null
        return
      }
      const meta = variableMeta.value
      const title = meta?.label ?? variable.value
      const subtitle = `${trancheSeriesByCountry.value[0]!.countryLabel} · par tranche de population`
      chartOption.value = buildStackedTimeSeriesOption(
        trancheSeriesByCountry.value,
        title,
        subtitle,
        meta?.unit,
        meta?.kind ?? 'average',
      )
      return
    }

    if (scalarSeries.value.length === 0) {
      chartOption.value = null
      return
    }
    const meta = variableMeta.value
    const title = meta?.label ?? variable.value
    const subtitle = isDecileBundle.value
      ? `${scope.countryLabel(countryCode.value)} · ratios inter-déciles`
      : `${scope.countryLabel(countryCode.value)} · série annuelle`
    chartOption.value = buildTimeSeriesOption(scalarSeries.value, title, {
      subtitle,
      yAxisLabel: meta?.unit,
      measureKind: meta?.kind ?? 'scalar',
    })
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
        const id = `${code}-${variable.value}-${tranche.code}-${age.value}-${pop.value}`
        const match = byKey.get(id)
        const byYear = new Map<number, number>()
        for (const point of match?.points ?? []) {
          byYear.set(point.year, point.value)
        }
        return { tranche, byYear }
      }),
    }))
  }

  const loadScalar = async (code: string) => {
    const result = await scope.app.loadTimeSeries.execute({
      countryCodes: [code],
      params: {
        variable: variable.value,
        age: age.value,
        pop: pop.value,
      },
      countryLabel: scope.countryLabel.bind(scope),
    }, sourceOptions.value)

    if (result.series.length === 0) {
      scope.error.value = result.failures[0] ?? 'Échec du chargement des séries'
      scalarSeries.value = []
      chartOption.value = null
      return
    }

    scalarSeries.value = result.series
    if (result.failures.length > 0) {
      scope.loadWarning.value = result.failures.join(' · ')
    }
    rebuild()
  }

  const loadDecileRatios = async (code: string) => {
    const requests = OECD_DECILE_RATIO_IDS.map((ratioId) =>
      scope.app.loadTimeSeries.execute({
        countryCodes: [code],
        params: {
          variable: OECD_DECILE_BUNDLE_ID,
          age: '',
          pop: '',
          percentile: ratioId,
        },
        countryLabel: scope.countryLabel.bind(scope),
      }, sourceOptions.value),
    )

    const results = await Promise.all(requests)
    const allSeries: DataSeries[] = []
    const failures: string[] = []

    for (const result of results) {
      allSeries.push(...result.series)
      failures.push(...result.failures)
    }

    if (allSeries.length === 0) {
      scope.error.value = failures[0] ?? 'Échec du chargement des ratios déciles'
      scalarSeries.value = []
      chartOption.value = null
      return
    }

    scalarSeries.value = allSeries.map((series) => {
      const ratioId = String(series.metadata?.decileRatio ?? '')
      const ratioLabel = OECD_DECILE_RATIO_OPTIONS.find((item) => item.id === ratioId)?.label
      return ratioLabel ? { ...series, label: ratioLabel } : series
    })

    if (failures.length > 0) {
      scope.loadWarning.value = failures.join(' · ')
    }

    rebuild()
  }

  const loadPercentile = async (code: string) => {
    const tranches = activeTranches.value
    if (tranches.length === 0) {
      scope.error.value = partitionMode.value === 'custom'
        ? (customPartitionValidation.value.error ?? 'Choisissez au moins une borne de fin pour afficher la série.')
        : 'Aucune tranche sélectionnée'
      trancheSeriesByCountry.value = []
      chartOption.value = null
      return
    }

    const requests = tranches.map((tranche) =>
      scope.app.loadTimeSeries.execute({
        countryCodes: [code],
        params: {
          variable: variable.value,
          age: age.value,
          pop: pop.value,
          percentile: tranche.code,
        },
        countryLabel: scope.countryLabel.bind(scope),
      }, sourceOptions.value),
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
  }

  const load = async () => {
    const code = countryCode.value || 'FR'
    if (!countryCode.value) {
      countryCode.value = code
    }

    scope.loading.value = true
    scope.error.value = null
    scope.loadWarning.value = null

    try {
      if (hasPercentileProfile.value) {
        await loadPercentile(code)
      } else if (isDecileBundle.value) {
        await loadDecileRatios(code)
      } else {
        await loadScalar(code)
      }
    } catch (err) {
      scope.error.value = err instanceof Error ? err.message : 'Échec du chargement des séries'
      trancheSeriesByCountry.value = []
      scalarSeries.value = []
      chartOption.value = null
    } finally {
      scope.loading.value = false
    }
  }

  const init = async () => {
    await scope.initCountries(selectedSource.value, variable.value)
    if (hasPercentileProfile.value) {
      await constraints.loadCountriesForVariable(variable.value)
      await constraints.refreshConstraints('variableChange')
      if (activeBreakpoints.value.length > 0) {
        await load()
      }
    } else {
      await load()
    }
  }

  const refreshParamsAndLoad = async (mode: 'variableChange' | 'clamp') => {
    if (hasPercentileProfile.value) {
      const ready = await constraints.refreshConstraints(mode)
      if (!ready) {
        scope.error.value = constraints.constraintsError.value ?? 'Paramètres indisponibles pour cette sélection.'
        trancheSeriesByCountry.value = []
        scalarSeries.value = []
        chartOption.value = null
        return
      }
    }
    await load()
  }

  watch([countryCode, age, pop], () => {
    void refreshParamsAndLoad('clamp')
  })

  watch([partitionMode, customBreakpoints], () => {
    if (hasPercentileProfile.value) {
      void load()
    }
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
    countryCode,
    variable,
    age,
    pop,
    partitionMode,
    customBreakpoints,
    countries: panelCountries,
    variables: indicators,
    ageOptions: constraints.ageOptions,
    popOptions: constraints.popOptions,
    paramsLoading: constraints.constraintsLoading,
    yearRangeLabel: constraints.yearRangeLabel,
    partitionViewOptions,
    availableBoundaries,
    customPartitionValidation,
    customPartitionReady,
    customPartitionComplete,
    activeTranches,
    loading: scope.loading,
    error: scope.error,
    loadWarning: scope.loadWarning,
    trancheSeriesByCountry,
    scalarSeries,
    chartOption,
    variableMeta,
    hasPercentileProfile,
    hasDecileProfile,
    isDecileBundle,
    decileRatioOptions: OECD_DECILE_RATIO_OPTIONS,
    yearCountLabel: computed(() => {
      if (hasPercentileProfile.value) {
        return yearCountLabel(trancheSeriesByCountry.value.flatMap((country) =>
          country.tranches.flatMap((layer) => layer.byYear.size),
        ))
      }
      return yearCountLabel(scalarSeries.value.map((series) => series.points.length))
    }),
    trancheCountLabel,
    load,
    init,
  }
}
