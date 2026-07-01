import type { Ref } from 'vue'
import type { CountryOption, SourceIndicator } from '@domain/entities'
import { WID_DEFAULT_AGE, WID_DEFAULT_POP } from '@domain/catalog/widCodes'
import {
  getDecileBundleConfig,
  isDecileBundleVariable,
  worldBankPrimaryTimeSeriesIndicators,
} from '@domain/catalog/decileBundles'
import { PanelScope } from '~/composables/panelBase'
import { useWidParamConstraints } from '~/composables/useWidParamConstraints'

export function timeSeriesIndicatorsForPanel(
  source: { id: string, indicators?: readonly SourceIndicator[] },
  panelIndex: number,
): readonly SourceIndicator[] {
  const all = source.indicators ?? []
  if (source.id === 'worldbank' && panelIndex === 0) {
    return worldBankPrimaryTimeSeriesIndicators(all)
  }
  return all
}

export function defaultTimeSeriesVariable(
  source: { id: string, indicators?: readonly SourceIndicator[] },
  panelIndex: number,
): string {
  const list = timeSeriesIndicatorsForPanel(source, panelIndex)
  return list[0]?.id ?? source.indicators?.[0]?.id ?? 'ahweal'
}

export interface TimeSeriesSharedContextOptions {
  countries?: Ref<CountryOption[]>
  panelIndex?: number
  initialVariable?: string
  constraintsCountryCode: Ref<string>
}

export function createTimeSeriesSharedContext(options: TimeSeriesSharedContextOptions) {
  const app = useApplication()
  const { selectedSource } = usePanneauDataSource()
  const scope = new PanelScope(app, options.countries)
  const panelIndex = options.panelIndex ?? 0

  const hasPercentileProfile = computed(
    () => selectedSource.value.capabilities?.percentileProfile === true,
  )

  const hasDecileProfile = computed(
    () => selectedSource.value.capabilities?.decileProfile === true,
  )

  const indicators = computed<readonly SourceIndicator[]>(
    () => timeSeriesIndicatorsForPanel(selectedSource.value, panelIndex),
  )

  const variable = ref(
    options.initialVariable ?? defaultTimeSeriesVariable(selectedSource.value, panelIndex),
  )

  const isDecileBundle = computed(() => isDecileBundleVariable(variable.value))
  const decileBundleConfig = computed(() => getDecileBundleConfig(variable.value))
  const decileBundleOptions = computed(() => decileBundleConfig.value?.options ?? [])
  const variableMeta = computed(() =>
    indicators.value.find((item) => item.id === variable.value),
  )

  const age = ref('')
  const pop = ref('')

  watch(hasPercentileProfile, (enabled) => {
    if (enabled) {
      age.value = WID_DEFAULT_AGE
      pop.value = WID_DEFAULT_POP
    } else {
      age.value = ''
      pop.value = ''
    }
  }, { immediate: true })

  const constraintsEnabled = computed(() => hasPercentileProfile.value)

  const constraints = useWidParamConstraints({
    app: scope.app,
    source: selectedSource,
    variable,
    params: { countryCode: options.constraintsCountryCode, age, pop },
    countries: scope.countries,
    enabled: constraintsEnabled,
  })

  const sourceOptions = computed(() => ({ source: selectedSource.value }))

  const panelCountries = computed(() =>
    hasPercentileProfile.value ? constraints.countries.value : scope.countries.value,
  )

  async function refreshParamsAndLoad(
    mode: 'variableChange' | 'clamp',
    onLoad: () => Promise<void>,
    onConstraintsFailed?: () => void,
  ): Promise<void> {
    if (hasPercentileProfile.value) {
      const ready = await constraints.refreshConstraints(mode)
      if (!ready) {
        scope.error.value = constraints.constraintsError.value
          ?? 'Paramètres indisponibles pour cette sélection.'
        onConstraintsFailed?.()
        return
      }
    }
    await onLoad()
  }

  return {
    scope,
    selectedSource,
    panelIndex,
    hasPercentileProfile,
    hasDecileProfile,
    indicators,
    variable,
    age,
    pop,
    isDecileBundle,
    decileBundleConfig,
    decileBundleOptions,
    variableMeta,
    sourceOptions,
    constraints,
    panelCountries,
    refreshParamsAndLoad,
  }
}
