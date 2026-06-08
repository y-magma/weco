import type { EChartsOption } from 'echarts'
import { buildProfileOption } from '@src/charts/profile'
import type { CountryOption, PercentileProfile } from '@src/domain/types'
import type { WidDataSource } from '@src/data-sources/wid/widSource'
import {
  clampPanelCount,
  defaultPanelVariables,
  MAX_PANELS,
  panelColSpan,
  resizePanelVariables,
} from '@src/domain/panels'
import {
  findWidVariable,
  WID_AGE_OPTIONS,
  WID_DEFAULT_AGE,
  WID_DEFAULT_POP,
  WID_POP_OPTIONS,
  WID_V1_VARIABLES,
} from '@src/data-sources/wid/widCodes'

const YEARS = Array.from({ length: 2023 - 1980 + 1 }, (_, i) => 1980 + i).reverse()

export interface PanelView {
  variable: string
  label: string
  option: EChartsOption | null
}

/**
 * Multi-panel view (spec/version1.md, graphe #5). N profile charts in parallel,
 * sharing country / year / age / pop, each with its own variable. The number of
 * panels is user-configurable (1..MAX_PANELS).
 */
export function useWidPanels() {
  const { defaultSource } = useDataSources()

  const allSixlets = WID_V1_VARIABLES.map((v) => v.sixlet)

  const countryCode = ref('FR')
  const year = ref(2021)
  const age = ref(WID_DEFAULT_AGE)
  const pop = ref(WID_DEFAULT_POP)
  const logScaleY = ref(false)
  const panelCount = ref(2)
  const panelVariables = ref<string[]>(defaultPanelVariables(2, allSixlets))

  const loading = ref(false)
  const error = ref<string | null>(null)
  const sampleMode = ref(false)

  const countries = ref<CountryOption[]>([])
  const profiles = ref<(PercentileProfile | null)[]>([])
  const panels = ref<PanelView[]>([])

  const variables = WID_V1_VARIABLES
  const ageOptions = WID_AGE_OPTIONS
  const popOptions = WID_POP_OPTIONS
  const years = YEARS
  const maxPanels = MAX_PANELS

  const colSpan = computed(() => panelColSpan(panelCount.value))

  const widSource = () => defaultSource.value as WidDataSource

  const loadCountries = async () => {
    try {
      countries.value = await widSource().listCountries()
    } catch {
      countries.value = [{ code: 'FR', label: 'France' }]
    }
  }

  const rebuild = () => {
    panels.value = panelVariables.value.map((variable, index) => {
      const profile = profiles.value[index] ?? null
      return {
        variable,
        label: findWidVariable(variable)?.label ?? variable,
        option: profile
          ? buildProfileOption(profile, { logScaleY: logScaleY.value })
          : null,
      }
    })
  }

  const load = async () => {
    loading.value = true
    error.value = null
    try {
      const source = widSource()
      const fetched = await Promise.all(
        panelVariables.value.map((variable) =>
          source.fetchPercentileProfile({
            countryCode: countryCode.value,
            variable,
            year: year.value,
            age: age.value,
            pop: pop.value,
          }),
        ),
      )
      profiles.value = fetched
      sampleMode.value = fetched.some((profile) => profile.sample)
      rebuild()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Échec du chargement des panneaux'
    } finally {
      loading.value = false
    }
  }

  const setPanelVariable = (index: number, sixlet: string) => {
    const next = [...panelVariables.value]
    next[index] = sixlet
    panelVariables.value = next
  }

  watch(panelCount, (count) => {
    panelVariables.value = resizePanelVariables(
      panelVariables.value,
      clampPanelCount(count),
      allSixlets,
    )
  })

  watch([countryCode, year, age, pop, panelVariables], load, { deep: true })
  watch(logScaleY, rebuild)

  onMounted(async () => {
    await loadCountries()
    await load()
  })

  return {
    countryCode,
    year,
    age,
    pop,
    logScaleY,
    panelCount,
    panelVariables,
    maxPanels,
    colSpan,
    countries,
    variables,
    ageOptions,
    popOptions,
    years,
    loading,
    error,
    sampleMode,
    panels,
    setPanelVariable,
    load,
  }
}
