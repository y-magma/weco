import { describe, expect, it } from 'vitest'
import {
  buildGPercentiles,
  parsePercentileInterval,
  parsePercentileRank,
  parsePercentileUpper,
  sortPercentileCodes,
} from '@src/data-sources/wid/percentiles'

describe('parsePercentileRank', () => {
  it('parses the lower bound of a range code', () => {
    expect(parsePercentileRank('p90p91')).toBe(90)
    expect(parsePercentileRank('p0p1')).toBe(0)
    expect(parsePercentileRank('p98p99')).toBe(98)
  })

  it('parses decimal lower bounds in the top tail', () => {
    expect(parsePercentileRank('p99.9p99.91')).toBeCloseTo(99.9)
    expect(parsePercentileRank('p99.99p99.991')).toBeCloseTo(99.99)
    expect(parsePercentileRank('p99.999p100')).toBeCloseTo(99.999)
  })

  it('parses single-bound codes', () => {
    expect(parsePercentileRank('p50')).toBe(50)
  })

  it('returns NaN for invalid codes', () => {
    expect(Number.isNaN(parsePercentileRank(''))).toBe(true)
    expect(Number.isNaN(parsePercentileRank('abc'))).toBe(true)
  })
})

describe('parsePercentileUpper', () => {
  it('parses the upper bound of a range code', () => {
    expect(parsePercentileUpper('p90p91')).toBe(91)
    expect(parsePercentileUpper('p99.9p99.91')).toBeCloseTo(99.91)
    expect(parsePercentileUpper('p99.999p100')).toBe(100)
  })

  it('falls back to the lower bound for single-bound codes', () => {
    expect(parsePercentileUpper('p50')).toBe(50)
  })
})

describe('parsePercentileInterval', () => {
  it('returns ]i, k] bounds for a bracket code', () => {
    expect(parsePercentileInterval('p50p51')).toEqual({ i: 50, k: 51 })
    expect(parsePercentileInterval('p0p1')).toEqual({ i: 0, k: 1 })
    expect(parsePercentileInterval('p99.9p99.91')).toEqual({ i: 99.9, k: 99.91 })
  })

  it('returns null for invalid codes', () => {
    expect(parsePercentileInterval('')).toBeNull()
    expect(parsePercentileInterval('abc')).toBeNull()
  })
})

describe('sortPercentileCodes', () => {
  it('orders by numeric rank, not alphabetically', () => {
    const input = ['p100', 'p99.9p99.91', 'p9p10', 'p10p11', 'p99p99.1']
    expect(sortPercentileCodes(input)).toEqual([
      'p9p10',
      'p10p11',
      'p99p99.1',
      'p99.9p99.91',
      'p100',
    ])
  })

  it('does not mutate the input array', () => {
    const input = ['p10p11', 'p0p1']
    const copy = [...input]
    sortPercentileCodes(input)
    expect(input).toEqual(copy)
  })
})

describe('buildGPercentiles', () => {
  const codes = buildGPercentiles()

  it('produces exactly 127 g-percentiles', () => {
    expect(codes).toHaveLength(127)
  })

  it('starts at p0p1 and ends at p…p100', () => {
    expect(codes[0]).toBe('p0p1')
    expect(codes[codes.length - 1]).toBe('p99.999p100')
  })

  it('is strictly increasing by rank', () => {
    const ranks = codes.map(parsePercentileRank)
    for (let i = 1; i < ranks.length; i++) {
      expect(ranks[i]).toBeGreaterThan(ranks[i - 1]!)
    }
  })

  it('contains the expected zoom boundaries', () => {
    expect(codes).toContain('p98p99')
    expect(codes).toContain('p99p99.1')
    expect(codes).toContain('p99.9p99.91')
    expect(codes).toContain('p99.99p99.991')
  })

  it('has no duplicate codes', () => {
    expect(new Set(codes).size).toBe(codes.length)
  })
})
