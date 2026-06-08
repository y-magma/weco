import type { EChartsOption } from 'echarts'
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
  WID_V1_VARIABLES,
} from '@src/data-sources/wid/widCodes'

const YEARS = Array.from({ length: 2023 - 1980 + 1 }, (_, i) => 1980 + i).reverse()

/**
 * Scatter of two WID variables joined by percentile (graphe #6 de version1.md).
 * One point = one g-percentile, X = var1, Y = var2, same country/year/age/pop.
 */
export function useWidScatter() {
  const { defaultSource } = useDataSources()

  const countryCode = ref('FR')
  const variableX = ref('thweal')
  const variableY = ref('ahweal')
  const year = ref(2021)
  const age = ref(WID_DEFAULT_AGE)
  const pop = ref(WID_DEFAULT_POP)
  const logScaleX = ref(false)
  const logScaleY = ref(false)

  const loading = ref(false)
  const error = ref<string | null>(null)
  const sampleMode = ref(false)

  const countries = ref<CountryOption[]>([])
  const points = ref<ProfileScatterPoint[]>([])
  const scatterOption = ref<EChartsOption | null>(null)

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
      sampleMode.value = xProfile.sample || yProfile.sample
      points.value = joinProfilesByPercentile(xProfile, yProfile)
      rebuild()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Échec du chargement du nuage'
    } finally {
      loading.value = false
    }
  }

  watch([countryCode, variableX, variableY, year, age, pop], load)
  watch([logScaleX, logScaleY], rebuild)

  onMounted(async () => {
    await loadCountries()
    await load()
  })

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
    loading,
    error,
    sampleMode,
    points,
    scatterOption,
    load,
  }
}
