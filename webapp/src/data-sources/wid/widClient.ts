import { fetchJson } from '@src/http/fetchJson'
import type { DataSeries, SeriesPoint } from '@src/domain/types'
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

function base64Encode(input: string): string {
  if (typeof btoa === 'function') return btoa(input)
  // Fallback for SSR / Node contexts.
  const g = globalThis as unknown as { Buffer?: { from(s: string): { toString(enc: string): string } } }
  if (g.Buffer) return g.Buffer.from(input).toString('base64')
  return input
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size))
  }
  return out
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
        const values = (payload as { values?: [number, number][] })?.values
        if (!Array.isArray(values)) continue
        const match = values.find((pair) => Number(pair?.[0]) === year)
        if (match && typeof match[1] === 'number' && Number.isFinite(match[1])) {
          rows.push({ percentile, rank, year, value: match[1] })
        }
      }
    }
  }

  return rows
}

export class WidClient {
  private readonly baseUrl: string
  private readonly apiKey?: string

  constructor(config: WidClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '')
    this.apiKey = config.apiKey
  }

  private headers(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    }
    if (this.apiKey) {
      // The WID webservice expects the (public) API key base64-encoded,
      // matching the official `wid` R package.
      headers['x-api-key'] = base64Encode(this.apiKey)
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
