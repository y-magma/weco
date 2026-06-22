import type { EChartsOption } from 'echarts'
import type { Ref } from 'vue'
import { buildProfileScatterOption } from '~/visualization/scatterProfiles'
import type { ProfileScatterPoint } from '@domain/services/joinProfiles'
import type { CountryOption } from '@domain/entities'
import {
  findWidVariable,
  WID_PROFILE_VARIABLES,
} from '@domain/catalog/widCodes'
import { WidPanelScope } from '~/composables/widPanelBase'
import { useWidParamConstraints } from '~/composables/useWidParamConstraints'

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
  const age = ref('992')
  const pop = ref('j')
  const logScaleX = ref(false)
  const logScaleY = ref(false)

  const points = ref<ProfileScatterPoint[]>([])
  const scatterOption = ref<EChartsOption | null>(null)

  const variables = WID_PROFILE_VARIABLES

  const constraints = useWidParamConstraints({
    app: scope.app,
    variable: variableX,
    variableSecondary: variableY,
    params: { countryCode, age, pop, year },
    countries: scope.countries,
  })

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

  const load = async () => {
    scope.loading.value = true
    scope.error.value = constraints.constraintsError.value
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

  const refreshAndLoad = async (mode: 'variableChange' | 'clamp') => {
    const ready = await constraints.refreshConstraints(mode)
    if (constraints.constraintsError.value) {
      scope.error.value = constraints.constraintsError.value
      points.value = []
      scatterOption.value = null
      return
    }
    if (ready) await load()
  }

  const init = async () => {
    await scope.initCountries()
    await constraints.loadCountriesForVariable(variableX.value)
    await refreshAndLoad('variableChange')
  }

  watch([countryCode, age, pop], () => {
    void refreshAndLoad('clamp')
  })

  watch([variableX, variableY], () => {
    constraints.applyOptimisticDefaults(variableX.value)
    void refreshAndLoad('variableChange')
  })

  watch(year, () => {
    if (constraints.years.value.includes(year.value)) void load()
  })

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
    countries: constraints.countries,
    variables,
    ageOptions: constraints.ageOptions,
    popOptions: constraints.popOptions,
    years: constraints.years,
    yearsLoading: constraints.constraintsLoading,
    yearRangeLabel: constraints.yearRangeLabel,
    paramAdjustmentHints: constraints.paramAdjustmentHints,
    adjustmentToastVisible: constraints.adjustmentToastVisible,
    adjustmentToastMessage: constraints.adjustmentToastMessage,
    loading: scope.loading,
    error: scope.error,
    points,
    scatterOption,
    load,
    init,
  }
}
