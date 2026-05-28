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
