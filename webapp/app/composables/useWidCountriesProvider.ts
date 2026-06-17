import type { CountryOption } from '@domain/entities'

/** Loads WID countries once and provides them to child panneau components. */
export function useWidCountriesProvider() {
  const app = useApplication()
  const countries = ref<CountryOption[]>([])
  const countriesError = ref<string | null>(null)

  provide('widCountries', countries)

  onMounted(async () => {
    try {
      countries.value = await app.listCountries.execute()
    } catch (err) {
      countriesError.value = err instanceof Error ? err.message : 'Échec du chargement des pays'
    }
  })

  return { countries, countriesError }
}
