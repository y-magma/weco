interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const DEFAULT_TTL_MS = 5 * 60 * 1000

/** Metadata (age/pop combos, countries per variable) — rarely changes. */
export const CACHE_TTL_METADATA_MS = 24 * 60 * 60 * 1000

/** Available years for a param combo. */
export const CACHE_TTL_YEARS_MS = 60 * 60 * 1000

export class DataSourceCache {
  private store = new Map<string, CacheEntry<unknown>>()

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return undefined
    }
    return entry.value as T
  }

  set<T>(key: string, value: T, ttlMs = DEFAULT_TTL_MS): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    })
  }

  buildKey(sourceId: string, operation: string, params: unknown): string {
    return `${sourceId}:${operation}:${JSON.stringify(params)}`
  }
}

export const dataSourceCache = new DataSourceCache()
