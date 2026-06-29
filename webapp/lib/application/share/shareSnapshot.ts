import type { ProfileChartLayer } from '~/visualization/profile'
import type { PopulationViewMode } from '~/visualization/populationPartition'
import type { TimeSeriesPopulationMode } from '~/visualization/timeSeriesPartition'
import type { TrapezoidMethod } from '~/visualization/trapezoidApproximation'

export type SharePageId = 'exploration' | 'temps' | 'grille'
export type ShareSourceMode = 'shared' | 'per-panel'
export type SharePanelType = 'exploration' | 'temps' | 'temps-compare'

export interface ExplorationPanelSnapshot {
  countryCode?: string
  variable?: string
  year?: number
  age?: string
  pop?: string
  method?: TrapezoidMethod
  populationViewMode?: PopulationViewMode
  approxPartitionMode?: PopulationViewMode
  customBreakpoints?: number[]
  drillLevel?: number
  showHistogram?: boolean
  showTrapezoids?: boolean
  logRichZoom?: boolean
  logScaleX?: boolean
  logScaleY?: boolean
  originalViewMode?: ProfileChartLayer
  lorenzCurve?: boolean
  empiricalCdf?: boolean
  empiricalPdf?: boolean
  showEmpiricalDistribution?: boolean
  showSmoothDistribution?: boolean
  hiddenApproxIntervals?: number[]
}

export interface TimeSeriesPanelSnapshot {
  countryCode?: string
  variable?: string
  age?: string
  pop?: string
  partitionMode?: TimeSeriesPopulationMode
  customBreakpoints?: number[]
}

export interface TimeSeriesComparePanelSnapshot {
  countryCodes?: string[]
  variable?: string
  percentile?: string
  customLo?: number
  customHi?: number
  decileSubSelection?: string
  age?: string
  pop?: string
}

export type PanelStateSnapshot =
  | ExplorationPanelSnapshot
  | TimeSeriesPanelSnapshot
  | TimeSeriesComparePanelSnapshot

export interface GridPanelSnapshot {
  type: SharePanelType
  sourceId?: string
  state: PanelStateSnapshot
}

export interface ShareSnapshotV1 {
  v: 1
  page: SharePageId
  sourceId: string
  sourceMode?: ShareSourceMode
  panels?: GridPanelSnapshot[]
  exploration?: ExplorationPanelSnapshot
  timeSeries?: TimeSeriesPanelSnapshot
  compare?: TimeSeriesComparePanelSnapshot
}

export const SHARE_QUERY_VERSION = '1'
export const SHARE_QUERY_STATE_KEY = 's'
export const SHARE_MAX_ENCODED_LENGTH = 1800
