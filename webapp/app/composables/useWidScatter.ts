import type { EChartsOption } from 'echarts'
import type { Ref } from 'vue'
import { buildProfileScatterOption } from '~/visualization/scatterProfiles'
import type { ProfileScatterPoint } from '@domain/services/joinProfiles'
import type { CountryOption } from '@domain/entities'
import {
  findWidVariable,
  WID_AGE_OPTIONS,
  WID_DEFAULT_AGE,
  WID_DEFAULT_POP,
  WID_POP_OPTIONS,
  WID_PROFILE_VARIABLES,
} from '@domain/catalog/widCodes'
import { WidPanelScope, yearRangeLabel } from '~/composables/widPanelBase'

export interface WidScatterStateOptions {
  countries?: Ref<CountryOption[]>
  initialVariableX?: string
  initialVariableY?: string
}

export function createWidScatterState(options: WidScatterStateOptions = {}) {
  const scope = new WidPanelScope(useApplication(), options.countries)

  const countryCode = ref('FR')
  const variableX = ref(options.initialVariableX ?? 'thweal')
  const variableY = ref(options.initialVariableY ?? 'ahweal')
  const year = ref(2021)
  const age = ref(WID_DEFAULT_AGE)
  const pop = ref(WID_DEFAULT_POP)
  const logScaleX = ref(false)
  const logScaleY = ref(false)

  const yearsLoading = ref(false)

  const availableYears = ref<number[]>([])
  const points = ref<ProfileScatterPoint[]>([])
  const scatterOption = ref<EChartsOption | null>(null)

  const variables = WID_PROFILE_VARIABLES
  const ageOptions = WID_AGE_OPTIONS
  const popOptions = WID_POP_OPTIONS
  const years = computed(() => availableYears.value)

  const labelFor = (sixlet: string) => findWidVariable(sixlet)?.label ?? sixlet
  const unitFor = (sixlet: string) => findWidVariable(sixlet)?.unit

  const rebuild = () => {
    if (!points.value.length) {
      scatterOption.value = null
      return
    }
    scatterOption.value = buildProfileScatterOption(points.value, {
      xLabel: labelFor(variableX.value),
      xUnit: unitFor(variableX.value),
      yLabel: labelFor(variableY.value),
      yUnit: unitFor(variableY.value),
      logScaleX: logScaleX.value,
      logScaleY: logScaleY.value,
    })
  }

  const refreshYears = async () => {
    yearsLoading.value = true
    try {
      availableYears.value = await scope.app.listProfileYears.execute({
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
    scope.loading.value = true
    scope.error.value = null
    try {
      points.value = await scope.app.loadScatter.execute({
        variableX: variableX.value,
        variableY: variableY.value,
        params: {
          countryCode: countryCode.value,
          year: year.value,
          age: age.value,
          pop: pop.value,
          variable: variableX.value,
        },
      })
      rebuild()
    } catch (err) {
      scope.error.value = err instanceof Error ? err.message : 'Échec du chargement du nuage'
      points.value = []
      scatterOption.value = null
    } finally {
      scope.loading.value = false
    }
  }

  const init = async () => {
    await scope.initCountries()
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
    countries: scope.countries,
    variables,
    ageOptions,
    popOptions,
    years,
    yearsLoading,
    yearRangeLabel: computed(() => yearRangeLabel(availableYears.value)),
    loading: scope.loading,
    error: scope.error,
    points,
    scatterOption,
    load,
    init,
  }
}
