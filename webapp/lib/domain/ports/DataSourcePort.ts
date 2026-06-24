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
  SourceIndicator,
} from '@domain/entities'

export interface DataSourceStatus {
  id: string
  label: string
  description: string
  website?: string
  enabled: boolean
  lastFetchAt?: string
  lastError?: string
}

export interface DataSourceCapabilities {
  percentileProfile: boolean
  timeSeries: boolean
  scatter: boolean
}

/** Port unifié — implémenté par les adaptateurs infrastructure (WID, CSV…). */
export interface DataSourcePort {
  readonly id: string
  readonly label: string
  readonly description: string
  readonly website?: string
  readonly capabilities?: DataSourceCapabilities
  readonly indicators?: readonly SourceIndicator[]

  listCountries(params?: ListCountriesParams): Promise<CountryOption[]>
  listAvailableParams(params: ListAvailableParamsParams): Promise<ParamAvailabilityEntity>
  fetchPercentileProfile(params: FetchProfileParams): Promise<PercentileProfile>
  fetchVariableTimeSeries(params: FetchVariableTimeSeriesParams): Promise<DataSeries>
  listProfileYears(params: ListProfileYearsParams): Promise<number[]>
  getStatus(): DataSourceStatus
}
