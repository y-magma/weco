import type {
  CountryOption,
  DataSeries,
  DistributionSeries,
  FetchDistributionParams,
  FetchSeriesParams,
  IndicatorMeta,
  SearchIndicatorsParams,
} from '@src/domain/types'

export interface DataSourceStatus {
  id: string
  label: string
  description: string
  website?: string
  enabled: boolean
  lastFetchAt?: string
  lastError?: string
}

export interface DataSource {
  readonly id: string
  readonly label: string
  readonly description: string
  readonly website?: string

  searchIndicators(params?: SearchIndicatorsParams): Promise<IndicatorMeta[]>
  listCountries(): Promise<CountryOption[]>
  fetchSeries(params: FetchSeriesParams): Promise<DataSeries>
  fetchDistribution(params: FetchDistributionParams): Promise<DistributionSeries>
  getStatus(): DataSourceStatus
}
