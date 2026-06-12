import { describe, expect, it } from 'vitest'
import { joinProfilesByPercentile } from '@src/domain/joinProfiles'
import type { PercentileProfile } from '@src/domain/types'

function makeProfile(
  points: Array<{ percentile: string, rank: number, value: number | null }>,
): PercentileProfile {
  return {
    id: 'test',
    country: 'FR',
    variable: 'ahweal',
    year: 2021,
    age: '992',
    pop: 'j',
    kind: 'average',
    label: 'Test',
    points,
    sample: false,
  }
}

describe('joinProfilesByPercentile', () => {
  it('joins two profiles on shared percentiles with non-null values', () => {
    const x = makeProfile([
      { percentile: 'p50p51', rank: 50, value: 100 },
      { percentile: 'p90p100', rank: 90, value: 200 },
    ])
    const y = makeProfile([
      { percentile: 'p50p51', rank: 50, value: 10 },
      { percentile: 'p90p100', rank: 90, value: 20 },
    ])

    const points = joinProfilesByPercentile(x, y)
    expect(points).toHaveLength(2)
    expect(points[0]).toEqual({
      percentile: 'p50p51',
      rank: 50,
      x: 100,
      y: 10,
    })
  })

  it('skips percentiles missing on either side or with null values', () => {
    const x = makeProfile([
      { percentile: 'p50p51', rank: 50, value: 100 },
      { percentile: 'p90p100', rank: 90, value: null },
    ])
    const y = makeProfile([
      { percentile: 'p50p51', rank: 50, value: 10 },
      { percentile: 'p98p99', rank: 98, value: 99 },
    ])

    expect(joinProfilesByPercentile(x, y)).toHaveLength(1)
  })
})
