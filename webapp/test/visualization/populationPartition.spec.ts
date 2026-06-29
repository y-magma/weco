import { describe, expect, it } from 'vitest'
import {
  buildPartitionPoints,
  buildStepBreakpoints,
  describeCustomIntervals,
  extractAvailableBoundaries,
  isBoundaryAvailable,
  selectableCustomBoundaries,
  TRAPEZOID_POPULATION_VIEW_OPTIONS,
  validateCustomBreakpoints,
  validateNextCustomBreakpoint,
  validatePartialCustomBreakpoints,
} from '~/visualization/populationPartition'
import { buildGPercentiles } from '@domain/services/percentiles'
import type { PercentilePoint } from '@domain/entities'

function fullPoints(): PercentilePoint[] {
  return buildGPercentiles().map((percentile) => {
    const rank = Number.parseFloat(percentile.replace(/^p/, '').split('p')[0]!)
    return { percentile, rank, value: rank }
  })
}

describe('TRAPEZOID_POPULATION_VIEW_OPTIONS', () => {
  it('includes all, step1 and step10 for the curve selector', () => {
    const values = TRAPEZOID_POPULATION_VIEW_OPTIONS.map((option) => option.value)
    expect(values).toEqual(['all', 'step1', 'step10'])
  })
})

describe('buildStepBreakpoints', () => {
  it('builds 1 %, 10 % and 25 % grids ending at 100', () => {
    expect(buildStepBreakpoints(1)).toHaveLength(100)
    expect(buildStepBreakpoints(1)![99]).toBe(100)
    expect(buildStepBreakpoints(10)).toEqual([10, 20, 30, 40, 50, 60, 70, 80, 90, 100])
    expect(buildStepBreakpoints(25)).toEqual([25, 50, 75, 100])
  })
})

describe('buildPartitionPoints', () => {
  it('aggregates with a 25 % step', () => {
    const points = buildPartitionPoints(fullPoints(), buildStepBreakpoints(25))
    expect(points).toHaveLength(4)
    expect(points[0]!.percentile).toBe('p0p25')
    expect(points[3]!.percentile).toBe('p75p100')
    expect(points[0]!.value).toBe(12)
  })

  it('aggregates with custom breakpoints', () => {
    const points = buildPartitionPoints(fullPoints(), [50, 90, 100])
    expect(points).toHaveLength(3)
    expect(points[0]!.percentile).toBe('p0p50')
    expect(points[1]!.percentile).toBe('p50p90')
    expect(points[2]!.percentile).toBe('p90p100')
  })
})

describe('extractAvailableBoundaries', () => {
  it('collects lower and upper bounds from loaded points', () => {
    const boundaries = extractAvailableBoundaries(fullPoints())
    expect(boundaries[0]).toBe(0)
    expect(boundaries).toContain(50)
    expect(boundaries).toContain(99.9)
    expect(boundaries[boundaries.length - 1]).toBe(100)
  })

  it('reflects partial data', () => {
    const partial = fullPoints().filter((p) => p.rank < 30)
    const boundaries = extractAvailableBoundaries(partial)
    expect(boundaries).toContain(0)
    expect(boundaries).toContain(29)
    expect(boundaries).not.toContain(50)
  })
})

describe('custom breakpoint validation', () => {
  const available = extractAvailableBoundaries(fullPoints())

  it('rejects unavailable boundaries', () => {
    expect(validateNextCustomBreakpoint(50.5, [], available).valid).toBe(false)
    expect(validateCustomBreakpoints([50, 90, 100], available).valid).toBe(true)
  })

  it('requires strictly increasing values ending at 100', () => {
    expect(validateCustomBreakpoints([50, 40, 100], available).valid).toBe(false)
    expect(validateCustomBreakpoints([50, 90], available).valid).toBe(false)
    expect(validateCustomBreakpoints([50, 90, 100], available).valid).toBe(true)
  })

  it('accepts partial breakpoints without requiring 100', () => {
    expect(validatePartialCustomBreakpoints([], available).valid).toBe(false)
    expect(validatePartialCustomBreakpoints([50], available).valid).toBe(true)
    expect(validatePartialCustomBreakpoints([50, 90], available).valid).toBe(true)
    expect(validatePartialCustomBreakpoints([50, 40], available).valid).toBe(false)
  })

  it('lists selectable boundaries after the last entry', () => {
    expect(selectableCustomBoundaries([], available)).toContain(50)
    expect(selectableCustomBoundaries([50], available)).toContain(90)
    expect(selectableCustomBoundaries([50], available)).not.toContain(25)
    expect(selectableCustomBoundaries([50, 90, 100], available)).toEqual([])
  })

  it('describes built intervals', () => {
    expect(describeCustomIntervals([50, 90, 100])).toEqual([
      ']0 %, 50 %]',
      ']50 %, 90 %]',
      ']90 %, 100 %]',
    ])
  })

  it('checks boundary availability with rounding', () => {
    expect(isBoundaryAvailable(99.9, available)).toBe(true)
    expect(isBoundaryAvailable(50.5, available)).toBe(false)
  })
})
