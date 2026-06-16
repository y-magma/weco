import type { DataSourcePort } from '@domain/ports/DataSourcePort'
import { createWidDataSource } from '@infrastructure/data-sources/wid/widSource'

const registry = new Map<string, DataSourcePort>()

export function registerDataSource(source: DataSourcePort): void {
  registry.set(source.id, source)
}

export function listDataSources(): DataSourcePort[] {
  return Array.from(registry.values())
}

export function initializeDataSources(config?: {
  widApiKey?: string
  widApiBaseUrl?: string
}): void {
  if (registry.size > 0) return
  registerDataSource(createWidDataSource({
    apiKey: config?.widApiKey,
    baseUrl: config?.widApiBaseUrl,
  }))
}

export function getDefaultDataSource(): DataSourcePort {
  initializeDataSources()
  const source = registry.get('wid')
  if (!source) {
    throw new Error('Default data source (wid) is not registered')
  }
  return source
}
