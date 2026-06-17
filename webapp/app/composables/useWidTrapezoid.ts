import type { EChartsOption } from 'echarts'
import type { Ref } from 'vue'
import type { CountryOption, PercentileProfile } from '@domain/entities'
import {
  findWidVariable,
  WID_AGE_OPTIONS,
  WID_DEFAULT_AGE,
  WID_DEFAULT_POP,
  WID_POP_OPTIONS,
  WID_PROFILE_VARIABLES,
} from '@domain/catalog/widCodes'
import {
  buildPartitionPoints,
  buildStepBreakpoints,
  extractAvailableBoundaries,
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
import {
  buildMeanPreservingNodes,
  computeIntervalMeans,
  type MeanPreservingApproximation,
  type TrapezoidMethod,
} from '~/visualization/trapezoidApproximation'

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

export interface WidTrapezoidStateOptions {
  countries?: Ref<CountryOption[]>
  initialVariable?: string
}

export function createWidTrapezoidState(options: WidTrapezoidStateOptions = {}) {
  const app = useApplication()
  const sharedCountries = options.countries

  const countryCode = ref('FR')
  const variable = ref(options.initialVariable ?? 'ahweal')
  const year = ref(2021)
  const age = ref(WID_DEFAULT_AGE)
  const pop = ref(WID_DEFAULT_POP)
  const method = ref<TrapezoidMethod>('zero')
  const showHistogram = ref(true)
  const showTrapezoids = ref(true)
  // Granularité d'affichage de la courbe d'origine (paramètres avancés).
  const populationViewMode = ref<PopulationViewMode>('step1')
  // Tranches de population servant d'intervalles d'approximation (sélecteur migré du profil).
  const approxPartitionMode = ref<PopulationViewMode>('custom')
  const customBreakpoints = ref<number[]>([])

  const loading = ref(false)
  const yearsLoading = ref(false)
  const error = ref<string | null>(null)

  const localCountries = ref<CountryOption[]>([])
  const countries = sharedCountries ?? localCountries
  const availableYears = ref<number[]>([])
  const profile = ref<PercentileProfile | null>(null)
  const approximation = ref<MeanPreservingApproximation | null>(null)
  const chartOption = ref<EChartsOption | null>(null)

  const variables = WID_PROFILE_VARIABLES
  const ageOptions = WID_AGE_OPTIONS
  const popOptions = WID_POP_OPTIONS
  const methodOptions = TRAPEZOID_METHOD_OPTIONS
  const populationViewOptions = TRAPEZOID_POPULATION_VIEW_OPTIONS
  const partitionViewOptions = POPULATION_VIEW_OPTIONS

  const variableMeta = computed(() => findWidVariable(variable.value))
  const years = computed(() => availableYears.value)
  const yearRangeLabel = computed(() => {
    const list = availableYears.value
    if (list.length === 0) return ''
    const min = list[list.length - 1]!
    const max = list[0]!
    return min === max ? `${max}` : `${min}–${max}`
  })

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

  /** Bornes de fin des intervalles d'approximation selon le mode de tranches choisi. */
  const approxBreakpoints = computed<number[]>(() => {
    if (!profile.value) return []
    const mode = approxPartitionMode.value
    if (mode === 'custom') {
      return customPartitionReady.value ? customBreakpoints.value : []
    }
    if (mode === 'all') {
      return extractAvailableBoundaries(profile.value.points).filter((b) => b > 0)
    }
    const step = stepFromMode(mode)
    return step !== null ? buildStepBreakpoints(step) : []
  })

  const approxReady = computed(() => approxBreakpoints.value.length > 0)

  const intervalCountLabel = computed(() => {
    const n = approxBreakpoints.value.length
    return approxReady.value ? `${n} intervalle(s)` : ''
  })

  const activeMethodHint = computed(() =>
    methodOptions.find((item) => item.value === method.value)?.hint ?? '',
  )

  const displayPoints = computed(() => {
    if (!profile.value) return []
    const points = profile.value.points
    if (populationViewMode.value === 'all') {
      return [...points].sort((a, b) => a.rank - b.rank)

    }
    return buildPartitionPoints(points, buildStepBreakpoints(1))
  })

  const chartOptionsBase = () => {
    const breakpoints = approxBreakpoints.value
    const rankExtentEnd = breakpoints.length > 0
      ? breakpoints[breakpoints.length - 1]
      : undefined
    return {
      ...chartMeta(),
      displayPoints: displayPoints.value,
      trapezoidBreakpoints: breakpoints.length > 0 ? breakpoints : undefined,
      showWatermarkBands: approxReady.value && showHistogram.value,
      showTrapezoids: showTrapezoids.value,
      rankExtentEnd,
      baseline: 0,
    }
  }

  const chartMeta = () => ({
    title: variableMeta.value?.label ?? variable.value,
    yAxisLabel: variableMeta.value?.unit,
  })

  const rebuild = () => {
    if (!profile.value) {
      approximation.value = null
      chartOption.value = null
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

  const load = async () => {
    loading.value = true
    error.value = null
    try {
      profile.value = await app.loadProfile.execute({
        countryCode: countryCode.value,
        variable: variable.value,
        year: year.value,
        age: age.value,
        pop: pop.value,
      })
      customBreakpoints.value = []
      rebuild()
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

  watch(
    [method, showHistogram, showTrapezoids, customBreakpoints, populationViewMode, approxPartitionMode],
    rebuild,
    { deep: true },
  )

  watch(profile, () => {
    customBreakpoints.value = []
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
    populationViewMode,
    approxPartitionMode,
    customBreakpoints,
    countries,
    variables,
    ageOptions,
    popOptions,
    methodOptions,
    populationViewOptions,
    partitionViewOptions,
    years,
    yearsLoading,
    yearRangeLabel,
    loading,
    error,
    profile,
    approximation,
    chartOption,
    variableMeta,
    availableBoundaries,
    customPartitionValidation,
    customPartitionReady,
    customPartitionComplete,
    approxReady,
    intervalCountLabel,
    activeMethodHint,
    load,
    init,
    rebuild,
  }
}
