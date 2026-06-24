import type {
  CountryOption,
  DataSeries,
  FetchProfileParams,
  FetchVariableTimeSeriesParams,
  ParamAvailabilityEntity,
  PercentileProfile,
  SourceIndicator,
} from '@domain/entities'
import type { DataSourcePort, DataSourceStatus } from '@domain/ports/DataSourcePort'

const STUB_INDICATORS: SourceIndicator[] = [
  { id: 'gdp', label: 'PIB par habitant', unit: 'USD', kind: 'scalar' },
  { id: 'gini', label: 'Gini', unit: 'coefficient', kind: 'gini' },
]

const STUB_COUNTRIES: CountryOption[] = [
  { code: 'FR', label: 'France' },
  { code: 'US', label: 'États-Unis' },
]

export function createStubDataSource(overrides?: Partial<DataSourcePort>): DataSourcePort {
  const source: DataSourcePort = {
    id: 'stub',
    label: 'Stub source',
    description: 'Minimal test data source for multi-source routing.',
    capabilities: {
      percentileProfile: false,
      timeSeries: true,
      scatter: false,
    },
    indicators: STUB_INDICATORS,

    async listCountries(): Promise<CountryOption[]> {
      return STUB_COUNTRIES
    },

    async listAvailableParams(): Promise<ParamAvailabilityEntity> {
      return { combos: [], ages: [], pops: [] }
    },

    async fetchPercentileProfile(params: FetchProfileParams): Promise<PercentileProfile> {
      throw new Error(`Stub source does not support profiles (${params.variable})`)
    },

    async fetchVariableTimeSeries(params: FetchVariableTimeSeriesParams): Promise<DataSeries> {
      return {
        id: `${params.countryCode}-${params.variable}`,
        label: params.variable,
        unit: STUB_INDICATORS.find((item) => item.id === params.variable)?.unit,
        points: [
          { year: 2019, value: 100 },
          { year: 2020, value: 102 },
          { year: 2021, value: 101 },
        ],
      }
    },

    async listProfileYears(): Promise<number[]> {
      return [2019, 2020, 2021]
    },

    getStatus(): DataSourceStatus {
      return {
        id: 'stub',
        label: 'Stub source',
        description: 'Test adapter',
        enabled: true,
        lastFetchAt: new Date().toISOString(),
      }
    },

    ...overrides,
  }

  return source
}
