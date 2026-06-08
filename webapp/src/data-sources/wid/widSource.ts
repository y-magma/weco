import type {
  CountryOption,
  DataSeries,
  DistributionSeries,
  FetchDistributionParams,
  FetchProfileParams,
  FetchSeriesParams,
  IndicatorMeta,
  PercentilePoint,
  PercentileProfile,
  SearchIndicatorsParams,
} from '@src/domain/types'
import { findWidVariable, measureKind } from '@src/data-sources/wid/widCodes'
import type { DataSource, DataSourceStatus } from '@src/data-sources/Source'
import { DataSourceError } from '@src/data-sources/errors'
import { dataSourceCache } from '@src/data-sources/cache'
import {
  WID_COUNTRIES,
  WID_INDICATORS,
  WID_STRESS_PROXY_INDICATORS,
} from '@src/data-sources/wid/indicators'
import {
  getSampleDistribution,
  getSampleProfile,
  getSampleScatter,
  getSampleSeries,
} from '@src/data-sources/wid/sampleData'
import { WidClient } from '@src/data-sources/wid/widClient'

export class WidDataSource implements DataSource {
  readonly id = 'wid'
  readonly label = 'WID.world'
  readonly description =
    'World Inequality Database — distributional national accounts and inequality indicators.'
  readonly website = 'https://wid.world/'

  private client: WidClient
  private useSampleData: boolean
  private lastFetchAt?: string
  private lastError?: string

  constructor(config: { baseUrl: string; apiKey?: string }) {
    this.client = new WidClient(config)
    this.useSampleData = !config.apiKey
  }

  async searchIndicators(params?: SearchIndicatorsParams): Promise<IndicatorMeta[]> {
    const all = [...WID_INDICATORS, ...WID_STRESS_PROXY_INDICATORS]
    const query = params?.query?.toLowerCase().trim()

    if (!query) return all

    return all.filter(
      (indicator) =>
        indicator.label.toLowerCase().includes(query)
        || indicator.id.toLowerCase().includes(query),
    )
  }

  async listCountries(): Promise<CountryOption[]> {
    if (this.useSampleData) {
      return WID_COUNTRIES
    }

    const cacheKey = dataSourceCache.buildKey(this.id, 'countries', {})
    const cached = dataSourceCache.get<CountryOption[]>(cacheKey)
    if (cached) return cached

    try {
      const countries = await this.client.listCountries()
      this.lastFetchAt = new Date().toISOString()
      this.lastError = undefined
      dataSourceCache.set(cacheKey, countries)
      return countries
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Unknown error'
      return WID_COUNTRIES
    }
  }

  async fetchSeries(params: FetchSeriesParams): Promise<DataSeries> {
    const cacheKey = dataSourceCache.buildKey(this.id, 'series', params)
    const cached = dataSourceCache.get<DataSeries>(cacheKey)
    if (cached) return cached

    if (this.useSampleData || params.indicatorId === 'stress_index') {
      const series = getSampleSeries(
        params.countryCode,
        params.indicatorId,
        params.yearFrom,
        params.yearTo,
      )
      dataSourceCache.set(cacheKey, series)
      return series
    }

    try {
      const years: number[] = []
      if (params.yearFrom && params.yearTo) {
        for (let year = params.yearFrom; year <= params.yearTo; year++) {
          years.push(year)
        }
      }

      const rows = await this.client.fetchData({
        areas: [params.countryCode],
        variables: [params.indicatorId],
        years: years.length ? years : undefined,
      })

      const indicator = WID_INDICATORS.find((item) => item.id === params.indicatorId)
      const series = this.client.mapRowsToSeries(
        rows,
        `${params.countryCode}-${params.indicatorId}`,
        `${params.countryCode} · ${indicator?.label ?? params.indicatorId}`,
        params.yearFrom,
        params.yearTo,
      )

      this.lastFetchAt = new Date().toISOString()
      this.lastError = undefined
      dataSourceCache.set(cacheKey, series)
      return series
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Unknown error'
      throw new DataSourceError(this.id, `Failed to fetch series: ${this.lastError}`, {
        cause: error,
      })
    }
  }

  async fetchDistribution(params: FetchDistributionParams): Promise<DistributionSeries> {
    const cacheKey = dataSourceCache.buildKey(this.id, 'distribution', params)
    const cached = dataSourceCache.get<DistributionSeries>(cacheKey)
    if (cached) return cached

    const distribution = getSampleDistribution(
      params.countryCode,
      params.indicatorId,
      params.year ?? 2020,
    )
    dataSourceCache.set(cacheKey, distribution)
    return distribution
  }

  /** True when the source has no API key and serves offline sample data. */
  isSampleMode(): boolean {
    return this.useSampleData
  }

  /**
   * Fetch a WID variable across the 127 g-percentiles for a fixed
   * country / year / age / pop. Falls back to sample data when no API key is
   * configured or when the live request fails / returns nothing.
   */
  async fetchPercentileProfile(params: FetchProfileParams): Promise<PercentileProfile> {
    const cacheKey = dataSourceCache.buildKey(this.id, 'profile', params)
    const cached = dataSourceCache.get<PercentileProfile>(cacheKey)
    if (cached) return cached

    const sample = () =>
      getSampleProfile(
        params.countryCode,
        params.variable,
        params.year,
        params.age,
        params.pop,
      )

    if (this.useSampleData) {
      const profile = sample()
      dataSourceCache.set(cacheKey, profile)
      return profile
    }

    try {
      const rows = await this.client.fetchProfileData({
        area: params.countryCode,
        sixlet: params.variable,
        age: params.age,
        pop: params.pop,
        year: params.year,
      })

      if (!rows.length) {
        return sample()
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
        label: `${params.countryCode} · ${meta?.label ?? params.variable} (${params.year})`,
        points,
        sample: false,
      }

      this.lastFetchAt = new Date().toISOString()
      this.lastError = undefined
      dataSourceCache.set(cacheKey, profile)
      return profile
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Unknown error'
      // Graceful degradation: never break the UI on a live API hiccup.
      return sample()
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

  getSampleScatterData(
    inequalityIndicatorId: string,
    stressIndicatorId: string,
    yearFrom?: number,
    yearTo?: number,
  ) {
    return getSampleScatter(
      inequalityIndicatorId,
      stressIndicatorId,
      yearFrom,
      yearTo,
    )
  }
}

export function createWidDataSource(config?: {
  baseUrl?: string
  apiKey?: string
}): WidDataSource {
  const runtimeConfig = config ?? {
    baseUrl: 'https://rfap9nitz6.execute-api.eu-west-1.amazonaws.com/prod',
    apiKey: undefined,
  }

  return new WidDataSource({
    baseUrl:
      runtimeConfig.baseUrl
      ?? 'https://rfap9nitz6.execute-api.eu-west-1.amazonaws.com/prod',
    apiKey: runtimeConfig.apiKey,
  })
}
