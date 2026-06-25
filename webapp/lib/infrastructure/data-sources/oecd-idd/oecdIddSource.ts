import type {
  CountryOption,
  DataSeries,
  FetchProfileParams,
  FetchVariableTimeSeriesParams,
  ListAvailableParamsParams,
  ListCountriesParams,
  ListProfileYearsParams,
  ParamAvailabilityEntity,
  PercentileProfile,
} from '@domain/entities'
import type { DataSourcePort, DataSourceStatus } from '@domain/ports/DataSourcePort'
import {
  CACHE_TTL_METADATA_MS,
  CACHE_TTL_YEARS_MS,
  dataSourceCache,
} from '@infrastructure/cache/cache'
import { OECD_IDD_INDICATORS, findOecdIndicator } from '@infrastructure/data-sources/oecd-idd/oecdIddCatalog'
import {
  isOecdDecileBundleVariable,
  isOecdDecileRatioId,
  OECD_DECILE_RATIO_OPTIONS,
} from '@infrastructure/data-sources/oecd-idd/oecdDeciles'
import { fetchOecdTimeSeries } from '@infrastructure/data-sources/oecd-idd/oecdIddClient'
import { listOecdCountries } from '@infrastructure/data-sources/oecd-idd/oecdIddCountries'

export class OecdIddDataSource implements DataSourcePort {
  readonly id = 'oecd-idd'
  readonly label = 'OECD IDD'
  readonly description =
    'OECD Income Distribution Database — Gini, ratios, pauvreté et niveaux de revenu (OCDE+).'
  readonly website = 'https://www.oecd.org/social/income-distribution-database.htm'
  readonly capabilities = {
    percentileProfile: false,
    decileProfile: true,
    timeSeries: true,
    scatter: false,
  } as const

  readonly indicators = OECD_IDD_INDICATORS

  private lastFetchAt?: string
  private lastError?: string

  async listCountries(_params?: ListCountriesParams): Promise<CountryOption[]> {
    const cacheKey = dataSourceCache.buildKey(this.id, 'countries', {})
    const cached = dataSourceCache.get<CountryOption[]>(cacheKey)
    if (cached?.length) return cached

    const countries = listOecdCountries()
    this.lastFetchAt = new Date().toISOString()
    this.lastError = undefined
    dataSourceCache.set(cacheKey, countries, CACHE_TTL_METADATA_MS)
    return countries
  }

  async listAvailableParams(_params: ListAvailableParamsParams): Promise<ParamAvailabilityEntity> {
    return { combos: [], ages: [], pops: [] }
  }

  async fetchPercentileProfile(params: FetchProfileParams): Promise<PercentileProfile> {
    throw new Error(`OECD IDD ne fournit pas de profils centile (${params.variable}).`)
  }

  async fetchVariableTimeSeries(params: FetchVariableTimeSeriesParams): Promise<DataSeries> {
    const cacheKey = dataSourceCache.buildKey(this.id, 'variable-series', params)
    const cached = dataSourceCache.get<DataSeries>(cacheKey)
    if (cached) return cached

    let fetchVariableId = params.variable
    if (isOecdDecileBundleVariable(params.variable)) {
      if (!params.percentile || !isOecdDecileRatioId(params.percentile)) {
        const message = 'Sélectionnez un ratio décile OECD (P90/P10, P50/P10 ou P90/P50).'
        this.lastError = message
        throw new Error(message)
      }
      fetchVariableId = params.percentile
    }

    const indicator = findOecdIndicator(fetchVariableId)
    if (!indicator) {
      const message = `Indicateur OECD inconnu : ${fetchVariableId}`
      this.lastError = message
      throw new Error(message)
    }

    try {
      const points = await fetchOecdTimeSeries(
        params.countryCode,
        fetchVariableId,
        params.yearFrom,
        params.yearTo,
      )

      const ratioLabel = OECD_DECILE_RATIO_OPTIONS.find((item) => item.id === fetchVariableId)?.label
      const series: DataSeries = {
        id: `${params.countryCode}-${params.variable}-${fetchVariableId}`,
        label: ratioLabel ?? `${params.countryCode} · ${indicator.label}`,
        unit: indicator.unit,
        points,
        metadata: {
          source: this.id,
          concept: indicator.concept ?? '',
          decileRatio: fetchVariableId,
        },
      }

      this.lastFetchAt = new Date().toISOString()
      this.lastError = undefined
      dataSourceCache.set(cacheKey, series)
      return series
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Échec de la requête OECD'
      throw new Error(this.lastError)
    }
  }

  async listProfileYears(params: ListProfileYearsParams): Promise<number[]> {
    const cacheKey = dataSourceCache.buildKey(this.id, 'profile-years', params)
    const cached = dataSourceCache.get<number[]>(cacheKey)
    if (cached?.length) return cached

    try {
      const points = await fetchOecdTimeSeries(params.countryCode, params.variable)
      const years = [...new Set(points.map((point) => point.year))].sort((a, b) => b - a)

      if (years.length > 0) {
        this.lastFetchAt = new Date().toISOString()
        this.lastError = undefined
        dataSourceCache.set(cacheKey, years, CACHE_TTL_YEARS_MS)
      }

      return years
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Échec de la requête OECD'
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

export function createOecdIddDataSource(): OecdIddDataSource {
  return new OecdIddDataSource()
}
