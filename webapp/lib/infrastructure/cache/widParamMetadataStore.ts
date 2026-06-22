import type { WidParamAvailabilityEntity } from '@domain/entities'

const MAX_ENTRIES = 200

function metadataKey(countryCode: string, variable: string): string {
  return `${countryCode}:${variable}`
}

/** In-memory LRU cache for WID param metadata shared across panneaux. */
export class WidParamMetadataStore {
  private readonly entries = new Map<string, WidParamAvailabilityEntity>()
  private readonly order: string[] = []

  get(countryCode: string, variable: string): WidParamAvailabilityEntity | undefined {
    const key = metadataKey(countryCode, variable)
    const value = this.entries.get(key)
    if (!value) return undefined
    this.touch(key)
    return value
  }

  set(countryCode: string, variable: string, value: WidParamAvailabilityEntity): void {
    const key = metadataKey(countryCode, variable)
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

export const widParamMetadataStore = new WidParamMetadataStore()
