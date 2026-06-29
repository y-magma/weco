import type { CountryOption } from '@domain/entities'
import { prefetchParamMetadata } from '~/composables/useWidParamConstraints'

/** Loads countries for the active source and prefetches param metadata when supported. */
export function useCountriesProvider(options?: { enabled?: MaybeRefOrGetter<boolean> }) {
  const app = useApplication()
  const { selectedSource } = usePanneauDataSource()
  const countries = ref<CountryOption[]>([])
  const countriesError = ref<string | null>(null)
  const enabled = computed(() => options?.enabled === undefined ? true : toValue(options.enabled))

  provide('panelCountries', countries)
  provide('panelCountriesError', countriesError)

  async function loadCountries(): Promise<void> {
    if (!enabled.value) return
    const variable = selectedSource.value.indicators?.[0]?.id ?? 'ahweal'
    try {
      countriesError.value = null
      countries.value = await app.listCountries.execute(
        { variable },
        { source: selectedSource.value },
      )
    } catch (err) {
      countries.value = []
      countriesError.value = err instanceof Error ? err.message : 'Échec du chargement des pays'
    }
  }

  async function prefetchMetadata(): Promise<void> {
    if (!enabled.value) return
    if (selectedSource.value.capabilities?.percentileProfile !== true) return
    const indicatorIds = selectedSource.value.indicators?.map((item) => item.id) ?? []
    if (indicatorIds.length === 0) return
    try {
      await prefetchParamMetadata(app, indicatorIds, 'FR', selectedSource.value)
    } catch {
      // Prefetch is best-effort.
    }
  }

  onMounted(async () => {
    if (!enabled.value) return
    await prefetchMetadata()
    await loadCountries()
  })

  watch([() => selectedSource.value.id, enabled], async ([, isEnabled]) => {
    if (!isEnabled) return
    await prefetchMetadata()
    await loadCountries()
  })

  return { countries, countriesError }
}
