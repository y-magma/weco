import { fetchJson } from '@src/http/fetchJson'
import type { DataSeries, SeriesPoint } from '@src/domain/types'

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
      headers['x-api-key'] = this.apiKey
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
