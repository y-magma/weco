import type { EChartsOption } from 'echarts'
import { buildProfileOption, computeProfileValueExtent } from '@src/charts/profile'
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
  WID_V1_VARIABLES,
} from '@src/data-sources/wid/widCodes'

const YEARS = Array.from({ length: 2023 - 1980 + 1 }, (_, i) => 1980 + i).reverse()

/**
 * Shared WID Version-1 controls + the average/threshold profile view.
 * See spec/version1.md (graphe #2).
 */
export function useWidProfile() {
  const { defaultSource } = useDataSources()

  const countryCode = ref('FR')
  const variable = ref('ahweal')
  const year = ref(2021)
  const age = ref(WID_DEFAULT_AGE)
  const pop = ref(WID_DEFAULT_POP)
  const chartType = ref<'bar' | 'scatter' | 'line'>('line')
  const logScaleY = ref(false)
  const logScaleX = ref(false)
  const populationDensity = ref(false)
  const probabilityDensity = ref(false)
  const valueZoomRange = ref<[number, number]>([0, 1])
  const drillLevel = ref(0)
  const showAllPercentiles = ref(false)

  const loading = ref(false)
  const error = ref<string | null>(null)
  const sampleMode = ref(false)

  const countries = ref<CountryOption[]>([])
  const profile = ref<PercentileProfile | null>(null)
  const profileOption = ref<EChartsOption | null>(null)

  const variables = WID_V1_VARIABLES
  const ageOptions = WID_AGE_OPTIONS
  const popOptions = WID_POP_OPTIONS
  const years = YEARS

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

  const profileValueExtent = computed(() =>
    displayPoints.value.length ? computeProfileValueExtent(displayPoints.value) : null,
  )

  const valueZoomHint = computed(() =>
    populationDensity.value || probabilityDensity.value
      ? 'Recadre richesse (X) et population % (Y) sur la plage choisie.'
      : 'Recadre valeur (Y) et population % (X) sur la plage choisie.',
  )

  const valueZoomStep = computed(() => {
    const extent = profileValueExtent.value
    if (!extent) return 1
    const span = extent.max - extent.min
    if (span <= 0) return 1
    const raw = span / 200
    const mag = 10 ** Math.floor(Math.log10(raw))
    return Math.max(1, Math.ceil(raw / mag) * mag)
  })

  const valueZoomEnabled = computed(() => {
    const extent = profileValueExtent.value
    if (!extent) return false
    const [lo, hi] = valueZoomRange.value
    const eps = Math.max(valueZoomStep.value / 2, (extent.max - extent.min) * 1e-9)
    return lo > extent.min + eps || hi < extent.max - eps
  })

  const syncValueZoomBounds = () => {
    const extent = profileValueExtent.value
    if (!extent) return
    valueZoomRange.value = [extent.min, extent.max]
  }

  const resetValueZoom = () => {
    syncValueZoomBounds()
  }

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
    try {
      countries.value = await widSource().listCountries()
    } catch {
      countries.value = [{ code: 'FR', label: 'France' }]
    }
  }

  const rebuild = () => {
    if (!profile.value) {
      profileOption.value = null
      return
    }
    const valueRange = valueZoomEnabled.value
      ? { min: valueZoomRange.value[0], max: valueZoomRange.value[1] }
      : undefined
    const displayed: PercentileProfile = { ...profile.value, points: displayPoints.value }
    profileOption.value = buildProfileOption(displayed, {
      chartType: chartType.value,
      logScaleY: logScaleY.value,
      logScaleX: logScaleX.value,
      populationDensity: populationDensity.value,
      probabilityDensity: probabilityDensity.value,
      valueRange,
    })
  }

  const load = async () => {
    loading.value = true
    error.value = null
    drillLevel.value = 0
    try {
      const source = widSource()
      sampleMode.value = source.isSampleMode()
      profile.value = await source.fetchPercentileProfile({
        countryCode: countryCode.value,
        variable: variable.value,
        year: year.value,
        age: age.value,
        pop: pop.value,
      })
      sampleMode.value = profile.value.sample
      syncValueZoomBounds()
      rebuild()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Échec du chargement du profil'
    } finally {
      loading.value = false
    }
  }

  watch([countryCode, variable, year, age, pop], load)
  watch(probabilityDensity, (enabled) => {
    if (enabled) populationDensity.value = true
  })
  watch(populationDensity, (enabled) => {
    if (!enabled) probabilityDensity.value = false
  })
  watch([chartType, logScaleY, logScaleX, populationDensity, probabilityDensity], rebuild)
  watch(valueZoomRange, rebuild, { deep: true })
  watch([drillLevel, showAllPercentiles], () => {
    syncValueZoomBounds()
    rebuild()
  })

  onMounted(async () => {
    await loadCountries()
    await load()
  })

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
    countries,
    variables,
    ageOptions,
    popOptions,
    years,
    loading,
    error,
    sampleMode,
    valueZoomRange,
    valueZoomStep,
    valueZoomEnabled,
    profileValueExtent,
    valueZoomHint,
    resetValueZoom,
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
    load,
  }
}
