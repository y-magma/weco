import type { Ref } from 'vue'
import type { ApplicationContainer } from '@application/bootstrap/container'
import type { CountryOption, ParamAvailabilityEntity } from '@domain/entities'
import type { DataSourcePort } from '@domain/ports/DataSourcePort'
import {
  knownParamCombosForVariable,
  WID_AGE_OPTIONS,
  WID_POP_OPTIONS,
  type CodeOption,
} from '@domain/catalog/widCodes'
import {
  buildParamAvailability,
  describeCodeAdjustment,
  describeYearAdjustment,
  intersectParamAvailability,
  intersectYears,
  resolveWidParams,
  type ParamAdjustmentField,
  type ParamAdjustmentHints,
  type WidParamResolveMode,
} from '@domain/services/widParamAvailability'
import { paramMetadataStore } from '@infrastructure/cache/paramMetadataStore'
import { yearRangeLabel } from '~/composables/panelBase'

export interface WidParamRefs {
  countryCode: Ref<string>
  age: Ref<string>
  pop: Ref<string>
  year?: Ref<number>
}

export interface WidParamConstraintsOptions {
  app: ApplicationContainer
  /** Active data source (for cache key and use-case routing). */
  source: Ref<DataSourcePort>
  /** Primary variable (always required). */
  variable: Ref<string>
  /** Secondary variable for scatter intersection. */
  variableSecondary?: Ref<string>
  params: WidParamRefs
  /** Shared country list; refreshed per variable when provided. */
  countries?: Ref<CountryOption[]>
  /** When false, skip API calls (non-WID time-series sources). */
  enabled?: Ref<boolean>
}

function filterCodeOptions(all: CodeOption[], allowed: string[]): CodeOption[] {
  if (allowed.length === 0) return all
  const set = new Set(allowed)
  return all.filter((item) => set.has(item.value))
}

async function fetchAvailability(
  app: ApplicationContainer,
  source: DataSourcePort,
  countryCode: string,
  variable: string,
): Promise<ParamAvailabilityEntity> {
  const cached = paramMetadataStore.get(source.id, countryCode, variable)
  if (cached) return cached

  const availability = await app.listAvailableParams.execute(
    { countryCode, variable },
    { source },
  )
  if (availability.combos.length > 0) {
    paramMetadataStore.set(source.id, countryCode, variable, availability)
  }
  return availability
}

function labelForOption(options: CodeOption[], code: string): string {
  return options.find((item) => item.value === code)?.label ?? code
}

/** Shared WID param constraints: age/pop/year/country filtering and clamping. */
export function useWidParamConstraints(options: WidParamConstraintsOptions) {
  const constraintsLoading = ref(false)
  const constraintsError = ref<string | null>(null)
  const paramAdjustmentHints = ref<ParamAdjustmentHints>({})
  const adjustmentToastVisible = ref(false)
  const adjustmentToastMessage = ref('')
  let adjustmentToastTimer: ReturnType<typeof setTimeout> | undefined
  const paramAvailability = ref<ParamAvailabilityEntity>(
    buildParamAvailability(knownParamCombosForVariable(options.variable.value)),
  )
  const availableYears = ref<number[]>([])
  const countriesForVariable = ref<CountryOption[]>([])

  const ageOptions = computed(() =>
    filterCodeOptions(WID_AGE_OPTIONS, paramAvailability.value.ages),
  )
  const popOptions = computed(() =>
    filterCodeOptions(WID_POP_OPTIONS, paramAvailability.value.pops),
  )
  const years = computed(() => availableYears.value)
  const yearRangeLabelComputed = computed(() => yearRangeLabel(availableYears.value))

  const countries = computed(() => {
    if (countriesForVariable.value.length > 0) return countriesForVariable.value
    return options.countries?.value ?? []
  })

  const hasParamCombos = computed(() => paramAvailability.value.combos.length > 0)

  function showAdjustmentToast(hints: ParamAdjustmentHints) {
    const messages = (['year', 'age', 'pop'] as ParamAdjustmentField[])
      .map((field) => hints[field])
      .filter((message): message is string => Boolean(message))
    if (messages.length === 0) return

    adjustmentToastMessage.value = messages.join(' ')
    adjustmentToastVisible.value = true
    if (adjustmentToastTimer) clearTimeout(adjustmentToastTimer)
    adjustmentToastTimer = setTimeout(() => {
      adjustmentToastVisible.value = false
    }, 5000)
  }

  onScopeDispose(() => {
    if (adjustmentToastTimer) clearTimeout(adjustmentToastTimer)
  })

  async function loadCountriesForVariable(sixlet: string): Promise<void> {
    if (options.enabled && !options.enabled.value) return
    try {
      countriesForVariable.value = await options.app.listCountries.execute(
        { variable: sixlet },
        { source: options.source.value },
      )
    } catch {
      countriesForVariable.value = options.countries?.value ?? []
    }
  }

  async function resolveAvailability(
    countryCode: string,
    primary: string,
    secondary?: string,
  ): Promise<ParamAvailabilityEntity> {
    const source = options.source.value
    const primaryAvailability = await fetchAvailability(options.app, source, countryCode, primary)
    if (!secondary || secondary === primary) return primaryAvailability

    const secondaryAvailability = await fetchAvailability(options.app, source, countryCode, secondary)
    return intersectParamAvailability(primaryAvailability, secondaryAvailability)
  }

  async function refreshYearsForCombo(
    countryCode: string,
    variables: string[],
    age: string,
    pop: string,
  ): Promise<number[]> {
    const source = options.source.value
    const yearLists = await Promise.all(
      variables.map((variable) =>
        options.app.listProfileYears.execute(
          { countryCode, variable, age, pop },
          { source },
        ),
      ),
    )
    return variables.length > 1 ? intersectYears(...yearLists) : (yearLists[0] ?? [])
  }

  async function refreshConstraints(mode: WidParamResolveMode): Promise<boolean> {
    if (options.enabled && !options.enabled.value) return false
    const countryCode = options.params.countryCode.value
    const primary = options.variable.value
    const secondary = options.variableSecondary?.value

    if (!countryCode || !primary) {
      paramAvailability.value = buildParamAvailability(knownParamCombosForVariable(primary))
      availableYears.value = []
      return false
    }

    constraintsLoading.value = true
    constraintsError.value = null
    paramAdjustmentHints.value = {}

    const previousYear = options.params.year?.value
    const previousAge = options.params.age.value
    const previousPop = options.params.pop.value

    try {
      paramAvailability.value = buildParamAvailability(
        knownParamCombosForVariable(primary),
      )

      await loadCountriesForVariable(primary)

      const availability = await resolveAvailability(countryCode, primary, secondary)
      paramAvailability.value = availability.combos.length > 0
        ? availability
        : buildParamAvailability(knownParamCombosForVariable(primary))

      if (paramAvailability.value.combos.length === 0) {
        constraintsError.value = 'Aucune combinaison âge / population disponible.'
        availableYears.value = []
        return false
      }

      const resolved = resolveWidParams({
        current: {
          countryCode,
          age: options.params.age.value,
          pop: options.params.pop.value,
          year: options.params.year?.value,
        },
        availability: paramAvailability.value,
        availableCountries: countriesForVariable.value.map((item) => item.code),
        sixlet: primary,
        mode,
      })

      options.params.countryCode.value = resolved.countryCode
      options.params.age.value = resolved.age
      options.params.pop.value = resolved.pop

      const variables = secondary && secondary !== primary
        ? [primary, secondary]
        : [primary]

      availableYears.value = await refreshYearsForCombo(
        resolved.countryCode,
        variables,
        resolved.age,
        resolved.pop,
      )

      const hints: ParamAdjustmentHints = {}

      const ageMessage = describeCodeAdjustment(
        'Âge',
        previousAge,
        resolved.age,
        labelForOption(WID_AGE_OPTIONS, resolved.age),
      )
      if (ageMessage) hints.age = ageMessage

      const popMessage = describeCodeAdjustment(
        'Population',
        previousPop,
        resolved.pop,
        labelForOption(WID_POP_OPTIONS, resolved.pop),
      )
      if (popMessage) hints.pop = popMessage

      if (options.params.year && availableYears.value.length > 0) {
        const yearResolved = resolveWidParams({
          current: {
            countryCode: resolved.countryCode,
            age: resolved.age,
            pop: resolved.pop,
            year: previousYear,
          },
          availability: paramAvailability.value,
          availableYears: availableYears.value,
          sixlet: primary,
          mode,
        })
        const newYear = yearResolved.year ?? availableYears.value[0]!
        options.params.year.value = newYear

        const yearMessage = describeYearAdjustment(previousYear, newYear, availableYears.value)
        if (yearMessage) hints.year = yearMessage
      }

      if (Object.keys(hints).length > 0) {
        paramAdjustmentHints.value = hints
        showAdjustmentToast(hints)
      }

      if (secondary && secondary !== primary && paramAvailability.value.combos.length === 0) {
        constraintsError.value = 'Aucune combinaison âge / population commune aux deux variables.'
        return false
      }

      return availableYears.value.length > 0 || !options.params.year
    } catch (err) {
      constraintsError.value = err instanceof Error
        ? err.message
        : 'Échec du chargement des paramètres disponibles'
      availableYears.value = []
      return false
    } finally {
      constraintsLoading.value = false
    }
  }

  /** Apply optimistic defaults when variable changes (before API validation). */
  function applyOptimisticDefaults(sixlet: string): void {
    const fallback = buildParamAvailability(knownParamCombosForVariable(sixlet))
    paramAvailability.value = fallback
    const first = fallback.combos[0]
    if (first) {
      options.params.age.value = first.age
      options.params.pop.value = first.pop
    }
  }

  return {
    constraintsLoading,
    constraintsError,
    paramAdjustmentHints,
    adjustmentToastVisible,
    adjustmentToastMessage,
    paramAvailability,
    availableYears,
    countries,
    ageOptions,
    popOptions,
    years,
    yearRangeLabel: yearRangeLabelComputed,
    hasParamCombos,
    refreshConstraints,
    applyOptimisticDefaults,
    loadCountriesForVariable,
  }
}

/** Prefetch metadata for catalogue variables (default country FR). */
export async function prefetchParamMetadata(
  app: ApplicationContainer,
  indicatorIds: readonly string[],
  countryCode = 'FR',
  source?: DataSourcePort,
): Promise<void> {
  const activeSource = source ?? app.getDefaultSource()
  await Promise.all(
    indicatorIds.map(async (variable) => {
      try {
        const availability = await app.listAvailableParams.execute(
          { countryCode, variable },
          { source: activeSource },
        )
        if (availability.combos.length > 0) {
          paramMetadataStore.set(activeSource.id, countryCode, variable, availability)
        }
      } catch {
        // Prefetch is best-effort.
      }
    }),
  )
}

/** @deprecated Use prefetchParamMetadata */
export const prefetchWidMetadata = prefetchParamMetadata
