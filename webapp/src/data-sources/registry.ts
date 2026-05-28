import type { DataSource } from '@src/data-sources/Source'
import { createWidDataSource } from '@src/data-sources/wid/widSource'

const registry = new Map<string, DataSource>()

export function registerDataSource(source: DataSource): void {
  registry.set(source.id, source)
}

export function getDataSource(id: string): DataSource | undefined {
  return registry.get(id)
}

export function listDataSources(): DataSource[] {
  return Array.from(registry.values())
}

export function initializeDataSources(config?: {
  widBaseUrl?: string
  widApiKey?: string
}): void {
  if (registry.size > 0) return
  registerDataSource(
    createWidDataSource({
      baseUrl: config?.widBaseUrl,
      apiKey: config?.widApiKey,
    }),
  )
}

export function getDefaultDataSource(): DataSource {
  initializeDataSources()
  const source = registry.get('wid')
  if (!source) {
    throw new Error('Default data source (wid) is not registered')
  }
  return source
}
