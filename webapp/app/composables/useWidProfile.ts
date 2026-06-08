import type { EChartsOption } from 'echarts'
import { buildProfileOption, type ProfileXScale } from '@src/charts/profile'
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
  const chartType = ref<'bar' | 'scatter' | 'line'>('bar')
  const logScaleY = ref(false)
  const xScale = ref<ProfileXScale>('category')

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
    profileOption.value = buildProfileOption(profile.value, {
      chartType: chartType.value,
      logScaleY: logScaleY.value,
      xScale: xScale.value,
    })
  }

  const load = async () => {
    loading.value = true
    error.value = null
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
      rebuild()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Échec du chargement du profil'
    } finally {
      loading.value = false
    }
  }

  watch([countryCode, variable, year, age, pop], load)
  watch([chartType, logScaleY, xScale], rebuild)

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
    xScale,
    countries,
    variables,
    ageOptions,
    popOptions,
    years,
    loading,
    error,
    sampleMode,
    profile,
    profileOption,
    load,
  }
}
