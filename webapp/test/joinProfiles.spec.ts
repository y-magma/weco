import { describe, expect, it } from 'vitest'
import { joinProfilesByPercentile } from '@src/domain/joinProfiles'
import type { PercentileProfile } from '@src/domain/types'

function profile(
  variable: string,
  values: { percentile: string, rank: number, value: number | null }[],
): PercentileProfile {
  return {
    id: `FR-${variable}`,
    country: 'FR',
    variable,
    year: 2021,
    age: '992',
    pop: 'j',
    kind: 'average',
    label: variable,
    sample: true,
    points: values,
  }
}

describe('joinProfilesByPercentile', () => {
  it('produces one point per shared percentile (x = var1, y = var2)', () => {
    const x = profile('thweal', [
      { percentile: 'p10p11', rank: 10, value: 100 },
      { percentile: 'p50p51', rank: 50, value: 500 },
      { percentile: 'p90p91', rank: 90, value: 900 },
    ])
    const y = profile('ahweal', [
      { percentile: 'p10p11', rank: 10, value: 111 },
      { percentile: 'p50p51', rank: 50, value: 555 },
      { percentile: 'p90p91', rank: 90, value: 999 },
    ])
    const joined = joinProfilesByPercentile(x, y)
    expect(joined).toHaveLength(3)
    expect(joined[0]).toEqual({ percentile: 'p10p11', rank: 10, x: 100, y: 111 })
    expect(joined[2]).toEqual({ percentile: 'p90p91', rank: 90, x: 900, y: 999 })
  })

  it('keeps only percentiles present in both profiles', () => {
    const x = profile('thweal', [
      { percentile: 'p10p11', rank: 10, value: 100 },
      { percentile: 'p20p21', rank: 20, value: 200 },
    ])
    const y = profile('ahweal', [
      { percentile: 'p10p11', rank: 10, value: 111 },
      { percentile: 'p90p91', rank: 90, value: 999 },
    ])
    const joined = joinProfilesByPercentile(x, y)
    expect(joined.map((p) => p.percentile)).toEqual(['p10p11'])
  })

  it('drops percentiles with a null value on either side', () => {
    const x = profile('thweal', [
      { percentile: 'p10p11', rank: 10, value: null },
      { percentile: 'p50p51', rank: 50, value: 500 },
    ])
    const y = profile('ahweal', [
      { percentile: 'p10p11', rank: 10, value: 111 },
      { percentile: 'p50p51', rank: 50, value: null },
    ])
    expect(joinProfilesByPercentile(x, y)).toEqual([])
  })

  it('orders the result by rank', () => {
    const x = profile('thweal', [
      { percentile: 'p90p91', rank: 90, value: 900 },
      { percentile: 'p10p11', rank: 10, value: 100 },
    ])
    const y = profile('ahweal', [
      { percentile: 'p10p11', rank: 10, value: 111 },
      { percentile: 'p90p91', rank: 90, value: 999 },
    ])
    const joined = joinProfilesByPercentile(x, y)
    expect(joined.map((p) => p.rank)).toEqual([10, 90])
  })
})
