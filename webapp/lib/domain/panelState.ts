/** Layer used for the original profile chart (line, scatter, bar). */
export type ProfileChartLayer = 'bar' | 'scatter' | 'line'

/** Population partition mode for exploration / trapezoid views. */
export type PopulationViewMode = 'all' | 'step1' | 'step10' | 'step25' | 'distribution' | 'custom'

/** Population partition mode for time-series stacked tranches. */
export type TimeSeriesPopulationMode = 'distribution' | 'whole' | 'step10' | 'step25' | 'custom'

/** Mean-preserving trapezoid approximation method. */
export type TrapezoidMethod = 'anchor' | 'zero' | 'leastSquares' | 'minOscillation'
