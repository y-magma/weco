import type { EChartsOption } from 'echarts'
import type { Ref } from 'vue'
import { buildProfileOption } from '@src/charts/profile'
import {
  buildDrilldownPoints,
  clampDrillLevel,
  drillableCode,
  drillLevelLabel,
  MAX_DRILL_LEVEL,
  nextDrillLevel,
} from '@src/charts/drilldown'
import type { CountryOption, PercentileProfile } from '@src/domain/types'
import type { WidDataSource } from '@src/data-sources/wid/widSource'
import {
  WID_AGE_OPTIONS,
  WID_DEFAULT_AGE,
  WID_DEFAULT_POP,
  WID_POP_OPTIONS,
  WID_THRESHOLD_VARIABLES,
  WID_PROFILE_VARIABLES,
  WID_G_PERCENTILE_COUNT,
  thresholdVariableFor,
} from '@src/data-sources/wid/widCodes'

export interface WidProfileStateOptions {
  /** Shared country list (avoids N parallel fetches in multi-panel grids). */
  countries?: Ref<CountryOption[]>
  initialVariable?: string
}

/**
 * Independent profile toolbox state. Instantiate once per visualization panel.
 * See spec/version1.md (graphe #2).
 */
export function createWidProfileState(options: WidProfileStateOptions = {}) {
  const { defaultSource } = useDataSources()
  const sharedCountries = options.countries

  const countryCode = ref('FR')
  const variable = ref(options.initialVariable ?? 'ahweal')
  const year = ref(2021)
  const age = ref(WID_DEFAULT_AGE)
  const pop = ref(WID_DEFAULT_POP)
  const chartType = ref<'bar' | 'scatter' | 'line'>('line')
  const logScaleY = ref(false)
  const logScaleX = ref(false)
  const populationDensity = ref(false)
  const probabilityDensity = ref(false)
  const lorenzCurve = ref(false)
  const drillLevel = ref(0)
  const showAllPercentiles = ref(false)

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

  const widSource = () => defaultSource.value as WidDataSource

  const displayPoints = computed(() => {
    if (!profile.value) return []
    if (showAllPercentiles.value) {
      return [...profile.value.points].sort((a, b) => a.rank - b.rank)
    }
    return buildDrilldownPoints(profile.value.points, drillLevel.value)
  })

  const drillBreadcrumb = computed(() =>
    Array.from({ length: drillLevel.value + 1 }, (_, level) => ({
      level,
      label: drillLevelLabel(level),
    })),
  )

  const currentDrillableCode = computed(() =>
    showAllPercentiles.value ? null : drillableCode(drillLevel.value),
  )
  const canDrillDown = computed(() => currentDrillableCode.value !== null)

  const drillTo = (level: number) => {
    drillLevel.value = clampDrillLevel(level)
  }

  const drillDownTop = () => {
    if (canDrillDown.value) drillLevel.value = clampDrillLevel(drillLevel.value + 1)
  }

  const handleChartClick = (params: unknown) => {
    const data = (params as { data?: { name?: string, point?: { percentile?: string } } })?.data
    const code = data?.name ?? data?.point?.percentile
    const target = nextDrillLevel(drillLevel.value, code)
    if (target !== null) drillLevel.value = clampDrillLevel(target)
  }

  const loadCountries = async () => {
    if (countries.value.length > 0) return
    countries.value = await widSource().listCountries()
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
      availableYears.value = await widSource().listProfileYears({
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
    profileOption.value = buildProfileOption(displayed, {
      chartType: chartType.value,
      logScaleY: logScaleY.value,
      logScaleX: logScaleX.value,
      populationDensity: populationDensity.value,
      probabilityDensity: probabilityDensity.value,
      lorenzCurve: lorenzCurve.value,
    })
  }

  const load = async () => {
    loading.value = true
    error.value = null
    drillLevel.value = 0
    try {
      profile.value = await widSource().fetchPercentileProfile({
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
  watch([chartType, logScaleY, logScaleX, populationDensity, probabilityDensity, lorenzCurve], rebuild)
  watch([drillLevel, showAllPercentiles], rebuild)

  return {
    countryCode,
    variable,
    year,
    age,
    pop,
    chartType,
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
    drillLevel,
    drillBreadcrumb,
    currentDrillableCode,
    canDrillDown,
    showAllPercentiles,
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
