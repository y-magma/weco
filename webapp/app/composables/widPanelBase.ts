import type { ComputedRef, Ref } from 'vue'
import type { ApplicationContainer } from '@application/bootstrap/container'
import type { CountryOption } from '@domain/entities'
import { formatCountryLabel } from '@domain/catalog/countryLabels'
import {
  findWidVariable,
  WID_AGE_OPTIONS,
  WID_DEFAULT_AGE,
  WID_DEFAULT_POP,
  WID_POP_OPTIONS,
  WID_PROFILE_VARIABLES,
  type WidVariable,
} from '@domain/catalog/widCodes'

/** Shared reactive scope for WID panel composables. */
export class WidPanelScope {
  readonly app: ApplicationContainer
  readonly localCountries = ref<CountryOption[]>([])
  readonly countries: Ref<CountryOption[]>
  readonly loading = ref(false)
  readonly error = ref<string | null>(null)
  readonly loadWarning = ref<string | null>(null)

  constructor(app: ApplicationContainer, sharedCountries?: Ref<CountryOption[]>) {
    this.app = app
    this.countries = sharedCountries ?? this.localCountries
  }

  countryLabel(code: string): string {
    return this.countries.value.find((item) => item.code === code)?.label ?? code
  }

  async initCountries(variable = 'ahweal'): Promise<void> {
    if (this.countries !== this.localCountries) return
    try {
      this.localCountries.value = await this.app.listCountries.execute({ variable })
    } catch {
      this.localCountries.value = [{ code: 'FR', label: formatCountryLabel('FR') }]
    }
  }
}

/** Variable / age / pop filters shared by time-series panels. */
export class WidDemographicFilters {
  readonly variable: Ref<string>
  readonly age = ref(WID_DEFAULT_AGE)
  readonly pop = ref(WID_DEFAULT_POP)
  readonly variables = WID_PROFILE_VARIABLES
  readonly ageOptions = WID_AGE_OPTIONS
  readonly popOptions = WID_POP_OPTIONS
  readonly variableMeta: ComputedRef<WidVariable | undefined>

  constructor(initialVariable = 'ahweal') {
    this.variable = ref(initialVariable)
    this.variableMeta = computed(() => findWidVariable(this.variable.value))
  }
}

export function yearCountLabel(counts: number[]): string {
  if (counts.length === 0) return ''
  const min = Math.min(...counts)
  const max = Math.max(...counts)
  return min === max ? `${max} années` : `${min}–${max} années`
}

export function yearRangeLabel(list: number[]): string {
  if (list.length === 0) return ''
  const min = list[list.length - 1]!
  const max = list[0]!
  return min === max ? `${max}` : `${min}–${max}`
}
