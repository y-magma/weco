import { describe, expect, it } from 'vitest'
import {
  breakpointsForTimeSeriesPopulationMode,
  buildTimeSeriesTranches,
  breakpointsForMode,
  stackValueFromAverage,
  TIME_SERIES_DEFAULT_BREAKPOINTS,
  TIME_SERIES_DISTRIBUTION_BREAKPOINTS,
} from '~/visualization/timeSeriesPartition'

describe('timeSeriesPartition', () => {
  it('uses the wealth distribution breakpoints by default', () => {
    expect(breakpointsForMode('wealth', [])).toEqual([...TIME_SERIES_DEFAULT_BREAKPOINTS])
  })

  it('builds the default distribution preset (infographie)', () => {
    expect(breakpointsForTimeSeriesPopulationMode('distribution')).toEqual([...TIME_SERIES_DEFAULT_BREAKPOINTS])
    const tranches = buildTimeSeriesTranches([...TIME_SERIES_DISTRIBUTION_BREAKPOINTS], 'wealth')
    expect(tranches).toHaveLength(5)
    expect(tranches.map((item) => item.code)).toEqual([
      'p0p50',
      'p50p90',
      'p90p99',
      'p99p99.9',
      'p99.9p100',
    ])
  })

  it('builds a single whole-population tranche (0–100)', () => {
    const tranches = buildTimeSeriesTranches(breakpointsForTimeSeriesPopulationMode('whole'), 'custom')
    expect(tranches).toHaveLength(1)
    expect(tranches[0]?.code).toBe('p0p100')
  })

  it('builds five tranches for the default wealth preset', () => {
    const tranches = buildTimeSeriesTranches([...TIME_SERIES_DEFAULT_BREAKPOINTS], 'wealth')
    expect(tranches).toHaveLength(5)
    expect(tranches.map((item) => item.code)).toEqual([
      'p0p50',
      'p50p90',
      'p90p99',
      'p99p99.9',
      'p99.9p100',
    ])
    expect(tranches.map((item) => item.label)).toEqual([
      'Bas 50 %',
      '50–90 %',
      '90–99 %',
      'Top 1 %',
      'Top 0,1 %',
    ])
  })

  it('computes relative stack values from averages', () => {
    expect(stackValueFromAverage(200_000, 50)).toBe(100_000)
    expect(stackValueFromAverage(null, 50)).toBeNull()
  })
})
