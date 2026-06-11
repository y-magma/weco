import { fetchJson } from '@src/http/fetchJson'
import type { CountryOption } from '@src/domain/types'

/**
 * Client for the local WID data served by the Nitro routes under `/api/wid/*`.
 * These routes read the on-disk WID.world dump (see `server/utils/widCsv.ts`),
 * so the app needs no external API nor API key.
 */

export interface WidLocalProfileRow {
  percentile: string
  rank: number
  value: number
}

export class WidLocalClient {
  async fetchProfile(params: {
    country: string
    sixlet: string
    age: string
    pop: string
    year: number
  }): Promise<WidLocalProfileRow[]> {
    const search = new URLSearchParams({
      country: params.country,
      variable: params.sixlet,
      age: params.age,
      pop: params.pop,
      year: String(params.year),
    })
    const response = await fetchJson<{ points?: WidLocalProfileRow[] }>(
      `/api/wid/profile?${search.toString()}`,
    )
    return response.points ?? []
  }

  async fetchSeries(params: {
    country: string
    sixlet: string
    age: string
    pop: string
    percentile?: string
    yearFrom?: number
    yearTo?: number
  }): Promise<{ year: number; value: number }[]> {
    const search = new URLSearchParams({
      country: params.country,
      variable: params.sixlet,
      age: params.age,
      pop: params.pop,
    })
    if (params.percentile) search.set('percentile', params.percentile)
    if (params.yearFrom != null) search.set('yearFrom', String(params.yearFrom))
    if (params.yearTo != null) search.set('yearTo', String(params.yearTo))

    const response = await fetchJson<{ points?: { year: number; value: number }[] }>(
      `/api/wid/series?${search.toString()}`,
    )
    return response.points ?? []
  }

  async listCountries(): Promise<CountryOption[]> {
    const response = await fetchJson<{ countries?: CountryOption[] }>('/api/wid/countries')
    return response.countries ?? []
  }
}
