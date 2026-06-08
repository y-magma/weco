import { describe, expect, it } from 'vitest'
import { buildProfileOption, computePdfBins, formatRankAxisLabel, rankDisplayCoordinate, rankFromDisplayCoordinate, rankFromTopLogCoordinate, rankTopLogCoordinate } from '@src/charts/profile'
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

type SeriesDatum = { value: [number, number | null] }

function seriesData(option: ReturnType<typeof buildProfileOption>): SeriesDatum[] {
  const series = (option.series as { data: SeriesDatum[] }[])[0]!
  return series.data
}

function seriesPairs(option: ReturnType<typeof buildProfileOption>): [number, number | null][] {
  return seriesData(option).map((datum) => datum.value)
}

describe('buildProfileOption', () => {
  it('orders points by rank on a linear X axis', () => {
    const option = buildProfileOption(makeProfile())
    expect((option.xAxis as { type: string }).type).toBe('value')
    expect(seriesPairs(option).map((pair) => pair[0])).toEqual([0, 20, 50, 90])
  })

  it('keeps explicit gaps (null) as null', () => {
    const option = buildProfileOption(makeProfile())
    const gap = seriesPairs(option).find((pair) => pair[0] === 20)!
    expect(gap[1]).toBeNull()
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
    const bottom = seriesPairs(option).find((pair) => pair[0] === 0)!
    expect(bottom[1]).toBeNull()
  })

  it('honours the chart type', () => {
    const bar = buildProfileOption(makeProfile(), { chartType: 'bar' })
    const scatter = buildProfileOption(makeProfile(), { chartType: 'scatter' })
    expect((bar.series as { type: string }[])[0]!.type).toBe('bar')
    expect((scatter.series as { type: string }[])[0]!.type).toBe('scatter')
  })

  it('draws a step line by default', () => {
    const option = buildProfileOption(makeProfile())
    expect((option.series as { type: string, step?: string }[])[0]!.type).toBe('line')
    expect((option.series as { step?: string }[])[0]!.step).toBe('end')
  })

  it('labels the value axis with the unit', () => {
    const option = buildProfileOption(makeProfile())
    expect((option.yAxis as { name: string }).name).toContain('EUR')
  })

  it('anchors the rank axis between 0 and 100 %', () => {
    const option = buildProfileOption(makeProfile())
    expect((option.xAxis as { name: string }).name).toBe('Part de population (%)')
    expect((option.xAxis as { min: number, max: number }).min).toBe(0)
    expect((option.xAxis as { max: number }).max).toBe(100)
  })
})

describe('rankTopLogCoordinate', () => {
  it('maps rank to log10(100 - rank)', () => {
    expect(rankTopLogCoordinate(0)).toBeCloseTo(2)
    expect(rankTopLogCoordinate(90)).toBeCloseTo(1)
    expect(rankTopLogCoordinate(99)).toBeCloseTo(0)
    expect(rankTopLogCoordinate(99.9)).toBeCloseTo(-1)
  })

  it('returns null when rank >= 100 (no finite coordinate)', () => {
    expect(rankTopLogCoordinate(100)).toBeNull()
    expect(rankTopLogCoordinate(120)).toBeNull()
  })

  it('decreases as rank increases toward 100 %', () => {
    expect(rankTopLogCoordinate(90)! > rankTopLogCoordinate(99)!).toBe(true)
    expect(rankTopLogCoordinate(99)! > rankTopLogCoordinate(99.9)!).toBe(true)
  })
})

describe('rankFromTopLogCoordinate', () => {
  it('inverts rankTopLogCoordinate', () => {
    expect(rankFromTopLogCoordinate(rankTopLogCoordinate(0)!)).toBeCloseTo(0)
    expect(rankFromTopLogCoordinate(rankTopLogCoordinate(90)!)).toBeCloseTo(90)
    expect(rankFromTopLogCoordinate(rankTopLogCoordinate(99.9)!)).toBeCloseTo(99.9)
  })
})

describe('rankDisplayCoordinate', () => {
  it('negates log10(100 - rank) so rank increases left to right', () => {
    expect(rankDisplayCoordinate(0)).toBeCloseTo(-2)
    expect(rankDisplayCoordinate(90)).toBeCloseTo(-1)
    expect(rankDisplayCoordinate(99)).toBeCloseTo(0)
    expect(rankDisplayCoordinate(99.9)).toBeCloseTo(1)
  })

  it('increases with rank toward 100 %', () => {
    expect(rankDisplayCoordinate(90)! < rankDisplayCoordinate(99)!).toBe(true)
    expect(rankDisplayCoordinate(99)! < rankDisplayCoordinate(99.9)!).toBe(true)
  })
})

describe('rankFromDisplayCoordinate', () => {
  it('inverts rankDisplayCoordinate', () => {
    expect(rankFromDisplayCoordinate(rankDisplayCoordinate(0)!)).toBeCloseTo(0)
    expect(rankFromDisplayCoordinate(rankDisplayCoordinate(90)!)).toBeCloseTo(90)
    expect(rankFromDisplayCoordinate(rankDisplayCoordinate(99.9)!)).toBeCloseTo(99.9)
  })
})

describe('formatRankAxisLabel', () => {
  it('shows rank % from display-space tick values', () => {
    expect(formatRankAxisLabel(-2)).toBe('0 %')
    expect(formatRankAxisLabel(-1)).toBe('90 %')
    expect(formatRankAxisLabel(0)).toBe('99 %')
    expect(formatRankAxisLabel(1)).toBe('99,9 %')
  })

  it('hides ticks that fall outside 0–100 %', () => {
    expect(formatRankAxisLabel(-3)).toBe('')
  })
})

describe('buildProfileOption — log X scale', () => {
  it('keeps rank % as the X axis label while spacing in log space', () => {
    const option = buildProfileOption(makeProfile(), { logScaleX: true })
    expect((option.xAxis as { type: string }).type).toBe('value')
    expect((option.xAxis as { name: string }).name).toBe('Part de population (%)')
    expect((option.xAxis as { scale: boolean }).scale).toBe(true)
    expect((option.xAxis as { min: number }).min).toBeCloseTo(-2)
    expect((option.xAxis as { axisLabel: { formatter: (v: number) => string } }).axisLabel.formatter(-1)).toBe('90 %')
  })

  it('emits [x, y] pairs with x = rankDisplayCoordinate, increasing with rank', () => {
    const option = buildProfileOption(makeProfile(), { logScaleX: true })
    const pairs = seriesPairs(option)
    expect(pairs).toHaveLength(4)
    expect(pairs[0]![0]).toBeCloseTo(rankDisplayCoordinate(0)!)
    expect(pairs.at(-1)![0]).toBeCloseTo(rankDisplayCoordinate(90)!)
    for (let i = 1; i < pairs.length; i++) {
      expect(pairs[i]![0]).toBeGreaterThan(pairs[i - 1]![0])
    }
  })

  it('still applies the ≤0 guard on a log Y in log X mode', () => {
    const option = buildProfileOption(makeProfile(), { logScaleX: true, logScaleY: true })
    const pairs = seriesPairs(option)
    const bottom = pairs.find((pair) => pair[0] === rankDisplayCoordinate(0))!
    expect(bottom[1]).toBeNull()
  })

  it('drops points at rank 100 when log X is enabled', () => {
    const option = buildProfileOption(makeProfile({
      points: [
        { percentile: 'p99.999p100', rank: 99.999, value: 1_000_000 },
        { percentile: 'p100', rank: 100, value: 2_000_000 },
      ],
    }), { logScaleX: true })
    expect(seriesPairs(option)).toHaveLength(1)
    expect(seriesPairs(option)[0]![0]).toBeCloseTo(rankDisplayCoordinate(99.999)!)
  })
})

describe('buildProfileOption — population density view', () => {
  it('swaps axes: X = value, Y = population share', () => {
    const option = buildProfileOption(makeProfile(), { populationDensity: true })
    expect((option.xAxis as { name: string }).name).toContain('EUR')
    expect((option.yAxis as { name: string }).name).toBe('Part de population (%)')
    const pairs = seriesPairs(option)
    // rank 0 excluded (negative value kept? -1000 is valid x)
    expect(pairs.find((pair) => pair[1] === 0)).toEqual([-1000, 0])
    expect(pairs.find((pair) => pair[1] === 90)).toEqual([200000, 90])
    // null value at rank 20 is dropped entirely
    expect(pairs.some((pair) => pair[1] === 20)).toBe(false)
  })

  it('routes logScaleX to the value axis and logScaleY to the rank axis', () => {
    const option = buildProfileOption(makeProfile(), {
      populationDensity: true,
      logScaleX: true,
      logScaleY: true,
    })
    expect((option.xAxis as { type: string }).type).toBe('log')
    expect((option.yAxis as { scale: boolean }).scale).toBe(true)
    const pairs = seriesPairs(option)
    // rank 0 dropped: value -1000 fails log guard on X
    expect(pairs.some((pair) => pair[1] === 0)).toBe(false)
    expect(pairs.find((pair) => pair[1] === 90)![0]).toBe(200000)
    expect(pairs.find((pair) => pair[1] === 90)![1]).toBeCloseTo(rankDisplayCoordinate(90)!)
  })
})

describe('computePdfBins', () => {
  it('computes ΔF/Δx between consecutive percentile brackets', () => {
    const bins = computePdfBins(makeProfile().points)
    expect(bins).toHaveLength(2)
    expect(bins[0]).toMatchObject({
      valueLo: -1000,
      valueHi: 50000,
      rankLo: 0,
      rankHi: 50,
      density: (50 / 100) / (50000 - -1000),
    })
    expect(bins[1]!.density).toBeCloseTo((40 / 100) / (200000 - 50000))
  })

  it('skips non-increasing wealth intervals', () => {
    const bins = computePdfBins([
      { percentile: 'p0p1', rank: 0, value: 100 },
      { percentile: 'p50p51', rank: 50, value: 50 },
    ])
    expect(bins).toHaveLength(0)
  })
})

describe('buildProfileOption — probability density view', () => {
  it('plots the empirical PDF on wealth vs density axes', () => {
    const option = buildProfileOption(makeProfile(), {
      populationDensity: true,
      probabilityDensity: true,
    })
    expect((option.xAxis as { name: string }).name).toContain('EUR')
    expect((option.yAxis as { name: string }).name).toContain('Densité de probabilité')
    const pairs = seriesPairs(option)
    expect(pairs.length).toBeGreaterThan(0)
    expect(pairs[0]![1]).toBeGreaterThan(0)
  })

  it('routes logScaleY to the density axis', () => {
    const option = buildProfileOption(makeProfile(), {
      populationDensity: true,
      probabilityDensity: true,
      logScaleY: true,
    })
    expect((option.yAxis as { type: string }).type).toBe('log')
  })
})
