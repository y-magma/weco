import type { DataSourcePort } from '@domain/ports/DataSourcePort'

const PANNEAU_DATA_SOURCE_KEY = Symbol('panneauDataSourceId')

/** Shared source selection for panels on the same page (e.g. temps.vue). */
export function usePanneauDataSourceProvider(initialId?: string) {
  const { defaultSource } = useDataSources()
  const sourceId = ref(initialId ?? defaultSource.value.id)
  provide(PANNEAU_DATA_SOURCE_KEY, sourceId)
  return { sourceId }
}

/** Reactive data-source selection for panel filters. */
export function usePanneauDataSource() {
  const injected = inject<Ref<string> | null>(PANNEAU_DATA_SOURCE_KEY, null)
  const { sources, defaultSource } = useDataSources()
  const localSourceId = ref(defaultSource.value.id)
  const sourceId = injected ?? localSourceId

  const selectedSource = computed<DataSourcePort>(() =>
    sources.value.find((source) => source.id === sourceId.value) ?? defaultSource.value,
  )

  const sourceLabel = computed(() => selectedSource.value.label)

  const sourceItems = computed(() =>
    sources.value.map((source) => ({
      title: source.label,
      value: source.id,
      props: { subtitle: source.description },
    })),
  )

  const onlyOneSource = computed(() => sourceItems.value.length <= 1)

  return {
    sourceId,
    selectedSource,
    sourceLabel,
    sourceItems,
    onlyOneSource,
    sources,
  }
}
