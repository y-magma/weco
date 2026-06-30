import type { EChartsOption } from 'echarts'
import type { Ref } from 'vue'
import type { CountryOption, PercentileProfile, SourceIndicator } from '@domain/entities'
import {
  findWidVariable,
  supportsDistributionAnalytics,
  thresholdVariableFor,
  WID_STRICT_DISTRIBUTION_VARIABLES,
} from '@domain/catalog/widCodes'
import { useWidParamConstraints } from '~/composables/useWidParamConstraints'
import {
  buildDrilldownPoints,
  clampDrillLevel,
  DRILL_LEVELS,
  drillableCode,
  drillLevelLabel,
  MAX_DRILL_LEVEL,
  nextDrillLevel,
} from '~/visualization/drilldown'
import {
  buildPartitionPoints,
  buildStepBreakpoints,
  describeCustomIntervals,
  extractAvailableBoundaries,
  POPULATION_DISTRIBUTION_BREAKPOINTS,
  isCustomPartitionComplete,
  POPULATION_VIEW_OPTIONS,
  stepFromMode,
  TRAPEZOID_POPULATION_VIEW_OPTIONS,
  validatePartialCustomBreakpoints,
  type PopulationViewMode,
} from '~/visualization/populationPartition'
import {
  buildOriginalProfileOption,
  buildTrapezoidProfileOption,
} from '~/visualization/trapezoidChart'
import { buildProfileOption, type ProfileChartLayer } from '~/visualization/profile'
import type { SmoothDistributionMode } from '~/visualization/empiricalDistributionSmooth'
import {
  buildMeanPreservingNodes,
  computeIntervalMeans,
  type MeanPreservingApproximation,
  type TrapezoidMethod,
} from '~/visualization/trapezoidApproximation'
import {
  isWdiQuintileBundleVariable,
  isWorldBankExplorationProfileBundle,
  PIP_DECILE_BUNDLE_ID,
  PIP_DECILE_PROFILE_HELP,
  WDI_QUINTILE_PROFILE_HELP,
} from '@domain/catalog/decileBundles'
import type { ExplorationPanelSnapshot } from '@application/share/shareSnapshot'
import {
  applyExplorationSnapshot,
  serializeExplorationState,
  type ExplorationPanelRefs,
} from '@application/share/panelSnapshots'

export const TRAPEZOID_METHOD_OPTIONS: {
  value: TrapezoidMethod
  label: string
  hint: string
}[] = [
  {
    value: 'zero',
    label: 'Zéro',
    hint: 'Fixe y₀ = 0 (origine imposée).',
  },
  {
    value: 'anchor',
    label: 'Ancrage début',
    hint: 'Fixe y₀ à la valeur de la courbe au rang le plus bas.',
  },
  {
    value: 'leastSquares',
    label: 'Moindres carrés',
    hint: 'y₀ optimal pour minimiser l’écart quadratique à la courbe d’origine.',
  },
]

export const TRAPEZOID_ORIGINAL_VIEW_OPTIONS: {
  value: ProfileChartLayer
  label: string
}[] = [
  { value: 'line', label: 'Courbe' },
  { value: 'scatter', label: 'Nuage' },
  { value: 'bar', label: 'Bâtons' },
]

function defaultIndicatorId(indicators: readonly SourceIndicator[]): string {
  return indicators[0]?.id ?? 'ahweal'
}

function indicatorSupportsDistributionAnalytics(
  sourceId: string,
  indicatorId: string,
): boolean {
  if (sourceId === 'wid') return supportsDistributionAnalytics(indicatorId)
  const kind = findWidVariable(indicatorId)?.kind
  return kind === 'average' || kind === 'threshold' || kind === 'share'
}

function thresholdIndicatorFor(sourceId: string, indicatorId: string, indicators: readonly SourceIndicator[]): string {
  if (sourceId === 'wid') return thresholdVariableFor(indicatorId)
  const current = indicators.find((item) => item.id === indicatorId)
  if (!current?.concept) return indicatorId
  const pair = indicators.find(
    (item) => item.concept === current.concept && item.kind === 'threshold',
  )
  return pair?.id ?? indicatorId
}

export interface ExplorationPanelStateOptions {
  countries?: Ref<CountryOption[]>
  initialVariable?: string
  initialSnapshot?: ExplorationPanelSnapshot
  panelIndex?: number
}

export { applyExplorationSnapshot, serializeExplorationState }
export type { ExplorationPanelSnapshot }

export function createExplorationPanelState(options: ExplorationPanelStateOptions = {}) {
  const app = useApplication()
  const { selectedSource } = usePanneauDataSource()
  const sharedCountries = options.countries

  const hasPercentileProfile = computed(
    () => selectedSource.value.capabilities?.percentileProfile === true,
  )

  const hasDecileProfile = computed(
    () => selectedSource.value.capabilities?.decileProfile === true,
  )

  const hasProfile = computed(
    () => hasPercentileProfile.value || hasDecileProfile.value,
  )

  const hasDecileProfileOnly = computed(
    () => hasDecileProfile.value && !hasPercentileProfile.value,
  )

  const indicators = computed<readonly SourceIndicator[]>(
    () => selectedSource.value.indicators ?? [],
  )

  const countryCode = ref('FR')
  const variable = ref(
    options.initialVariable ?? defaultIndicatorId(indicators.value),
  )
  const year = ref(2021)
  const age = ref('992')
  const pop = ref('j')
  const method = ref<TrapezoidMethod>('zero')
  const showHistogram = ref(true)
  const showTrapezoids = ref(true)
  const logRichZoom = ref(false)
  const logScaleX = ref(false)
  const logScaleY = ref(false)
  const originalViewMode = ref<ProfileChartLayer>('line')
  const lorenzCurve = ref(false)
  const empiricalCdf = ref(false)
  const empiricalPdf = ref(false)
  const showEmpiricalDistribution = ref(true)
  const showSmoothDistribution = ref(false)
  const populationViewMode = ref<PopulationViewMode>('step1')
  const approxPartitionMode = ref<PopulationViewMode>('custom')
  const customBreakpoints = ref<number[]>([])
  const drillLevel = ref(0)
  const hiddenApproxIntervals = ref(new Set<number>())

  const explorationRefs: ExplorationPanelRefs = {
    countryCode,
    variable,
    year,
    age,
    pop,
    method,
    populationViewMode,
    approxPartitionMode,
    customBreakpoints,
    drillLevel,
    showHistogram,
    showTrapezoids,
    logRichZoom,
    logScaleX,
    logScaleY,
    originalViewMode,
    lorenzCurve,
    empiricalCdf,
    empiricalPdf,
    showEmpiricalDistribution,
    showSmoothDistribution,
    hiddenApproxIntervals,
  }

  if (options.initialSnapshot) {
    applyExplorationSnapshot(explorationRefs, options.initialSnapshot)
  }

  const shareSnapshot = options.initialSnapshot
  let shareRestorePending = Boolean(shareSnapshot)

  function reapplyShareSnapshotIfNeeded() {
    if (!shareRestorePending || !shareSnapshot) return
    applyExplorationSnapshot(explorationRefs, shareSnapshot)
    shareRestorePending = false
    rebuild()
  }

  const loading = ref(false)
  const error = ref<string | null>(null)

  const localCountries = ref<CountryOption[]>([])
  const sharedCountriesRef = sharedCountries ?? localCountries

  const decileYears = ref<number[]>([])
  const decileYearsLoading = ref(false)

  const constraints = useWidParamConstraints({
    app,
    source: selectedSource,
    variable,
    params: { countryCode, age, pop, year },
    countries: sharedCountriesRef,
    enabled: hasPercentileProfile,
  })

  const profile = ref<PercentileProfile | null>(null)
  const approximation = ref<MeanPreservingApproximation | null>(null)
  const chartOption = ref<EChartsOption | null>(null)

  const decileProfileHelp = computed(() =>
    isWdiQuintileBundleVariable(variable.value)
      ? WDI_QUINTILE_PROFILE_HELP
      : PIP_DECILE_PROFILE_HELP,
  )

  const variables = computed(() => {
    if (hasDecileProfileOnly.value) {
      return indicators.value.filter((item) => isWorldBankExplorationProfileBundle(item.id))
    }
    const nonGini = indicators.value.filter((item) => item.kind !== 'gini')
    if (!empiricalPdf.value) return nonGini
    if (selectedSource.value.id === 'wid') {
      const strictIds = new Set(WID_STRICT_DISTRIBUTION_VARIABLES.map((item) => item.sixlet))
      return nonGini.filter((item) => strictIds.has(item.id))
    }
    return nonGini.filter((item) => item.kind === 'threshold' || item.kind === 'other')
  })

  const countries = computed(() =>
    hasDecileProfileOnly.value ? sharedCountriesRef.value : constraints.countries.value,
  )
  const ageOptions = constraints.ageOptions
  const popOptions = constraints.popOptions
  const methodOptions = TRAPEZOID_METHOD_OPTIONS
  const originalViewOptions = TRAPEZOID_ORIGINAL_VIEW_OPTIONS
  const populationViewOptions = TRAPEZOID_POPULATION_VIEW_OPTIONS
  const partitionViewOptions = POPULATION_VIEW_OPTIONS

  const variableMeta = computed(() => {
    const match = indicators.value.find((item) => item.id === variable.value)
    if (match) return match
    if (selectedSource.value.id === 'wid') {
      const wid = findWidVariable(variable.value)
      if (!wid) return undefined
      return {
        id: wid.sixlet,
        label: wid.label,
        unit: wid.unit,
        kind: wid.kind,
        group: wid.group,
        groupLabel: wid.groupLabel,
        concept: wid.concept,
      } satisfies SourceIndicator
    }
    return undefined
  })

  const years = computed(() =>
    hasDecileProfileOnly.value ? decileYears.value : constraints.years.value,
  )
  const yearsLoading = computed(() =>
    hasDecileProfileOnly.value ? decileYearsLoading.value : constraints.constraintsLoading.value,
  )
  const decileYearRangeLabel = computed(() => {
    if (decileYears.value.length === 0) return ''
    const sorted = [...decileYears.value].sort((a, b) => a - b)
    return `${sorted[0]}–${sorted[sorted.length - 1]}`
  })
  const yearRangeLabel = computed(() =>
    hasDecileProfileOnly.value ? decileYearRangeLabel.value : constraints.yearRangeLabel.value,
  )
  const paramAdjustmentHints = constraints.paramAdjustmentHints
  const adjustmentToastVisible = constraints.adjustmentToastVisible
  const adjustmentToastMessage = constraints.adjustmentToastMessage

  const sourceOptions = computed(() => ({ source: selectedSource.value }))

  const availableBoundaries = computed(() =>
    profile.value ? extractAvailableBoundaries(profile.value.points) : [0, 100],
  )

  const customPartitionValidation = computed(() =>
    validatePartialCustomBreakpoints(customBreakpoints.value, availableBoundaries.value),
  )

  const customPartitionReady = computed(() => customPartitionValidation.value.valid)

  const customPartitionComplete = computed(() =>
    isCustomPartitionComplete(customBreakpoints.value) && customPartitionValidation.value.valid,
  )

  const supportsDrillDown = computed(() =>
    hasPercentileProfile.value && populationViewMode.value === 'step1',
  )

  const drillBreadcrumb = computed(() => {
    if (!supportsDrillDown.value) return []
    return Array.from({ length: drillLevel.value + 1 }, (_, level) => ({
      level,
      label: drillLevelLabel(level),
    }))
  })

  const currentDrillableCode = computed(() =>
    supportsDrillDown.value ? drillableCode(drillLevel.value) : null,
  )
  const canDrillDown = computed(() => currentDrillableCode.value !== null)

  const drillTo = (level: number) => {
    drillLevel.value = clampDrillLevel(level)
  }

  const drillDownTop = () => {
    if (canDrillDown.value) drillLevel.value = clampDrillLevel(drillLevel.value + 1)
  }

  const handleChartClick = (params: unknown) => {
    if (!supportsDrillDown.value) return
    const data = (params as { data?: { name?: string, point?: { percentile?: string } } })?.data
    const code = data?.name ?? data?.point?.percentile
    const target = nextDrillLevel(drillLevel.value, code)
    if (target !== null) drillLevel.value = clampDrillLevel(target)
  }

  const approxBreakpoints = computed<number[]>(() => {
    if (!profile.value) return []
    const mode = approxPartitionMode.value
    if (mode === 'custom') {
      return customPartitionReady.value ? customBreakpoints.value : []
    }
    if (mode === 'all') {
      return extractAvailableBoundaries(profile.value.points).filter((b) => b > 0)
    }
    if (mode === 'distribution') {
      return [...POPULATION_DISTRIBUTION_BREAKPOINTS]
    }
    const step = stepFromMode(mode)
    return step !== null ? buildStepBreakpoints(step) : []
  })

  const approxReady = computed(() => approxBreakpoints.value.length > 0)

  const approxIntervalLabels = computed(() =>
    describeCustomIntervals(approxBreakpoints.value),
  )

  const intervalCountLabel = computed(() => {
    const n = approxBreakpoints.value.length
    return approxReady.value ? `${n} intervalle(s)` : ''
  })

  const activeMethodHint = computed(() =>
    methodOptions.find((item) => item.value === method.value)?.hint ?? '',
  )

  const smoothDistributionMode = computed<SmoothDistributionMode>(() => {
    if (showEmpiricalDistribution.value && showSmoothDistribution.value) return 'both'
    if (showSmoothDistribution.value) return 'smooth'
    return 'empirical'
  })

  const isApproxIntervalVisible = (index: number) => !hiddenApproxIntervals.value.has(index)

  const toggleApproxIntervalVisibility = (index: number) => {
    const next = new Set(hiddenApproxIntervals.value)
    if (next.has(index)) next.delete(index)
    else next.add(index)
    hiddenApproxIntervals.value = next
  }

  const displayPoints = computed(() => {
    if (!profile.value) return []
    const points = profile.value.points
    if (hasDecileProfileOnly.value) {
      return [...points].sort((a, b) => a.rank - b.rank)
    }
    if (populationViewMode.value === 'all') {
      return [...points].sort((a, b) => a.rank - b.rank)
    }
    if (drillLevel.value > 0) {
      return buildDrilldownPoints(points, drillLevel.value)
    }
    const step = stepFromMode(populationViewMode.value)
    return buildPartitionPoints(points, buildStepBreakpoints(step ?? 1))
  })

  const chartOptionsBase = () => {
    const breakpoints = approxBreakpoints.value
    const drilled = supportsDrillDown.value && drillLevel.value > 0
    const rankExtentStart = drilled ? DRILL_LEVELS[drillLevel.value]!.lo : 0
    const rankExtentEnd = drilled
      ? 100
      : breakpoints.length > 0
        ? breakpoints[breakpoints.length - 1]
        : undefined
    return {
      ...chartMeta(),
      displayPoints: displayPoints.value,
      trapezoidBreakpoints: breakpoints.length > 0 ? breakpoints : undefined,
      showWatermarkBands: approxReady.value && showHistogram.value,
      showTrapezoids: showTrapezoids.value,
      logRichZoom: logRichZoom.value,
      logScaleX: logScaleX.value,
      logScaleY: logScaleY.value,
      originalViewMode: originalViewMode.value,
      rankExtentStart,
      rankExtentEnd,
      baseline: 0,
      hiddenIntervalIndices: hiddenApproxIntervals.value,
    }
  }

  const chartMeta = () => ({
    title: variableMeta.value?.label ?? variable.value,
    yAxisLabel: variableMeta.value?.unit,
  })

  const derivedViewActive = computed(() =>
    lorenzCurve.value || empiricalCdf.value || empiricalPdf.value,
  )

  const rebuild = () => {
    if (!profile.value) {
      approximation.value = null
      chartOption.value = null
      return
    }

    if (derivedViewActive.value) {
      approximation.value = null
      const displayed: PercentileProfile = { ...profile.value, points: displayPoints.value }
      chartOption.value = buildProfileOption(displayed, {
        chartType: originalViewMode.value,
        logScaleY: logScaleY.value,
        logScaleX: logScaleX.value,
        empiricalCdf: empiricalCdf.value,
        empiricalPdf: empiricalPdf.value,
        lorenzCurve: lorenzCurve.value,
        smoothDistributionMode: smoothDistributionMode.value,
        title: variableMeta.value?.label,
      })
      return
    }

    if (!approxReady.value) {
      approximation.value = null
      chartOption.value = buildOriginalProfileOption(profile.value, chartOptionsBase())
      return
    }

    const means = computeIntervalMeans(profile.value.points, approxBreakpoints.value)
    const built = buildMeanPreservingNodes(means, method.value, profile.value.points)
    approximation.value = built

    if (!built) {
      error.value = 'Impossible de calculer l’approximation (données manquantes sur un intervalle).'
      chartOption.value = buildOriginalProfileOption(profile.value, chartOptionsBase())
      return
    }

    chartOption.value = buildTrapezoidProfileOption(profile.value, built, chartOptionsBase())
  }

  const loadDecileCountries = async () => {
    sharedCountriesRef.value = await app.listCountries.execute(
      { variable: variable.value },
      sourceOptions.value,
    )
  }

  const loadDecileYears = async () => {
    decileYearsLoading.value = true
    try {
      decileYears.value = await app.listProfileYears.execute({
        countryCode: countryCode.value,
        variable: variable.value,
        age: '',
        pop: '',
      }, sourceOptions.value)
      if (decileYears.value.length > 0 && !decileYears.value.includes(year.value)) {
        year.value = decileYears.value[0]!
      }
    } finally {
      decileYearsLoading.value = false
    }
  }

  const loadCountries = async () => {
    if (hasDecileProfileOnly.value) {
      await loadDecileCountries()
      return
    }
    await constraints.loadCountriesForVariable(variable.value)
  }

  const refreshAndLoad = async (mode: 'variableChange' | 'clamp') => {
    if (!hasProfile.value) {
      error.value = 'Cette source ne propose pas de profil de distribution.'
      profile.value = null
      approximation.value = null
      chartOption.value = null
      return
    }
    if (hasDecileProfileOnly.value) {
      error.value = null
      await loadDecileYears()
      if (decileYears.value.length === 0) {
        error.value = 'Aucune année disponible pour ce pays.'
        profile.value = null
        approximation.value = null
        chartOption.value = null
        return
      }
      await load()
      return
    }
    const ready = await constraints.refreshConstraints(mode)
    if (constraints.constraintsError.value) {
      error.value = constraints.constraintsError.value
    } else {
      error.value = null
    }
    if (ready) {
      await load()
    } else {
      profile.value = null
      approximation.value = null
      chartOption.value = null
    }
  }

  const load = async () => {
    if (!hasProfile.value) {
      error.value = 'Cette source ne propose pas de profil de distribution.'
      profile.value = null
      approximation.value = null
      chartOption.value = null
      return
    }

    loading.value = true
    error.value = null
    if (!shareRestorePending) {
      drillLevel.value = 0
    }
    try {
      profile.value = await app.loadProfile.execute({
        countryCode: countryCode.value,
        variable: variable.value,
        year: year.value,
        age: age.value,
        pop: pop.value,
      }, sourceOptions.value)
      if (!shareRestorePending) {
        hiddenApproxIntervals.value = new Set()
        showEmpiricalDistribution.value = true
        showSmoothDistribution.value = false
      }
      rebuild()
      reapplyShareSnapshotIfNeeded()
    } catch (err) {
      profile.value = null
      approximation.value = null
      chartOption.value = null
      error.value = err instanceof Error ? err.message : 'Échec du chargement du profil'
    } finally {
      loading.value = false
    }
  }

  const init = async () => {
    if (!hasProfile.value) {
      error.value = 'Cette source ne propose pas de profil de distribution.'
      return
    }
    try {
      await loadCountries()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Échec du chargement des pays'
      return
    }
    if (hasDecileProfileOnly.value) {
      originalViewMode.value = 'bar'
      showHistogram.value = false
      showTrapezoids.value = false
    }
    await refreshAndLoad('variableChange')
  }

  watch([countryCode, age, pop], () => {
    if (hasDecileProfileOnly.value) {
      void loadDecileYears().then(() => load())
      return
    }
    void refreshAndLoad('clamp')
  })

  watch(variable, (next) => {
    customBreakpoints.value = []
    constraints.applyOptimisticDefaults(next)
    if (!indicatorSupportsDistributionAnalytics(selectedSource.value.id, next)) {
      empiricalCdf.value = false
      empiricalPdf.value = false
      lorenzCurve.value = false
    }
    void refreshAndLoad('variableChange')
  })

  watch(year, () => {
    if (years.value.includes(year.value)) void load()
  })

  watch(empiricalPdf, (enabled) => {
    if (enabled) {
      empiricalCdf.value = true
      lorenzCurve.value = false
      variable.value = thresholdIndicatorFor(
        selectedSource.value.id,
        variable.value,
        indicators.value,
      )
    }
  })

  watch(empiricalCdf, (enabled) => {
    if (!enabled) empiricalPdf.value = false
    if (enabled) lorenzCurve.value = false
  })

  watch(lorenzCurve, (enabled) => {
    if (enabled) {
      empiricalCdf.value = false
      empiricalPdf.value = false
      logScaleX.value = false
      logScaleY.value = false
      logRichZoom.value = false
    }
  })

  watch([showEmpiricalDistribution, showSmoothDistribution], ([empirical, smooth]) => {
    if (!empirical && !smooth) showEmpiricalDistribution.value = true
  })

  watch(
    [method, showHistogram, showTrapezoids, logRichZoom, logScaleX, logScaleY, originalViewMode, customBreakpoints, populationViewMode, approxPartitionMode, hiddenApproxIntervals, drillLevel, lorenzCurve, empiricalCdf, empiricalPdf, showEmpiricalDistribution, showSmoothDistribution],
    rebuild,
    { deep: true },
  )

  watch(logRichZoom, (on) => {
    if (on) logScaleX.value = false
  })

  watch(logScaleX, (on) => {
    if (on) logRichZoom.value = false
  })

  watch(populationViewMode, () => {
    drillLevel.value = 0
  })

  watch(approxBreakpoints, (breakpoints) => {
    const next = new Set<number>()
    for (const index of hiddenApproxIntervals.value) {
      if (index >= 0 && index < breakpoints.length) next.add(index)
    }
    hiddenApproxIntervals.value = next
  })

  watch(profile, (nextProfile, oldProfile) => {
    if (!oldProfile) return
    customBreakpoints.value = []
    drillLevel.value = 0
    hiddenApproxIntervals.value = new Set()
  })

  watch(() => selectedSource.value.id, async (newSourceId, oldSourceId) => {
    if (shareRestorePending && oldSourceId === undefined) {
      await loadCountries()
      await refreshAndLoad('variableChange')
      return
    }
    const panelIndex = options.panelIndex ?? 0
    const indicatorList = selectedSource.value.indicators ?? []
    const nextVariable = hasDecileProfileOnly.value
      ? PIP_DECILE_BUNDLE_ID
      : indicatorList[panelIndex]?.id ?? defaultIndicatorId(indicatorList)
    variable.value = nextVariable
    customBreakpoints.value = []
    profile.value = null
    approximation.value = null
    chartOption.value = null
    if (!hasProfile.value) {
      error.value = 'Cette source ne propose pas de profil de distribution.'
      return
    }
    error.value = null
    if (hasDecileProfileOnly.value) {
      originalViewMode.value = 'bar'
      showHistogram.value = false
      showTrapezoids.value = false
    }
    await loadCountries()
    await refreshAndLoad('variableChange')
  })

  return {
    countryCode,
    variable,
    year,
    age,
    pop,
    method,
    showHistogram,
    showTrapezoids,
    logRichZoom,
    logScaleX,
    logScaleY,
    originalViewMode,
    lorenzCurve,
    empiricalCdf,
    empiricalPdf,
    showEmpiricalDistribution,
    showSmoothDistribution,
    smoothDistributionMode,
    derivedViewActive,
    populationViewMode,
    approxPartitionMode,
    customBreakpoints,
    countries,
    variables,
    ageOptions,
    popOptions,
    methodOptions,
    originalViewOptions,
    populationViewOptions,
    partitionViewOptions,
    years,
    yearsLoading,
    yearRangeLabel,
    paramAdjustmentHints,
    adjustmentToastVisible,
    adjustmentToastMessage,
    loading,
    error,
    profile,
    approximation,
    chartOption,
    variableMeta,
    hasPercentileProfile,
    hasDecileProfile,
    hasDecileProfileOnly,
    hasProfile,
    decileProfileHelp,
    availableBoundaries,
    customPartitionValidation,
    customPartitionReady,
    customPartitionComplete,
    drillLevel,
    drillBreadcrumb,
    currentDrillableCode,
    canDrillDown,
    supportsDrillDown,
    maxDrillLevel: MAX_DRILL_LEVEL,
    drillTo,
    drillDownTop,
    handleChartClick,
    approxReady,
    intervalCountLabel,
    serializeSnapshot: () => serializeExplorationState(explorationRefs),
    applySnapshot: (snapshot: ExplorationPanelSnapshot) => {
      applyExplorationSnapshot(explorationRefs, snapshot)
    },
    approxIntervalLabels,
    isApproxIntervalVisible,
    toggleApproxIntervalVisibility,
    hiddenApproxIntervals,
    activeMethodHint,
    load,
    init,
    rebuild,
  }
}
