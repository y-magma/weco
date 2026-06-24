import type { Ref } from 'vue'
import type { ApplicationContainer } from '@application/bootstrap/container'
import type { CountryOption } from '@domain/entities'
import { formatCountryLabel } from '@domain/catalog/countryLabels'
import type { DataSourcePort } from '@domain/ports/DataSourcePort'

/** Shared reactive scope for panel composables. */
export class PanelScope {
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

  async initCountries(source: DataSourcePort, variable = 'ahweal'): Promise<void> {
    if (this.countries !== this.localCountries) return
    try {
      this.localCountries.value = await this.app.listCountries.execute(
        { variable },
        { source },
      )
    } catch {
      this.localCountries.value = [{ code: 'FR', label: formatCountryLabel('FR') }]
    }
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
