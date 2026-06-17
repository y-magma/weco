import type { EChartsOption } from 'echarts'
import type { Ref } from 'vue'
import {
  buildProfileOption,
  normalizeChartTypeLayers,
  resolveProfileChartType,
  chartTypeLayersEqual,
  overlaySeriesType,
  type ProfileChartLayer,
} from '~/visualization/profile'
import {
  buildDrilldownPoints,
  clampDrillLevel,
  drillableCode,
  drillLevelLabel,
  MAX_DRILL_LEVEL,
  nextDrillLevel,
} from '~/visualization/drilldown'
import {
  buildPartitionPoints,
  buildStepBreakpoints,
  extractAvailableBoundaries,
  isCustomPartitionComplete,
  stepFromMode,
  validatePartialCustomBreakpoints,
  type PopulationViewMode,
} from '~/visualization/populationPartition'
import type { CountryOption, PercentileProfile } from '@domain/entities'
import {
  WID_AGE_OPTIONS,
  WID_DEFAULT_AGE,
  WID_DEFAULT_POP,
  WID_POP_OPTIONS,
  WID_THRESHOLD_VARIABLES,
  WID_PROFILE_VARIABLES,
  WID_G_PERCENTILE_COUNT,
  thresholdVariableFor,
} from '@domain/catalog/widCodes'

export interface WidProfileStateOptions {
  countries?: Ref<CountryOption[]>
  initialVariable?: string
}

export function createWidProfileState(options: WidProfileStateOptions = {}) {
  const app = useApplication()
  const sharedCountries = options.countries

  const countryCode = ref('FR')
  const variable = ref(options.initialVariable ?? 'ahweal')
  const year = ref(2021)
  const age = ref(WID_DEFAULT_AGE)
  const pop = ref(WID_DEFAULT_POP)
  const chartTypeLayers = ref<ProfileChartLayer[]>(['bar'])
  const logScaleY = ref(false)
  const logScaleX = ref(false)
  const populationDensity = ref(false)
  const probabilityDensity = ref(false)
  const lorenzCurve = ref(false)
  const populationViewMode = ref<PopulationViewMode>('step1')
  const customBreakpoints = ref<number[]>([])
  const drillLevel = ref(0)

  const loading = ref(false)
  const yearsLoading = ref(false)
  const error = ref<string | null>(null)

  const localCountries = ref<CountryOption[]>([])
  const countries = sharedCountries ?? localCountries
  const availableYears = ref<number[]>([])
  const profile = ref<PercentileProfile | null>(null)
  const profileOption = ref<EChartsOption | null>(null)

  const variables = computed(() =>
    probabilityDensity.value ? WID_THRESHOLD_VARIABLES : WID_PROFILE_VARIABLES,
  )
  const ageOptions = WID_AGE_OPTIONS
  const popOptions = WID_POP_OPTIONS
  const years = computed(() => availableYears.value)
  const yearRangeLabel = computed(() => {
    const list = availableYears.value
    if (list.length === 0) return ''
    const min = list[list.length - 1]!
    const max = list[0]!
    return min === max ? `${max}` : `${min}–${max}`
  })

  const profilePointCount = computed(() => profile.value?.points.length ?? 0)
  const profilePointCountLabel = computed(() => {
    const n = profilePointCount.value
    if (n === 0) return ''
    if (n >= WID_G_PERCENTILE_COUNT) return `${n} g-percentiles`
    return `${n} / ${WID_G_PERCENTILE_COUNT} g-percentiles`
  })
  const profilePartialData = computed(
    () => profilePointCount.value > 0 && profilePointCount.value < WID_G_PERCENTILE_COUNT,
  )

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
    populationViewMode.value === 'step1' && customBreakpoints.value.length === 0,
  )

  const displayPoints = computed(() => {
    if (!profile.value) return []
    const points = profile.value.points
    const mode = populationViewMode.value

    if (mode === 'all') {
      return [...points].sort((a, b) => a.rank - b.rank)
    }

    if (mode === 'custom') {
      if (!customPartitionReady.value) return []
      return buildPartitionPoints(points, customBreakpoints.value)
    }

    const step = stepFromMode(mode)
    if (step === 1 && drillLevel.value > 0) {
      return buildDrilldownPoints(points, drillLevel.value)
    }
    if (step !== null) {
      return buildPartitionPoints(points, buildStepBreakpoints(step))
    }

    return []
  })

  /** Points fins pour la superposition ligne/nuage (127 g-percentiles bruts). */
  const overlayDisplayPoints = computed(() => {
    if (!profile.value) return []
    return [...profile.value.points].sort((a, b) => a.rank - b.rank)
  })

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

  const loadCountries = async () => {
    if (countries.value.length > 0) return
    countries.value = await app.listCountries.execute()
  }

  const syncYearToAvailable = () => {
    const list = availableYears.value
    if (list.length === 0) return
    if (!list.includes(year.value)) year.value = list[0]!
  }

  const refreshYears = async () => {
    if (!countryCode.value) {
      availableYears.value = []
      return
    }

    yearsLoading.value = true
    try {
      availableYears.value = await app.listProfileYears.execute({
        countryCode: countryCode.value,
        variable: variable.value,
        age: age.value,
        pop: pop.value,
      })
      syncYearToAvailable()
    } catch (err) {
      availableYears.value = []
      error.value = err instanceof Error ? err.message : 'Échec du chargement des années disponibles'
    } finally {
      yearsLoading.value = false
    }
  }

  const rebuild = () => {
    if (!profile.value) {
      profileOption.value = null
      return
    }
    const displayed: PercentileProfile = { ...profile.value, points: displayPoints.value }
    const chartType = resolveProfileChartType(chartTypeLayers.value)
    profileOption.value = buildProfileOption(displayed, {
      chartType,
      logScaleY: logScaleY.value,
      logScaleX: logScaleX.value,
      populationDensity: populationDensity.value,
      probabilityDensity: probabilityDensity.value,
      lorenzCurve: lorenzCurve.value,
      overlayPoints: overlaySeriesType(chartType)
        ? overlayDisplayPoints.value
        : undefined,
    })
  }

  const load = async () => {
    loading.value = true
    error.value = null
    drillLevel.value = 0
    try {
      profile.value = await app.loadProfile.execute({
        countryCode: countryCode.value,
        variable: variable.value,
        year: year.value,
        age: age.value,
        pop: pop.value,
      })
      rebuild()
    } catch (err) {
      profile.value = null
      profileOption.value = null
      error.value = err instanceof Error ? err.message : 'Échec du chargement du profil'
    } finally {
      loading.value = false
    }
  }

  const init = async () => {
    try {
      await loadCountries()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Échec du chargement des pays'
      return
    }
    await refreshYears()
    if (availableYears.value.length > 0) await load()
  }

  watch([countryCode, variable, age, pop], async () => {
    await refreshYears()
    if (availableYears.value.length > 0) await load()
  })

  watch(year, () => {
    if (availableYears.value.includes(year.value)) void load()
  })
  watch(probabilityDensity, (enabled) => {
    if (enabled) {
      populationDensity.value = true
      lorenzCurve.value = false
      variable.value = thresholdVariableFor(variable.value)
    }
  })
  watch(populationDensity, (enabled) => {
    if (!enabled) probabilityDensity.value = false
    if (enabled) lorenzCurve.value = false
  })
  watch(lorenzCurve, (enabled) => {
    if (enabled) {
      populationDensity.value = false
      probabilityDensity.value = false
      logScaleX.value = false
      logScaleY.value = false
    }
  })
  watch(chartTypeLayers, (next, prev) => {
    const normalized = normalizeChartTypeLayers(next, prev.length > 0 ? prev : ['bar'])
    if (!chartTypeLayersEqual(normalized, next)) {
      chartTypeLayers.value = normalized
    }
  }, { deep: true })
  watch([chartTypeLayers, logScaleY, logScaleX, populationDensity, probabilityDensity, lorenzCurve], rebuild)
  watch([drillLevel, populationViewMode, customBreakpoints], rebuild, { deep: true })

  watch(populationViewMode, (mode) => {
    drillLevel.value = 0
    if (mode !== 'custom') customBreakpoints.value = []
  })

  watch(profile, () => {
    customBreakpoints.value = []
    drillLevel.value = 0
  })

  return {
    countryCode,
    variable,
    year,
    age,
    pop,
    chartTypeLayers,
    logScaleY,
    logScaleX,
    populationDensity,
    probabilityDensity,
    lorenzCurve,
    countries,
    variables,
    ageOptions,
    popOptions,
    years,
    yearsLoading,
    yearRangeLabel,
    loading,
    error,
    populationViewMode,
    customBreakpoints,
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
    profile,
    profileOption,
    profilePointCount,
    profilePointCountLabel,
    profilePartialData,
    load,
    init,
  }
}
