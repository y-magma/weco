import type { ParamAvailabilityEntity } from '@domain/entities'

const MAX_ENTRIES = 200

function metadataKey(sourceId: string, countryCode: string, variable: string): string {
  return `${sourceId}:${countryCode}:${variable}`
}

/** In-memory LRU cache for param metadata shared across panneaux. */
export class ParamMetadataStore {
  private readonly entries = new Map<string, ParamAvailabilityEntity>()
  private readonly order: string[] = []

  get(sourceId: string, countryCode: string, variable: string): ParamAvailabilityEntity | undefined {
    const key = metadataKey(sourceId, countryCode, variable)
    const value = this.entries.get(key)
    if (!value) return undefined
    this.touch(key)
    return value
  }

  set(
    sourceId: string,
    countryCode: string,
    variable: string,
    value: ParamAvailabilityEntity,
  ): void {
    const key = metadataKey(sourceId, countryCode, variable)
    if (!this.entries.has(key)) {
      this.order.push(key)
    }
    this.entries.set(key, value)
    this.touch(key)
    this.evictIfNeeded()
  }

  private touch(key: string): void {
    const index = this.order.indexOf(key)
    if (index >= 0) {
      this.order.splice(index, 1)
      this.order.push(key)
    }
  }

  private evictIfNeeded(): void {
    while (this.order.length > MAX_ENTRIES) {
      const oldest = this.order.shift()
      if (oldest) this.entries.delete(oldest)
    }
  }
}
