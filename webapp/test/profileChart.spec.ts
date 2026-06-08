import { describe, expect, it } from 'vitest'
import { buildProfileOption, tailCoordinate } from '@src/charts/profile'
import type { PercentileProfile } from '@src/domain/types'

function makeProfile(overrides: Partial<PercentileProfile> = {}): PercentileProfile {
  return {
    id: 'FR-ahweal-992-j-2021',
    country: 'FR',
    variable: 'ahweal',
    year: 2021,
    age: '992',
    pop: 'j',
    kind: 'average',
    unit: 'EUR',
    label: 'FR · Patrimoine (2021)',
    sample: true,
    points: [
      { percentile: 'p50p51', rank: 50, value: 50000 },
      { percentile: 'p0p1', rank: 0, value: -1000 },
      { percentile: 'p90p91', rank: 90, value: 200000 },
      { percentile: 'p20p21', rank: 20, value: null },
    ],
    ...overrides,
  }
}

function xData(option: ReturnType<typeof buildProfileOption>): string[] {
  return (option.xAxis as { data: string[] }).data
}

function seriesData(option: ReturnType<typeof buildProfileOption>): (number | null)[] {
  const series = (option.series as { data: (number | null)[] }[])[0]!
  return series.data
}

describe('buildProfileOption', () => {
  it('orders categories by rank regardless of input order', () => {
    const option = buildProfileOption(makeProfile())
    expect(xData(option)).toEqual(['p0p1', 'p20p21', 'p50p51', 'p90p91'])
  })

  it('keeps explicit gaps (null) as null', () => {
    const option = buildProfileOption(makeProfile())
    const gapIndex = xData(option).indexOf('p20p21')
    expect(seriesData(option)[gapIndex]).toBeNull()
  })

  it('uses a value (linear) axis by default', () => {
    const option = buildProfileOption(makeProfile())
    expect((option.yAxis as { type: string }).type).toBe('value')
  })

  it('uses a log axis when logScaleY is set', () => {
    const option = buildProfileOption(makeProfile(), { logScaleY: true })
    expect((option.yAxis as { type: string }).type).toBe('log')
  })

  it('drops non-positive values on a log axis (guard)', () => {
    const option = buildProfileOption(makeProfile(), { logScaleY: true })
    const bottomIndex = xData(option).indexOf('p0p1')
    // -1000 cannot be plotted on a log axis -> turned into a gap
    expect(seriesData(option)[bottomIndex]).toBeNull()
  })

  it('honours the chart type', () => {
    const bar = buildProfileOption(makeProfile(), { chartType: 'bar' })
    const scatter = buildProfileOption(makeProfile(), { chartType: 'scatter' })
    expect((bar.series as { type: string }[])[0]!.type).toBe('bar')
    expect((scatter.series as { type: string }[])[0]!.type).toBe('scatter')
  })

  it('labels the value axis with the unit', () => {
    const option = buildProfileOption(makeProfile())
    expect((option.yAxis as { name: string }).name).toContain('EUR')
  })
})

describe('tailCoordinate', () => {
  it('maps rank to log10(1/(1-p))', () => {
    expect(tailCoordinate(0)).toBeCloseTo(0)
    expect(tailCoordinate(90)).toBeCloseTo(1)
    expect(tailCoordinate(99)).toBeCloseTo(2)
    expect(tailCoordinate(99.9)).toBeCloseTo(3)
  })

  it('returns null when p >= 1 (no finite coordinate)', () => {
    expect(tailCoordinate(100)).toBeNull()
    expect(tailCoordinate(120)).toBeNull()
  })

  it('is strictly increasing with rank', () => {
    expect(tailCoordinate(99)! > tailCoordinate(90)!).toBe(true)
    expect(tailCoordinate(99.9)! > tailCoordinate(99)!).toBe(true)
  })
})

describe('buildProfileOption — high-tail X scale', () => {
  function tailPairs(option: ReturnType<typeof buildProfileOption>) {
    return (option.series as { data: [number, number | null][] }[])[0]!.data
  }

  it('switches the X axis to a numeric value axis', () => {
    const option = buildProfileOption(makeProfile(), { xScale: 'tail' })
    expect((option.xAxis as { type: string }).type).toBe('value')
    expect((option.xAxis as { name: string }).name).toContain('1/(1−p)')
  })

  it('emits [x, y] pairs ordered by rank with x = tailCoordinate', () => {
    const option = buildProfileOption(makeProfile(), { xScale: 'tail' })
    const pairs = tailPairs(option)
    // ranks present: 0, 20, 50, 90 -> 4 pairs
    expect(pairs).toHaveLength(4)
    expect(pairs[0]![0]).toBeCloseTo(tailCoordinate(0)!)
    expect(pairs.at(-1)![0]).toBeCloseTo(tailCoordinate(90)!)
    // x strictly increasing
    for (let i = 1; i < pairs.length; i++) {
      expect(pairs[i]![0]).toBeGreaterThan(pairs[i - 1]![0])
    }
  })

  it('still applies the ≤0 guard on a log Y in tail mode', () => {
    const option = buildProfileOption(makeProfile(), { xScale: 'tail', logScaleY: true })
    const pairs = tailPairs(option)
    const bottom = pairs.find((pair) => pair[0] === tailCoordinate(0))!
    expect(bottom[1]).toBeNull()
  })
})
