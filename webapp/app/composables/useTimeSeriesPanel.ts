import type { EChartsOption } from 'echarts'
import type { Ref } from 'vue'
import { buildStackedShareTimeSeriesOption, buildStackedTimeSeriesOption, buildTimeSeriesOption, type CountryTrancheSeries, type TrancheStackMode } from '~/visualization/timeSeries'
import type { CountryOption, DataSeries } from '@domain/entities'
import type { TimeSeriesPopulationMode } from '@domain/panelState'
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
  type TimeSeriesTranche,
} from '~/visualization/timeSeriesPartition'
import { yearCountLabel } from '~/composables/panelBase'
import { createTimeSeriesSharedContext, defaultTimeSeriesVariable } from '~/composables/timeSeriesPanelShared'
import {
  decileBundleSubIdsForLoad,
  labelForDecileBundleSub,
} from '@domain/catalog/decileBundles'
import type { TimeSeriesPanelSnapshot } from '@application/share/shareSnapshot'
import {
  applyTimeSeriesSnapshot,
  serializeTimeSeriesState,
  type TimeSeriesPanelRefs,
} from '@application/share/panelSnapshots'

export interface TimeSeriesPanelStateOptions {
  countries?: Ref<CountryOption[]>
  initialVariable?: string
  initialCountryCode?: string
  initialSnapshot?: TimeSeriesPanelSnapshot
  panelIndex?: number
}

export { applyTimeSeriesSnapshot, serializeTimeSeriesState }
export type { TimeSeriesPanelSnapshot }

export function createTimeSeriesPanelState(options: TimeSeriesPanelStateOptions = {}) {
  const countryCode = ref(options.initialCountryCode ?? 'FR')
  const shared = createTimeSeriesSharedContext({
    countries: options.countries,
    panelIndex: options.panelIndex,
    initialVariable: options.initialVariable,
    constraintsCountryCode: countryCode,
  })
  const { scope } = shared

  const partitionMode = ref<TimeSeriesPopulationMode>('distribution')
  const customBreakpoints = ref<number[]>([])
  const stackMode = ref<TrancheStackMode>('weighted')

  const timeSeriesRefs: TimeSeriesPanelRefs = {
    countryCode,
    variable: shared.variable,
    age: shared.age,
    pop: shared.pop,
    partitionMode,
    customBreakpoints,
  }

  if (options.initialSnapshot) {
    applyTimeSeriesSnapshot(timeSeriesRefs, options.initialSnapshot)
  }

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
    if (!shared.hasPercentileProfile.value) return []
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

  const clearChart = () => {
    trancheSeriesByCountry.value = []
    scalarSeries.value = []
    chartOption.value = null
  }

  const rebuild = () => {
    if (shared.hasPercentileProfile.value) {
      if (trancheSeriesByCountry.value.length === 0) {
        chartOption.value = null
        return
      }
      const meta = shared.variableMeta.value
      const title = meta?.label ?? shared.variable.value
      const subtitle = `${trancheSeriesByCountry.value[0]!.countryLabel} · par tranche de population`
      chartOption.value = buildStackedTimeSeriesOption(
        trancheSeriesByCountry.value,
        title,
        subtitle,
        meta?.unit,
        meta?.kind ?? 'average',
        stackMode.value,
      )
      return
    }

    if (scalarSeries.value.length === 0) {
      chartOption.value = null
      return
    }
    const meta = shared.variableMeta.value
    const title = meta?.label ?? shared.variable.value
    const subtitle = shared.isDecileBundle.value
      ? `${scope.countryLabel(countryCode.value)} · ${shared.decileBundleConfig.value?.seriesSubtitle ?? 'bundle décile'}`
      : `${scope.countryLabel(countryCode.value)} · série annuelle`
    chartOption.value = shared.isDecileBundle.value
      ? buildStackedShareTimeSeriesOption(scalarSeries.value, title, {
          subtitle,
          yAxisLabel: meta?.unit,
          measureKind: meta?.kind ?? 'share',
        })
      : buildTimeSeriesOption(scalarSeries.value, title, {
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
        const id = `${code}-${shared.variable.value}-${tranche.code}-${shared.age.value}-${shared.pop.value}`
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
        variable: shared.variable.value,
        age: shared.age.value,
        pop: shared.pop.value,
      },
      countryLabel: scope.countryLabel.bind(scope),
    }, shared.sourceOptions.value)

    if (result.series.length === 0) {
      scope.error.value = result.failures[0] ?? 'Échec du chargement des séries'
      clearChart()
      return
    }

    scalarSeries.value = result.series
    if (result.failures.length > 0) {
      scope.loadWarning.value = result.failures.join(' · ')
    }
    rebuild()
  }

  const loadDecileBundle = async (code: string) => {
    const bundleConfig = shared.decileBundleConfig.value
    if (!bundleConfig) {
      scope.error.value = 'Configuration bundle décile introuvable.'
      return
    }

    const subIds = decileBundleSubIdsForLoad(shared.variable.value)
    const requests = subIds.map((subId) =>
      scope.app.loadTimeSeries.execute({
        countryCodes: [code],
        params: {
          variable: bundleConfig.bundleId,
          age: '',
          pop: '',
          percentile: subId,
        },
        countryLabel: scope.countryLabel.bind(scope),
      }, shared.sourceOptions.value),
    )

    const results = await Promise.all(requests)
    const allSeries: DataSeries[] = []
    const failures: string[] = []

    for (const result of results) {
      allSeries.push(...result.series)
      failures.push(...result.failures)
    }

    if (allSeries.length === 0) {
      scope.error.value = failures[0] ?? 'Échec du chargement du bundle décile'
      clearChart()
      return
    }

    scalarSeries.value = allSeries.map((series) => {
      const subId = String(series.metadata?.decileRatio ?? '')
      const subLabel = labelForDecileBundleSub(shared.variable.value, subId)
      return subLabel ? { ...series, label: subLabel } : series
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
          variable: shared.variable.value,
          age: shared.age.value,
          pop: shared.pop.value,
          percentile: tranche.code,
        },
        countryLabel: scope.countryLabel.bind(scope),
      }, shared.sourceOptions.value),
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
      if (shared.hasPercentileProfile.value) {
        await loadPercentile(code)
      } else if (shared.isDecileBundle.value) {
        await loadDecileBundle(code)
      } else {
        await loadScalar(code)
      }
    } catch (err) {
      scope.error.value = err instanceof Error ? err.message : 'Échec du chargement des séries'
      clearChart()
    } finally {
      scope.loading.value = false
    }
  }

  const init = async () => {
    await scope.initCountries(shared.selectedSource.value, shared.variable.value)
    if (shared.hasPercentileProfile.value) {
      await shared.constraints.loadCountriesForVariable(shared.variable.value)
      await shared.constraints.refreshConstraints('variableChange')
      if (activeBreakpoints.value.length > 0) {
        await load()
      }
    } else {
      await load()
    }
  }

  watch([countryCode, shared.age, shared.pop], () => {
    void shared.refreshParamsAndLoad('clamp', load, clearChart)
  })

  watch([partitionMode, customBreakpoints], () => {
    if (shared.hasPercentileProfile.value) {
      void load()
    }
  }, { deep: true })

  watch(stackMode, () => {
    if (shared.hasPercentileProfile.value && trancheSeriesByCountry.value.length > 0) {
      rebuild()
    }
  })

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
    if (shared.hasPercentileProfile.value) {
      await shared.constraints.loadCountriesForVariable(shared.variable.value)
      await shared.constraints.refreshConstraints('variableChange')
    }
    await load()
  })

  return {
    countryCode,
    variable: shared.variable,
    age: shared.age,
    pop: shared.pop,
    partitionMode,
    customBreakpoints,
    stackMode,
    countries: shared.panelCountries,
    variables: shared.indicators,
    ageOptions: shared.constraints.ageOptions,
    popOptions: shared.constraints.popOptions,
    paramsLoading: shared.constraints.constraintsLoading,
    yearRangeLabel: shared.constraints.yearRangeLabel,
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
    variableMeta: shared.variableMeta,
    hasPercentileProfile: shared.hasPercentileProfile,
    hasDecileProfile: shared.hasDecileProfile,
    isDecileBundle: shared.isDecileBundle,
    decileBundleOptions: shared.decileBundleOptions,
    decileBundleConfig: shared.decileBundleConfig,
    yearCountLabel: computed(() => {
      if (shared.hasPercentileProfile.value) {
        return yearCountLabel(trancheSeriesByCountry.value.flatMap((country) =>
          country.tranches.flatMap((layer) => layer.byYear.size),
        ))
      }
      return yearCountLabel(scalarSeries.value.map((series) => series.points.length))
    }),
    trancheCountLabel,
    serializeSnapshot: () => serializeTimeSeriesState(timeSeriesRefs),
    applySnapshot: (snapshot: TimeSeriesPanelSnapshot) => {
      applyTimeSeriesSnapshot(timeSeriesRefs, snapshot)
    },
    load,
    init,
  }
}
