export interface SeriesPoint {
  year: number
  value: number
}

export interface DataSeries {
  id: string
  label: string
  unit?: string
  points: SeriesPoint[]
  metadata?: Record<string, string | number | boolean>
}

/** A single g-percentile observation of a WID variable. */
export interface PercentilePoint {
  /** WID percentile code, e.g. `p90p91`. */
  percentile: string
  /** Parsed lower bound (rank in percent) used for ordering. */
  rank: number
  /** Measured value, or null for an explicit gap (no hidden interpolation). */
  value: number | null
}

/**
 * Distribution of a WID variable across the 127 g-percentiles, for a fixed
 * country / variable / year / age / pop. Points are ordered by rank.
 */
export interface PercentileProfile {
  id: string
  country: string
  /** Six-letter variable, e.g. `ahweal`. */
  variable: string
  year: number
  age: string
  pop: string
  label: string
  unit?: string
  /** Measure kind from the WID sixlet prefix (a…, t…, l…, etc.). */
  kind: 'average' | 'threshold' | 'groupLevel' | 'share' | 'gini' | 'scalar' | 'other'
  points: PercentilePoint[]
  /** True when produced from offline sample data instead of the live API. */
  sample: boolean
}

export interface FetchProfileParams {
  countryCode: string
  /** Six-letter variable, e.g. `ahweal`. */
  variable: string
  year: number
  age: string
  pop: string
}

/** Profile filters without year — used to query available years from the API. */
export type ListProfileYearsParams = Omit<FetchProfileParams, 'year'>

export interface CountryOption {
  code: string
  label: string
}

export interface ListCountriesParams {
  /** Six-letter variable used to probe country availability. */
  variable: string
}

export interface ListAvailableParamsParams {
  countryCode: string
  variable: string
}

export interface ParamComboEntity {
  age: string
  pop: string
}

export interface ParamAvailabilityEntity {
  combos: ParamComboEntity[]
  ages: string[]
  pops: string[]
}

/** @deprecated Use ParamComboEntity */
export type WidParamComboEntity = ParamComboEntity

/** @deprecated Use ParamAvailabilityEntity */
export type WidParamAvailabilityEntity = ParamAvailabilityEntity

export interface SourceIndicator {
  id: string
  label: string
  unit?: string
  group?: string
  groupLabel?: string
  kind?: 'average' | 'threshold' | 'groupLevel' | 'share' | 'gini' | 'scalar' | 'other'
  concept?: string
}

export interface FetchVariableTimeSeriesParams {
  countryCode: string
  /** Six-letter variable, e.g. `ahweal`. */
  variable: string
  age: string
  pop: string
  /** WID percentile bracket, e.g. `p50p51`. Defaults to median bracket. */
  percentile?: string
  yearFrom?: number
  yearTo?: number
}
