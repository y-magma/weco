import type { CountryOption } from '@domain/entities'
import { WID_PROFILE_VARIABLES } from '@domain/catalog/widCodes'
import { prefetchWidMetadata } from '~/composables/useWidParamConstraints'

/** Loads WID countries once and prefetches param metadata for catalogue variables. */
export function useWidCountriesProvider() {
  const app = useApplication()
  const countries = ref<CountryOption[]>([])
  const countriesError = ref<string | null>(null)

  provide('widCountries', countries)
  provide('widCountriesError', countriesError)

  onMounted(async () => {
    const sixlets = WID_PROFILE_VARIABLES.map((item) => item.sixlet)
    try {
      await prefetchWidMetadata(app, sixlets)
      countries.value = await app.listCountries.execute({ variable: 'ahweal' })
    } catch (err) {
      countriesError.value = err instanceof Error ? err.message : 'Échec du chargement des pays'
    }
  })

  return { countries, countriesError }
}
