import type { DataSourcePort } from '@domain/ports/DataSourcePort'
import { createOecdIddDataSource } from '@infrastructure/data-sources/oecd-idd/oecdIddSource'
import { createWidDataSource } from '@infrastructure/data-sources/wid/widSource'

const registry = new Map<string, DataSourcePort>()
let defaultSourceId: string | undefined

export interface DataSourcesConfig {
  defaultSourceId?: string
  wid?: {
    apiKey?: string
    baseUrl?: string
  }
}

export function registerDataSource(source: DataSourcePort): void {
  registry.set(source.id, source)
}

export function listDataSources(): DataSourcePort[] {
  return Array.from(registry.values())
}

export function resetDataSourcesRegistry(): void {
  registry.clear()
  defaultSourceId = undefined
}

export function initializeDataSources(config?: DataSourcesConfig): void {
  if (registry.size > 0) return

  if (config?.wid) {
    registerDataSource(createWidDataSource({
      apiKey: config.wid.apiKey,
      baseUrl: config.wid.baseUrl,
    }))
  }

  registerDataSource(createOecdIddDataSource())

  defaultSourceId = config?.defaultSourceId ?? listDataSources().find((s) => s.id === 'wid')?.id
    ?? listDataSources()[0]?.id
}

export function getDefaultDataSource(): DataSourcePort {
  initializeDataSources()
  const id = defaultSourceId ?? listDataSources()[0]?.id
  if (!id) {
    throw new Error('No data source is registered')
  }
  const source = registry.get(id)
  if (!source) {
    throw new Error(`Default data source (${id}) is not registered`)
  }
  return source
}

export function getDataSourceById(id: string): DataSourcePort | undefined {
  return registry.get(id)
}
