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
import { WidLocalClient } from '@src/data-sources/wid/widLocalClient'

/** Default g-percentile used when reading a single-series WID indicator. */
const SERIES_PERCENTILE: Record<string, string> = {
  sptinc: 'p90p100',
  sptop1: 'p99p100',
  ghini: 'p0p100',
  ahwbus: 'p0p100',
}

function seriesPercentile(sixlet: string): string {
  if (SERIES_PERCENTILE[sixlet]) return SERIES_PERCENTILE[sixlet]!
  // Share indicators (s…) default to the top decile, others to the whole pop.
  return sixlet.charAt(0).toLowerCase() === 's' ? 'p90p100' : 'p0p100'
}

export class WidDataSource implements DataSource {
  readonly id = 'wid'
  readonly label = 'WID.world'
  readonly description =
    'World Inequality Database — distributional national accounts and inequality indicators.'
  readonly website = 'https://wid.world/'

  private client: WidLocalClient
  private useSampleData = false
  private lastFetchAt?: string
  private lastError?: string

  constructor(_config?: { baseUrl?: string; apiKey?: string }) {
    // Data now comes from the local WID dump via the Nitro `/api/wid/*` routes;
    // no external API nor API key is involved.
    this.client = new WidLocalClient()
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

    // The synthetic stress proxy has no WID counterpart on disk.
    if (params.indicatorId === 'stress_index') {
      const series = getSampleSeries(
        params.countryCode,
        params.indicatorId,
        params.yearFrom,
        params.yearTo,
      )
      dataSourceCache.set(cacheKey, series)
      return series
    }

    const sampleSeries = () =>
      getSampleSeries(params.countryCode, params.indicatorId, params.yearFrom, params.yearTo)

    try {
      const points = await this.client.fetchSeries({
        country: params.countryCode,
        sixlet: params.indicatorId,
        age: '992',
        pop: 'j',
        percentile: seriesPercentile(params.indicatorId),
        yearFrom: params.yearFrom,
        yearTo: params.yearTo,
      })

      if (!points.length) {
        const fallback = sampleSeries()
        dataSourceCache.set(cacheKey, fallback)
        return fallback
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
      this.lastError = error instanceof Error ? error.message : 'Unknown error'
      // Never break the dashboard on a local read hiccup.
      return sampleSeries()
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
      const rows = await this.client.fetchProfile({
        country: params.countryCode,
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

export function createWidDataSource(_config?: {
  baseUrl?: string
  apiKey?: string
}): WidDataSource {
  // Config is accepted for backward compatibility but unused: data is read
  // from the local WID dump through the Nitro `/api/wid/*` routes.
  return new WidDataSource()
}
