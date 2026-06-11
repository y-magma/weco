import { fetchJson } from '@src/http/fetchJson'
import type { DataSeries, SeriesPoint } from '@src/domain/types'
import { buildWidApiKeyHeader } from '@src/data-sources/wid/widApiKey'
import { buildGPercentiles, parsePercentileRank } from '@src/data-sources/wid/percentiles'
import { buildVariableCode } from '@src/data-sources/wid/widCodes'

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
    const response = await fetchJson<{ countries?: { code: string; label: string }[] }>(
      `${this.baseUrl}/countries-variables`,
      { headers: this.headers() },
    )
    return response.countries ?? []
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
