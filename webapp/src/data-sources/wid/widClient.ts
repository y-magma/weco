import { fetchJson } from '@src/http/fetchJson'
import type { DataSeries, SeriesPoint } from '@src/domain/types'
import { buildWidApiKeyHeader } from '@src/data-sources/wid/widApiKey'
import { buildGPercentiles, parsePercentileRank } from '@src/data-sources/wid/percentiles'
import { buildVariableCode } from '@src/data-sources/wid/widCodes'
import { formatCountryLabel } from '@src/data-sources/wid/countryLabels'

export interface WidClientConfig {
  baseUrl: string
  apiKey?: string
}

export interface WidDataRow {
  country?: string
  variable?: string
  year?: number
  value?: number
  percentile?: string
}

export interface WidDataResponse {
  data?: WidDataRow[]
  rows?: WidDataRow[]
}

/** One parsed percentile observation from the live API. */
export interface WidProfileRow {
  percentile: string
  rank: number
  year: number
  value: number
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size))
  }
  return out
}

/** Normalize a WID value entry (tuple or {y,v} object) to [year, value]. */
function parseWidValueEntry(entry: unknown): [number, number] | null {
  if (Array.isArray(entry) && entry.length >= 2) {
    if (entry[0] == null || entry[1] == null) return null
    const year = Number(entry[0])
    const value = Number(entry[1])
    if (Number.isFinite(year) && Number.isFinite(value)) return [year, value]
    return null
  }
  if (entry && typeof entry === 'object') {
    const record = entry as { y?: unknown; v?: unknown; year?: unknown; value?: unknown }
    const yearRaw = record.y ?? record.year
    const valueRaw = record.v ?? record.value
    if (yearRaw == null || valueRaw == null) return null
    const year = Number(yearRaw)
    const value = Number(valueRaw)
    if (Number.isFinite(year) && Number.isFinite(value)) return [year, value]
  }
  return null
}

/**
 * Parse the nested WID `countries-variables` response into flat profile rows.
 * Shape (per the official R tool):
 *   { "<full_code>": [ { "<country>": { values: [[year, value], …] } } ], … }
 * where `<full_code>` is `sixlet_percentile_age_pop`. Keeps only the value for
 * the requested `year`. Exported as a pure function for unit testing.
 */
export function parseProfileResponse(
  response: Record<string, unknown>,
  year: number,
): WidProfileRow[] {
  const rows: WidProfileRow[] = []
  if (!response || typeof response !== 'object') return rows

  for (const [fullCode, variablePayload] of Object.entries(response)) {
    const parts = fullCode.split('_')
    if (parts.length < 2) continue
    const percentile = parts[1]!
    const rank = parsePercentileRank(percentile)
    if (Number.isNaN(rank)) continue

    const countryEntries = Array.isArray(variablePayload)
      ? variablePayload
      : [variablePayload]

    for (const countryEntry of countryEntries) {
      if (!countryEntry || typeof countryEntry !== 'object') continue
      for (const payload of Object.values(countryEntry as Record<string, unknown>)) {
        const values = (payload as { values?: unknown[] })?.values
        if (!Array.isArray(values)) continue
        for (const entry of values) {
          const parsed = parseWidValueEntry(entry)
          if (!parsed || parsed[0] !== year) continue
          rows.push({ percentile, rank, year, value: parsed[1] })
          break
        }
      }
    }
  }

  return rows
}

/** Representative g-percentiles used to probe the year span of a profile variable. */
const PROFILE_YEAR_PROBE_PERCENTILES = ['p50p51', 'p0p1', 'p90p100'] as const

/** Unique years from API rows, most recent first. */
export function extractAvailableYears(rows: Array<{ year: number }>): number[] {
  const years = new Set<number>()
  for (const row of rows) {
    if (Number.isFinite(row.year)) years.add(row.year)
  }
  return [...years].sort((a, b) => b - a)
}

/** Parse all year/value pairs from a `countries-variables` response. */
export function parseSeriesResponse(response: Record<string, unknown>): WidProfileRow[] {
  const rows: WidProfileRow[] = []
  if (!response || typeof response !== 'object') return rows

  for (const [fullCode, variablePayload] of Object.entries(response)) {
    const parts = fullCode.split('_')
    if (parts.length < 2) continue
    const percentile = parts[1]!
    const rank = parsePercentileRank(percentile)
    if (Number.isNaN(rank)) continue

    const countryEntries = Array.isArray(variablePayload)
      ? variablePayload
      : [variablePayload]

    for (const countryEntry of countryEntries) {
      if (!countryEntry || typeof countryEntry !== 'object') continue
      for (const payload of Object.values(countryEntry as Record<string, unknown>)) {
        const values = (payload as { values?: unknown[] })?.values
        if (!Array.isArray(values)) continue
        for (const entry of values) {
          const parsed = parseWidValueEntry(entry)
          if (!parsed) continue
          rows.push({ percentile, rank, year: parsed[0], value: parsed[1] })
        }
      }
    }
  }

  return rows
}

/**
 * Parse `countries-available-variables` response into sorted country codes.
 * Shape: `[{ "<sixlet>": { "<country>": [[percentile, age, pop], …], … } }]`
 */
export function parseAvailableCountriesResponse(response: unknown): string[] {
  const codes = new Set<string>()
  const entries = Array.isArray(response) ? response : [response]

  for (const item of entries) {
    if (!item || typeof item !== 'object') continue
    for (const byCountry of Object.values(item as Record<string, unknown>)) {
      if (!byCountry || typeof byCountry !== 'object') continue
      for (const code of Object.keys(byCountry as Record<string, unknown>)) {
        codes.add(code)
      }
    }
  }

  return [...codes].sort()
}

export class WidClient {
  private readonly baseUrl: string
  private readonly apiKeyHeader?: string

  constructor(config: WidClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '')
    this.apiKeyHeader = buildWidApiKeyHeader(config.apiKey)
  }

  private headers(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    }
    if (this.apiKeyHeader) {
      headers['x-api-key'] = this.apiKeyHeader
    }
    return headers
  }

  async listCountries(): Promise<{ code: string; label: string }[]> {
    const response = await fetchJson<unknown>(
      `${this.baseUrl}/countries-available-variables?countries=all&variables=ahweal`,
      { headers: this.headers() },
    )
    return parseAvailableCountriesResponse(response).map((code) => ({
      code,
      label: formatCountryLabel(code),
    }))
  }

  async fetchData(params: {
    areas: string[]
    variables: string[]
    years?: number[]
  }): Promise<WidDataRow[]> {
    const searchParams = new URLSearchParams()
    searchParams.set('areas', params.areas.join(','))
    searchParams.set('variables', params.variables.join(','))
    if (params.years?.length) {
      searchParams.set('years', params.years.join(','))
    }

    const response = await fetchJson<WidDataResponse>(
      `${this.baseUrl}/data?${searchParams.toString()}`,
      { headers: this.headers() },
    )

    return response.data ?? response.rows ?? []
  }

  /**
   * Fetch one variable across all 127 g-percentiles for a single area/year.
   * Builds the explicit `sixlet_percentile_age_pop` codes and requests them in
   * chunks (the webservice rejects very large requests). Returns one row per
   * percentile that actually has a value for the requested year.
   */
  async fetchProfileData(params: {
    area: string
    sixlet: string
    age: string
    pop: string
    year: number
  }): Promise<WidProfileRow[]> {
    const codes = buildGPercentiles().map((percentile) =>
      buildVariableCode(params.sixlet, percentile, params.age, params.pop),
    )

    const rows: WidProfileRow[] = []
    for (const group of chunk(codes, 20)) {
      const searchParams = new URLSearchParams()
      searchParams.set('countries', params.area)
      searchParams.set('variables', group.join(','))
      searchParams.set('years', String(params.year))

      const response = await fetchJson<Record<string, unknown>>(
        `${this.baseUrl}/countries-variables?${searchParams.toString()}`,
        { headers: this.headers() },
      )

      rows.push(...parseProfileResponse(response, params.year))
    }

    return rows.sort((a, b) => a.rank - b.rank)
  }

  /**
   * List calendar years for which a profile variable has data (country / age / pop).
   * Probes a few representative g-percentiles in one request and merges their spans.
   */
  async listProfileYears(params: {
    area: string
    sixlet: string
    age: string
    pop: string
  }): Promise<number[]> {
    const codes = PROFILE_YEAR_PROBE_PERCENTILES.map((percentile) =>
      buildVariableCode(params.sixlet, percentile, params.age, params.pop),
    )
    const searchParams = new URLSearchParams()
    searchParams.set('countries', params.area)
    searchParams.set('variables', codes.join(','))
    searchParams.set('years', 'all')

    const response = await fetchJson<Record<string, unknown>>(
      `${this.baseUrl}/countries-variables?${searchParams.toString()}`,
      { headers: this.headers() },
    )

    return extractAvailableYears(parseSeriesResponse(response))
  }

  /** Fetch a single indicator/percentile time series for one country. */
  async fetchIndicatorSeries(params: {
    area: string
    sixlet: string
    age: string
    pop: string
    percentile: string
    yearFrom?: number
    yearTo?: number
  }): Promise<{ year: number; value: number }[]> {
    const code = buildVariableCode(
      params.sixlet,
      params.percentile,
      params.age,
      params.pop,
    )
    const searchParams = new URLSearchParams()
    searchParams.set('countries', params.area)
    searchParams.set('variables', code)
    searchParams.set('years', 'all')

    const response = await fetchJson<Record<string, unknown>>(
      `${this.baseUrl}/countries-variables?${searchParams.toString()}`,
      { headers: this.headers() },
    )

    return parseSeriesResponse(response)
      .filter((row) => {
        if (params.yearFrom != null && row.year < params.yearFrom) return false
        if (params.yearTo != null && row.year > params.yearTo) return false
        return true
      })
      .map((row) => ({ year: row.year, value: row.value }))
      .sort((a, b) => a.year - b.year)
  }

  mapRowsToSeries(
    rows: WidDataRow[],
    seriesId: string,
    label: string,
    yearFrom?: number,
    yearTo?: number,
  ): DataSeries {
    const points: SeriesPoint[] = rows
      .filter((row) => typeof row.year === 'number' && typeof row.value === 'number')
      .filter((row) => {
        if (yearFrom && row.year! < yearFrom) return false
        if (yearTo && row.year! > yearTo) return false
        return true
      })
      .map((row) => ({ year: row.year!, value: row.value! }))
      .sort((a, b) => a.year - b.year)

    return {
      id: seriesId,
      label,
      points,
      metadata: { sample: false },
    }
  }
}
