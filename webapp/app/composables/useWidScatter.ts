import type { EChartsOption } from 'echarts'
import type { Ref } from 'vue'
import { buildProfileScatterOption } from '@src/charts/scatterProfiles'
import { joinProfilesByPercentile, type ProfileScatterPoint } from '@src/domain/joinProfiles'
import type { CountryOption, PercentileProfile } from '@src/domain/types'
import type { WidDataSource } from '@src/data-sources/wid/widSource'
import {
  findWidVariable,
  WID_AGE_OPTIONS,
  WID_DEFAULT_AGE,
  WID_DEFAULT_POP,
  WID_POP_OPTIONS,
  WID_PROFILE_VARIABLES,
} from '@src/data-sources/wid/widCodes'

export interface WidScatterStateOptions {
  countries?: Ref<CountryOption[]>
  initialVariableX?: string
  initialVariableY?: string
}

/**
 * Scatter of two WID variables joined by percentile (graphe #6 de version1.md).
 * One point = one g-percentile, X = var1, Y = var2, same country/year/age/pop.
 */
export function createWidScatterState(options: WidScatterStateOptions = {}) {
  const { defaultSource } = useDataSources()
  const sharedCountries = options.countries

  const countryCode = ref('FR')
  const variableX = ref(options.initialVariableX ?? 'thweal')
  const variableY = ref(options.initialVariableY ?? 'ahweal')
  const year = ref(2021)
  const age = ref(WID_DEFAULT_AGE)
  const pop = ref(WID_DEFAULT_POP)
  const logScaleX = ref(false)
  const logScaleY = ref(false)

  const loading = ref(false)
  const yearsLoading = ref(false)
  const error = ref<string | null>(null)

  const localCountries = ref<CountryOption[]>([])
  const countries = sharedCountries ?? localCountries
  const availableYears = ref<number[]>([])
  const points = ref<ProfileScatterPoint[]>([])
  const scatterOption = ref<EChartsOption | null>(null)

  const variables = WID_PROFILE_VARIABLES
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

  const widSource = () => defaultSource.value as WidDataSource

  const labelFor = (sixlet: string) => findWidVariable(sixlet)?.label ?? sixlet

  const rebuild = () => {
    if (!points.value.length) {
      scatterOption.value = null
      return
    }
    scatterOption.value = buildProfileScatterOption(points.value, {
      xLabel: labelFor(variableX.value),
      yLabel: labelFor(variableY.value),
      logScaleX: logScaleX.value,
      logScaleY: logScaleY.value,
    })
  }

  const refreshYears = async () => {
    yearsLoading.value = true
    try {
      availableYears.value = await widSource().listProfileYears({
        countryCode: countryCode.value,
        variable: variableX.value,
        age: age.value,
        pop: pop.value,
      })
      if (availableYears.value.length && !availableYears.value.includes(year.value)) {
        year.value = availableYears.value[0]!
      }
    } catch {
      availableYears.value = []
    } finally {
      yearsLoading.value = false
    }
  }

  const load = async () => {
    loading.value = true
    error.value = null
    try {
      const source = widSource()
      const params = {
        countryCode: countryCode.value,
        year: year.value,
        age: age.value,
        pop: pop.value,
      }
      const [xProfile, yProfile]: [PercentileProfile, PercentileProfile] = await Promise.all([
        source.fetchPercentileProfile({ ...params, variable: variableX.value }),
        source.fetchPercentileProfile({ ...params, variable: variableY.value }),
      ])
      points.value = joinProfilesByPercentile(xProfile, yProfile)
      rebuild()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Échec du chargement du nuage'
      points.value = []
      scatterOption.value = null
    } finally {
      loading.value = false
    }
  }

  const init = async () => {
    if (!sharedCountries) {
      try {
        localCountries.value = await widSource().listCountries()
      } catch {
        localCountries.value = [{ code: 'FR', label: 'France' }]
      }
    }
    await refreshYears()
    await load()
  }

  watch([countryCode, variableX, variableY, year, age, pop], load)
  watch([countryCode, variableX, age, pop], refreshYears)
  watch([logScaleX, logScaleY], rebuild)

  return {
    countryCode,
    variableX,
    variableY,
    year,
    age,
    pop,
    logScaleX,
    logScaleY,
    countries,
    variables,
    ageOptions,
    popOptions,
    years,
    yearsLoading,
    yearRangeLabel,
    loading,
    error,
    points,
    scatterOption,
    load,
    init,
  }
}
