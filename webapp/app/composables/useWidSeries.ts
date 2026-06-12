import type { EChartsOption } from 'echarts'
import type { Ref } from 'vue'
import { buildTimeSeriesOption } from '@src/charts/timeSeries'
import type { CountryOption, DataSeries } from '@src/domain/types'
import type { WidDataSource } from '@src/data-sources/wid/widSource'
import {
  findWidVariable,
  WID_AGE_OPTIONS,
  WID_DEFAULT_AGE,
  WID_DEFAULT_POP,
  WID_POP_OPTIONS,
  WID_PROFILE_VARIABLES,
} from '@src/data-sources/wid/widCodes'

export interface WidSeriesStateOptions {
  countries?: Ref<CountryOption[]>
  initialVariable?: string
}

const PERCENTILE_OPTIONS = [
  { value: 'p50p51', label: 'p50p51 — médiane (50–51 %)' },
  { value: 'p90p100', label: 'p90p100 — top 10 %' },
  { value: 'p99p100', label: 'p99p100 — top 1 %' },
  { value: 'p0p1', label: 'p0p1 — bas 1 %' },
]

/**
 * Time series toolbox state: one WID variable over years at a fixed percentile.
 * See spec/version1.md (graphe #1 — évolution dans le temps).
 */
export function createWidSeriesState(options: WidSeriesStateOptions = {}) {
  const { defaultSource } = useDataSources()
  const sharedCountries = options.countries

  const countryCode = ref('FR')
  const variable = ref(options.initialVariable ?? 'ahweal')
  const age = ref(WID_DEFAULT_AGE)
  const pop = ref(WID_DEFAULT_POP)
  const percentile = ref('p50p51')
  const logScaleY = ref(false)

  const loading = ref(false)
  const error = ref<string | null>(null)

  const localCountries = ref<CountryOption[]>([])
  const countries = sharedCountries ?? localCountries
  const series = ref<DataSeries | null>(null)
  const chartOption = ref<EChartsOption | null>(null)

  const variables = WID_PROFILE_VARIABLES
  const ageOptions = WID_AGE_OPTIONS
  const popOptions = WID_POP_OPTIONS
  const percentileOptions = PERCENTILE_OPTIONS

  const widSource = () => defaultSource.value as WidDataSource

  const variableMeta = computed(() => findWidVariable(variable.value))

  const rebuild = () => {
    if (!series.value) {
      chartOption.value = null
      return
    }
    const meta = variableMeta.value
    const title = `${meta?.label ?? variable.value} — ${countryCode.value}`
    chartOption.value = buildTimeSeriesOption([series.value], title, {
      logScaleY: logScaleY.value,
    })
  }

  const load = async () => {
    loading.value = true
    error.value = null
    try {
      series.value = await widSource().fetchVariableTimeSeries({
        countryCode: countryCode.value,
        variable: variable.value,
        age: age.value,
        pop: pop.value,
        percentile: percentile.value,
      })
      rebuild()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Échec du chargement de la série'
      series.value = null
      chartOption.value = null
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
    await load()
  }

  watch([countryCode, variable, age, pop, percentile], load)
  watch(logScaleY, rebuild)

  return {
    countryCode,
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
    series,
    chartOption,
    variableMeta,
    load,
    init,
  }
}
