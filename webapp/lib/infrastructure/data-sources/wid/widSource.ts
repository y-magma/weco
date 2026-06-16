import type {
  CountryOption,
  DataSeries,
  DistributionSeries,
  FetchDistributionParams,
  FetchProfileParams,
  ListProfileYearsParams,
  FetchSeriesParams,
  FetchVariableTimeSeriesParams,
  IndicatorMeta,
  PercentilePoint,
  PercentileProfile,
  SearchIndicatorsParams,
} from '@domain/entities'
import { findWidVariable, measureKind } from '@domain/catalog/widCodes'
import type { DataSourcePort, DataSourceStatus } from '@domain/ports/DataSourcePort'
import { dataSourceCache } from '@infrastructure/cache/cache'
import {
  WID_INDICATORS,
} from '@domain/catalog/indicators'
import {
  WID_EMPTY_COUNTRIES_ERROR,
  WID_NO_API_KEY_ERROR,
  widApiRequestError,
  widEmptyProfileError,
  widEmptySeriesError,
} from '@infrastructure/data-sources/wid/widErrors'
import { WidClient } from '@infrastructure/data-sources/wid/widClient'

const DEFAULT_WID_API_BASE_URL =
  'https://rfap9nitz6.execute-api.eu-west-1.amazonaws.com/prod'

/** Default g-percentile used when reading a single-series WID indicator. */
const SERIES_PERCENTILE: Record<string, string> = {
  sptinc: 'p90p100',
  sptop1: 'p99p100',
  ghini: 'p0p100',
  ahwbus: 'p0p100',
}

function seriesPercentile(sixlet: string): string {
  if (SERIES_PERCENTILE[sixlet]) return SERIES_PERCENTILE[sixlet]!
  return sixlet.charAt(0).toLowerCase() === 's' ? 'p90p100' : 'p0p100'
}

export class WidDataSource implements DataSourcePort {
  readonly id = 'wid'
  readonly label = 'WID.world'
  readonly description =
    'World Inequality Database — distributional national accounts and inequality indicators.'
  readonly website = 'https://wid.world/'
  readonly capabilities = {
    percentileProfile: true,
    timeSeries: true,
    scatter: true,
  } as const

  private readonly liveClient?: WidClient
  private lastFetchAt?: string
  private lastError?: string

  constructor(config?: { baseUrl?: string; apiKey?: string }) {
    if (config?.apiKey?.trim()) {
      this.liveClient = new WidClient({
        baseUrl: config.baseUrl ?? DEFAULT_WID_API_BASE_URL,
        apiKey: config.apiKey,
      })
    }
  }

  private requireLiveClient(): WidClient {
    if (!this.liveClient) {
      this.lastError = WID_NO_API_KEY_ERROR
      throw new Error(WID_NO_API_KEY_ERROR)
    }
    return this.liveClient
  }

  async searchIndicators(params?: SearchIndicatorsParams): Promise<IndicatorMeta[]> {
    const query = params?.query?.toLowerCase().trim()

    if (!query) return WID_INDICATORS

    return WID_INDICATORS.filter(
      (indicator) =>
        indicator.label.toLowerCase().includes(query)
        || indicator.id.toLowerCase().includes(query),
    )
  }

  async listCountries(): Promise<CountryOption[]> {
    const cacheKey = dataSourceCache.buildKey(this.id, 'countries', {})
    const cached = dataSourceCache.get<CountryOption[]>(cacheKey)
    if (cached?.length) return cached

    const client = this.requireLiveClient()

    try {
      const countries = await client.listCountries()
      if (countries.length > 0) {
        this.lastFetchAt = new Date().toISOString()
        this.lastError = undefined
        dataSourceCache.set(cacheKey, countries)
        return countries
      }

      this.lastError = WID_EMPTY_COUNTRIES_ERROR
      throw new Error(WID_EMPTY_COUNTRIES_ERROR)
    } catch (error) {
      if (error instanceof Error && error.message === WID_EMPTY_COUNTRIES_ERROR) {
        throw error
      }
      this.lastError = widApiRequestError(error)
      throw new Error(this.lastError)
    }
  }

  async fetchSeries(params: FetchSeriesParams): Promise<DataSeries> {
    const cacheKey = dataSourceCache.buildKey(this.id, 'series', params)
    const cached = dataSourceCache.get<DataSeries>(cacheKey)
    if (cached) return cached

    const client = this.requireLiveClient()

    try {
      const points = await client.fetchIndicatorSeries({
        area: params.countryCode,
        sixlet: params.indicatorId,
        age: '992',
        pop: 'j',
        percentile: seriesPercentile(params.indicatorId),
        yearFrom: params.yearFrom,
        yearTo: params.yearTo,
      })

      if (!points.length) {
        const message = widEmptySeriesError(params)
        this.lastError = message
        throw new Error(message)
      }

      const indicator = WID_INDICATORS.find((item) => item.id === params.indicatorId)
      const series: DataSeries = {
        id: `${params.countryCode}-${params.indicatorId}`,
        label: `${params.countryCode} · ${indicator?.label ?? params.indicatorId}`,
        points,
        metadata: { sample: false },
      }

      this.lastFetchAt = new Date().toISOString()
      this.lastError = undefined
      dataSourceCache.set(cacheKey, series)
      return series
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("L'API WID n'a renvoyé aucune série")) {
        throw error
      }
      this.lastError = widApiRequestError(error)
      throw new Error(this.lastError)
    }
  }

  async fetchVariableTimeSeries(params: FetchVariableTimeSeriesParams): Promise<DataSeries> {
    const cacheKey = dataSourceCache.buildKey(this.id, 'variable-series', params)
    const cached = dataSourceCache.get<DataSeries>(cacheKey)
    if (cached) return cached

    const client = this.requireLiveClient()
    const percentile = params.percentile ?? 'p50p51'

    try {
      const points = await client.fetchIndicatorSeries({
        area: params.countryCode,
        sixlet: params.variable,
        age: params.age,
        pop: params.pop,
        percentile,
        yearFrom: params.yearFrom,
        yearTo: params.yearTo,
      })

      if (!points.length) {
        const message =
          `L'API WID n'a renvoyé aucune série pour ${params.countryCode} · `
          + `${params.variable} (${percentile}, ${params.age}/${params.pop}).`
        this.lastError = message
        throw new Error(message)
      }

      const meta = findWidVariable(params.variable)
      const series: DataSeries = {
        id: `${params.countryCode}-${params.variable}-${percentile}-${params.age}-${params.pop}`,
        label: `${params.countryCode} · ${meta?.label ?? params.variable}`,
        unit: meta?.unit,
        points,
        metadata: { sample: false, percentile },
      }

      this.lastFetchAt = new Date().toISOString()
      this.lastError = undefined
      dataSourceCache.set(cacheKey, series)
      return series
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("L'API WID n'a renvoyé aucune série")) {
        throw error
      }
      this.lastError = widApiRequestError(error)
      throw new Error(this.lastError)
    }
  }

  async fetchDistribution(_params: FetchDistributionParams): Promise<DistributionSeries> {
    const message =
      "La distribution par percentile n'est pas disponible via l'API WID (données synthétiques retirées)."
    this.lastError = message
    throw new Error(message)
  }

  usesLiveApi(): boolean {
    return Boolean(this.liveClient)
  }

  async listProfileYears(params: ListProfileYearsParams): Promise<number[]> {
    const cacheKey = dataSourceCache.buildKey(this.id, 'profile-years', params)
    const cached = dataSourceCache.get<number[]>(cacheKey)
    if (cached?.length) return cached

    const client = this.requireLiveClient()

    try {
      const years = await client.listProfileYears({
        area: params.countryCode,
        sixlet: params.variable,
        age: params.age,
        pop: params.pop,
      })

      if (years.length > 0) {
        this.lastFetchAt = new Date().toISOString()
        this.lastError = undefined
        dataSourceCache.set(cacheKey, years)
      }

      return years
    } catch (error) {
      this.lastError = widApiRequestError(error)
      throw new Error(this.lastError)
    }
  }

  async fetchPercentileProfile(params: FetchProfileParams): Promise<PercentileProfile> {
    const cacheKey = dataSourceCache.buildKey(this.id, 'profile', params)
    const cached = dataSourceCache.get<PercentileProfile>(cacheKey)
    if (cached) return cached

    const client = this.requireLiveClient()

    try {
      const rows = await client.fetchProfileData({
        area: params.countryCode,
        sixlet: params.variable,
        age: params.age,
        pop: params.pop,
        year: params.year,
      })

      if (!rows.length) {
        const message = widEmptyProfileError(params)
        this.lastError = message
        throw new Error(message)
      }

      const meta = findWidVariable(params.variable)
      const points: PercentilePoint[] = rows.map((row) => ({
        percentile: row.percentile,
        rank: row.rank,
        value: row.value,
      }))

      const profile: PercentileProfile = {
        id: `${params.countryCode}-${params.variable}-${params.age}-${params.pop}-${params.year}`,
        country: params.countryCode,
        variable: params.variable,
        year: params.year,
        age: params.age,
        pop: params.pop,
        kind: measureKind(params.variable),
        unit: meta?.unit,
        label: meta?.label ?? params.variable,
        points,
        sample: false,
      }

      this.lastFetchAt = new Date().toISOString()
      this.lastError = undefined
      dataSourceCache.set(cacheKey, profile)
      return profile
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("L'API WID n'a renvoyé aucune donnée")) {
        throw error
      }
      this.lastError = widApiRequestError(error)
      throw new Error(this.lastError)
    }
  }

  getStatus(): DataSourceStatus {
    return {
      id: this.id,
      label: this.label,
      description: this.description,
      website: this.website,
      enabled: true,
      lastFetchAt: this.lastFetchAt,
      lastError: this.lastError,
    }
  }
}

export function createWidDataSource(config?: {
  baseUrl?: string
  apiKey?: string
}): WidDataSource {
  return new WidDataSource(config)
}
