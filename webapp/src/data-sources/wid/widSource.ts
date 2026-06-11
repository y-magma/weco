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
import { WidClient } from '@src/data-sources/wid/widClient'
import { WidLocalClient } from '@src/data-sources/wid/widLocalClient'

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

export class WidDataSource implements DataSource {
  readonly id = 'wid'
  readonly label = 'WID.world'
  readonly description =
    'World Inequality Database — distributional national accounts and inequality indicators.'
  readonly website = 'https://wid.world/'

  private readonly mode: 'live' | 'local'
  private readonly liveClient?: WidClient
  private readonly localClient?: WidLocalClient
  private lastFetchAt?: string
  private lastError?: string

  constructor(config?: { baseUrl?: string; apiKey?: string }) {
    if (config?.apiKey?.trim()) {
      this.mode = 'live'
      this.liveClient = new WidClient({
        baseUrl: config.baseUrl ?? DEFAULT_WID_API_BASE_URL,
        apiKey: config.apiKey,
      })
    } else {
      this.mode = 'local'
      this.localClient = new WidLocalClient()
    }
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
    const cacheKey = dataSourceCache.buildKey(this.id, 'countries', {})
    const cached = dataSourceCache.get<CountryOption[]>(cacheKey)
    if (cached) return cached

    try {
      const countries = this.mode === 'live'
        ? await this.liveClient!.listCountries()
        : await this.localClient!.listCountries()
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
      if (this.mode === 'live') {
        const years: number[] = []
        if (params.yearFrom && params.yearTo) {
          for (let year = params.yearFrom; year <= params.yearTo; year++) {
            years.push(year)
          }
        }

        const rows = await this.liveClient!.fetchData({
          areas: [params.countryCode],
          variables: [params.indicatorId],
          years: years.length ? years : undefined,
        })

        const indicator = WID_INDICATORS.find((item) => item.id === params.indicatorId)
        const series = this.liveClient!.mapRowsToSeries(
          rows,
          `${params.countryCode}-${params.indicatorId}`,
          `${params.countryCode} · ${indicator?.label ?? params.indicatorId}`,
          params.yearFrom,
          params.yearTo,
        )

        if (!series.points.length) {
          const fallback = sampleSeries()
          dataSourceCache.set(cacheKey, fallback)
          return fallback
        }

        this.lastFetchAt = new Date().toISOString()
        this.lastError = undefined
        dataSourceCache.set(cacheKey, series)
        return series
      }

      const points = await this.localClient!.fetchSeries({
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

  /** True when the last profile load fell back to synthetic sample data. */
  isSampleMode(): boolean {
    return false
  }

  usesLiveApi(): boolean {
    return this.mode === 'live'
  }

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

    try {
      const rows = this.mode === 'live'
        ? await this.liveClient!.fetchProfileData({
            area: params.countryCode,
            sixlet: params.variable,
            age: params.age,
            pop: params.pop,
            year: params.year,
          })
        : await this.localClient!.fetchProfile({
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
  return new WidDataSource(config)
}
