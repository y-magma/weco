import type { EChartsOption } from 'echarts'
import type { Ref } from 'vue'
import { buildTimeSeriesOption } from '~/visualization/timeSeries'
import type { CountryOption, DataSeries } from '@domain/entities'
import {
  findWidVariable,
  WID_AGE_OPTIONS,
  WID_DEFAULT_AGE,
  WID_DEFAULT_POP,
  WID_POP_OPTIONS,
  WID_PROFILE_VARIABLES,
} from '@domain/catalog/widCodes'

export interface WidSeriesStateOptions {
  countries?: Ref<CountryOption[]>
  initialVariable?: string
  initialCountryCodes?: string[]
}

const PERCENTILE_OPTIONS = [
  { value: 'p50p51', label: 'p50p51 — médiane (50–51 %)' },
  { value: 'p90p100', label: 'p90p100 — top 10 %' },
  { value: 'p99p100', label: 'p99p100 — top 1 %' },
  { value: 'p0p1', label: 'p0p1 — bas 1 %' },
]

export function createWidSeriesState(options: WidSeriesStateOptions = {}) {
  const app = useApplication()
  const sharedCountries = options.countries

  const countryCodes = ref<string[]>(options.initialCountryCodes ?? ['FR'])
  const variable = ref(options.initialVariable ?? 'ahweal')
  const age = ref(WID_DEFAULT_AGE)
  const pop = ref(WID_DEFAULT_POP)
  const percentile = ref('p50p51')
  const logScaleY = ref(false)

  const loading = ref(false)
  const error = ref<string | null>(null)
  const loadWarning = ref<string | null>(null)

  const localCountries = ref<CountryOption[]>([])
  const countries = sharedCountries ?? localCountries
  const seriesList = ref<DataSeries[]>([])
  const chartOption = ref<EChartsOption | null>(null)

  const variables = WID_PROFILE_VARIABLES
  const ageOptions = WID_AGE_OPTIONS
  const popOptions = WID_POP_OPTIONS
  const percentileOptions = PERCENTILE_OPTIONS

  const variableMeta = computed(() => findWidVariable(variable.value))

  const countryLabel = (code: string) =>
    countries.value.find((item) => item.code === code)?.label ?? code

  const yearCountLabel = computed(() => {
    const counts = seriesList.value.map((series) => series.points.length)
    if (counts.length === 0) return ''
    const min = Math.min(...counts)
    const max = Math.max(...counts)
    return min === max ? `${max} années` : `${min}–${max} années`
  })

  const rebuild = () => {
    if (seriesList.value.length === 0) {
      chartOption.value = null
      return
    }
    const meta = variableMeta.value
    const title = meta?.label ?? variable.value
    chartOption.value = buildTimeSeriesOption(seriesList.value, title, {
      logScaleY: logScaleY.value,
    })
  }

  const load = async () => {
    const codes = countryCodes.value.length > 0 ? countryCodes.value : ['FR']
    if (countryCodes.value.length === 0) {
      countryCodes.value = codes
    }

    loading.value = true
    error.value = null
    loadWarning.value = null

    try {
      const { series, failures } = await app.loadTimeSeries.execute({
        countryCodes: codes,
        params: {
          variable: variable.value,
          age: age.value,
          pop: pop.value,
          percentile: percentile.value,
        },
        countryLabel,
      })

      seriesList.value = series

      if (series.length === 0) {
        error.value = failures[0] ?? 'Échec du chargement des séries'
        chartOption.value = null
        return
      }

      if (failures.length > 0) {
        loadWarning.value = failures.join(' · ')
      }

      rebuild()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Échec du chargement des séries'
      seriesList.value = []
      chartOption.value = null
    } finally {
      loading.value = false
    }
  }

  const init = async () => {
    if (!sharedCountries) {
      try {
        localCountries.value = await app.listCountries.execute()
      } catch {
        localCountries.value = [{ code: 'FR', label: 'France' }]
      }
    }
    await load()
  }

  watch([countryCodes, variable, age, pop, percentile], load, { deep: true })
  watch(logScaleY, rebuild)

  return {
    countryCodes,
    variable,
    age,
    pop,
    percentile,
    logScaleY,
    countries,
    variables,
    ageOptions,
    popOptions,
    percentileOptions,
    loading,
    error,
    loadWarning,
    seriesList,
    chartOption,
    variableMeta,
    yearCountLabel,
    load,
    init,
  }
}
