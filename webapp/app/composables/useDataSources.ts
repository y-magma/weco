import {
  getDefaultDataSource,
  initializeDataSources,
  listDataSources,
} from '@src/data-sources/registry'
import { createWidDataSource } from '@src/data-sources/wid/widSource'
import type { DataSource } from '@src/data-sources/Source'

let initialized = false

export function useDataSources() {
  const config = useRuntimeConfig()

  if (!initialized) {
    initializeDataSources({
      widBaseUrl: config.public.widApiBaseUrl,
      widApiKey: config.public.widApiKey || undefined,
    })
    initialized = true
  }

  const sources = computed<DataSource[]>(() => listDataSources())

  const defaultSource = computed(() => getDefaultDataSource())

  const refreshWidSource = () => {
    const wid = createWidDataSource({
      baseUrl: config.public.widApiBaseUrl,
      apiKey: config.public.widApiKey || undefined,
    })
    return wid
  }

  return {
    sources,
    defaultSource,
    refreshWidSource,
  }
}
