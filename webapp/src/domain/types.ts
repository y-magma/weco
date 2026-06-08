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

export interface IndicatorMeta {
  id: string
  label: string
  description?: string
  unit?: string
  sourceId: string
}

export interface DistributionPoint {
  percentile: string
  value: number
}

export interface DistributionSeries {
  id: string
  label: string
  year: number
  points: DistributionPoint[]
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
  /** 'average' (a…) or 'threshold' (t…). */
  kind: 'average' | 'threshold' | 'other'
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

export interface ScatterPoint {
  x: number
  y: number
  label?: string
  year?: number
}

export interface CountryOption {
  code: string
  label: string
}

export interface FetchSeriesParams {
  countryCode: string
  indicatorId: string
  yearFrom?: number
  yearTo?: number
}

export interface FetchDistributionParams {
  countryCode: string
  indicatorId: string
  year?: number
}

export interface SearchIndicatorsParams {
  query?: string
  countryCode?: string
}
