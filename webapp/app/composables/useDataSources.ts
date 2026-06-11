import {
  getDefaultDataSource,
  initializeDataSources,
  listDataSources,
} from '@src/data-sources/registry'
import { createWidDataSource } from '@src/data-sources/wid/widSource'
import type { DataSource } from '@src/data-sources/Source'

let initialized = false

export function useDataSources() {
  const runtimeConfig = useRuntimeConfig()

  if (!initialized) {
    initializeDataSources({
      widApiKey: runtimeConfig.public.widApiKey || undefined,
      widApiBaseUrl: runtimeConfig.public.widApiBaseUrl || undefined,
    })
    initialized = true
  }

  const sources = computed<DataSource[]>(() => listDataSources())

  const defaultSource = computed(() => getDefaultDataSource())

  const refreshWidSource = () => createWidDataSource()

  return {
    sources,
    defaultSource,
    refreshWidSource,
  }
}
