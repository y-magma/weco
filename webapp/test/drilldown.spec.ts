import { describe, expect, it } from 'vitest'
import {
  aggregatePointValue,
  buildDrilldownPoints,
  drillableCode,
  drillLevelLabel,
  MAX_DRILL_LEVEL,
  nextDrillLevel,
} from '@src/charts/drilldown'
import { buildGPercentiles } from '@src/data-sources/wid/percentiles'
import type { PercentilePoint } from '@src/domain/types'

/** Full 127 g-percentile profile with value = lower bound (so aggregates are predictable). */
function fullPoints(): PercentilePoint[] {
  return buildGPercentiles().map((percentile) => {
    const rank = Number.parseFloat(percentile.replace(/^p/, '').split('p')[0]!)
    return { percentile, rank, value: rank }
  })
}

describe('aggregatePointValue', () => {
  it('width-weights the underlying values', () => {
    const value = aggregatePointValue([
      { percentile: 'p0p1', rank: 0, value: 10 },
      { percentile: 'p1p2', rank: 1, value: 20 },
    ])
    expect(value).toBe(15)
  })

  it('ignores null values and returns null when empty', () => {
    expect(aggregatePointValue([{ percentile: 'p0p1', rank: 0, value: null }])).toBeNull()
    expect(aggregatePointValue([])).toBeNull()
  })
})

describe('buildDrilldownPoints', () => {
  it('level 0 shows 100 brackets ending with the p99p100 aggregate', () => {
    const points = buildDrilldownPoints(fullPoints(), 0)
    expect(points).toHaveLength(100)
    expect(points[0]!.percentile).toBe('p0p1')
    expect(points[98]!.percentile).toBe('p98p99')
    expect(points[99]!.percentile).toBe('p99p100')
    expect(points[5]!.value).toBe(5)
  })

  it('level 1 re-splits ]99 %, 100 %] into tenths ending at p99.9p100', () => {
    const points = buildDrilldownPoints(fullPoints(), 1)
    expect(points).toHaveLength(10)
    expect(points[0]!.percentile).toBe('p99p99.1')
    expect(points[9]!.percentile).toBe('p99.9p100')
  })

  it('level 2 re-splits ]99,9 %, 100 %] ending at p99.99p100', () => {
    const points = buildDrilldownPoints(fullPoints(), 2)
    expect(points).toHaveLength(10)
    expect(points[0]!.percentile).toBe('p99.9p99.91')
    expect(points[9]!.percentile).toBe('p99.99p100')
  })

  it('level 3 shows the finest tail ending at p99.999p100', () => {
    const points = buildDrilldownPoints(fullPoints(), 3)
    expect(points).toHaveLength(10)
    expect(points[0]!.percentile).toBe('p99.99p99.991')
    expect(points[9]!.percentile).toBe('p99.999p100')
  })
})

describe('drillableCode / nextDrillLevel', () => {
  it('exposes the top bracket as drillable except at the deepest level', () => {
    expect(drillableCode(0)).toBe('p99p100')
    expect(drillableCode(1)).toBe('p99.9p100')
    expect(drillableCode(2)).toBe('p99.99p100')
    expect(drillableCode(MAX_DRILL_LEVEL)).toBeNull()
  })

  it('advances one level only when the drillable code is clicked', () => {
    expect(nextDrillLevel(0, 'p99p100')).toBe(1)
    expect(nextDrillLevel(0, 'p50p51')).toBeNull()
    expect(nextDrillLevel(1, 'p99.9p100')).toBe(2)
    expect(nextDrillLevel(MAX_DRILL_LEVEL, 'p99.999p100')).toBeNull()
  })
})

describe('drillLevelLabel', () => {
  it('uses the WID bounds convention', () => {
    expect(drillLevelLabel(0)).toContain(']0 %, 100 %]')
    expect(drillLevelLabel(1)).toBe(']99 %, 100 %]')
    expect(drillLevelLabel(2)).toBe(']99,9 %, 100 %]')
    expect(drillLevelLabel(3)).toBe(']99,99 %, 100 %]')
  })
})
