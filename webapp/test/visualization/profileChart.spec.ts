import { describe, expect, it } from 'vitest'
import {
  buildProfileDataZoom,
  buildProfileOption,
  buildRankBandItems,
  computeBandAxisBounds,
  computeProfileValueExtent,
  computeRankIntervalExtent,
  filterPointsByValueRange,
  computePdfBins,
  computeLorenzPoints,
  formatRankAxisLabel,
  rankDisplayCoordinate,
  rankDisplayCoordinateUpper,
  rankFromDisplayCoordinate,
  rankFromTopLogCoordinate,
  rankTopLogCoordinate,
} from '~/visualization/profile'
import type { PercentileProfile } from '@domain/entities'

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

describe('computeProfileValueExtent', () => {
  it('returns min and max over finite values', () => {
    const extent = computeProfileValueExtent(makeProfile().points)
    expect(extent).toEqual({ min: -1000, max: 200000 })
  })
})

describe('filterPointsByValueRange', () => {
  it('keeps points within [min, max]', () => {
    const filtered = filterPointsByValueRange(makeProfile().points, { min: 10000, max: 100000 })
    expect(filtered.map((p) => p.rank)).toEqual([50])
  })
})

describe('computeRankIntervalExtent', () => {
  it('spans ]i %, k %] over the given points', () => {
    const extent = computeRankIntervalExtent([
      { percentile: 'p50p51', rank: 50, value: 50000 },
      { percentile: 'p90p91', rank: 90, value: 200000 },
    ])
    expect(extent).toEqual({ rankLo: 50, rankHi: 91 })
  })
})

describe('buildProfileDataZoom', () => {
  it('uses a vertical slider for the value axis in the default view', () => {
    const zooms = buildProfileDataZoom(false)
    const valueSlider = zooms.find((z) => z.type === 'slider' && z.orient === 'vertical' && z.yAxisIndex === 0)
    expect(valueSlider).toBeDefined()
    expect(zooms.find((z) => z.type === 'slider' && z.xAxisIndex === 0)).toBeDefined()
  })

  it('uses a horizontal slider for the value axis in population-density view', () => {
    const zooms = buildProfileDataZoom(true)
    const valueSlider = zooms.find((z) => z.type === 'slider' && z.xAxisIndex === 0)
    expect(valueSlider).toBeDefined()
    expect(zooms.find((z) => z.type === 'slider' && z.orient === 'vertical' && z.yAxisIndex === 0)).toBeDefined()
  })
})

describe('buildProfileOption — value range zoom', () => {
  it('zooms Y (valeur) and X (population %) in the default profile view', () => {
    const option = buildProfileOption(makeProfile(), {
      valueRange: { min: 10000, max: 100000 },
    })
    expect((option.yAxis as { min: number, max: number }).min).toBe(10000)
    expect((option.yAxis as { max: number }).max).toBe(100000)
    expect((option.xAxis as { min: number }).min).toBeGreaterThanOrEqual(45)
    expect((option.xAxis as { max: number }).max).toBeLessThanOrEqual(55)
  })

  it('zooms X (richesse) and Y (population %) in population-density view', () => {
    const option = buildProfileOption(makeProfile(), {
      populationDensity: true,
      valueRange: { min: 10000, max: 100000 },
    })
    expect((option.xAxis as { min: number, max: number }).min).toBe(10000)
    expect((option.xAxis as { max: number }).max).toBe(100000)
    expect((option.yAxis as { min: number }).min).toBeGreaterThanOrEqual(45)
    expect((option.yAxis as { max: number }).max).toBeLessThanOrEqual(55)
  })

  it('filters series to points inside the value range', () => {
    const option = buildProfileOption(makeProfile(), {
      valueRange: { min: 10000, max: 100000 },
    })
    const series = (option.series as { data: { value: [number, number | null] }[] }[])[0]!
    expect(series.data).toHaveLength(1)
    expect(series.data[0]!.value[0]).toBe(50)
  })
})

describe('computeBandAxisBounds', () => {
  it('anchors bars at yBase = 0 on a linear value axis even with negative data', () => {
    const items = buildRankBandItems([
      { percentile: 'p0p1', rank: 0, value: -1000 },
      { percentile: 'p90p91', rank: 90, value: 200000 },
    ])
    const bounds = computeBandAxisBounds(items)
    expect(bounds.yBase).toBe(0)
    expect(bounds.yMin).toBeLessThan(0)
  })
})

describe('buildRankBandItems', () => {
  it('keeps the ]99.999 %, 100 %] band when log X is enabled', () => {
    const bands = buildRankBandItems(
      [{ percentile: 'p99.999p100', rank: 99.999, value: 1_000_000 }],
      { logOnRank: true },
    )
    expect(bands).toHaveLength(1)
    expect(bands[0]!.i).toBe(99.999)
    expect(bands[0]!.k).toBe(100)
    expect(bands[0]!.value[0]).toBeCloseTo(rankDisplayCoordinate(99.999)!)
    expect(bands[0]!.value[1]).toBeCloseTo(rankDisplayCoordinateUpper(100)!)
    expect(bands[0]!.value[1]).toBeGreaterThan(bands[0]!.value[0])
  })

  it('maps each pᵢpₖ bracket to a band on ]i %, k %]', () => {
    const bands = buildRankBandItems(makeProfile().points)
    expect(bands.map((b) => [b.i, b.k])).toEqual([
      [0, 1],
      [50, 51],
      [90, 91],
    ])
    expect(bands[0]!.value).toEqual([0, 1, -1000])
    expect(bands.find((b) => b.name === 'p20p21')).toBeUndefined()
  })
})

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

  it('formats the value axis with compact labels', () => {
    const option = buildProfileOption(makeProfile(), { logScaleY: true })
    const formatter = (option.yAxis as { axisLabel: { formatter: (v: number) => string } }).axisLabel.formatter
    expect(formatter(1_000_000)).toBe('1M')
    expect(formatter(10_000)).toBe('10k')
  })

  it('drops non-positive values on a log axis (guard)', () => {
    const option = buildProfileOption(makeProfile(), { logScaleY: true })
    const bottom = seriesPairs(option).find((pair) => pair[0] === 0)!
    expect(bottom[1]).toBeNull()
  })

  it('honours the chart type', () => {
    const bar = buildProfileOption(makeProfile(), { chartType: 'bar' })
    const scatter = buildProfileOption(makeProfile(), { chartType: 'scatter' })
    expect((bar.series as { type: string }[])[0]!.type).toBe('custom')
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

  it('draws ]i %, k %] bands as a custom series in bar mode', () => {
    const option = buildProfileOption(makeProfile(), { chartType: 'bar' })
    const series = (option.series as { type: string, data: unknown[] }[])[0]!
    expect(series.type).toBe('custom')
    expect(series.data).toHaveLength(3)
  })

  it('auto-scales the rank axis to the displayed brackets (line view)', () => {
    const option = buildProfileOption(makeProfile())
    expect((option.xAxis as { name: string }).name).toBe('Part de population (%)')
    // brackets span ]0,1] … ]90,91] → axis fits 0 → ~91 (padded), not the full 100
    expect((option.xAxis as { min: number }).min).toBe(0)
    expect((option.xAxis as { max: number }).max).toBeGreaterThan(91)
    expect((option.xAxis as { max: number }).max).toBeLessThanOrEqual(100)
  })

  it('rescales the rank axis to a drilled top-tail subset (line view)', () => {
    const topTail = makeProfile({
      points: [
        { percentile: 'p99p99.1', rank: 99, value: 1_000_000 },
        { percentile: 'p99.5p99.6', rank: 99.5, value: 2_000_000 },
        { percentile: 'p99.9p100', rank: 99.9, value: 5_000_000 },
      ],
    })
    const option = buildProfileOption(topTail, { chartType: 'line' })
    const xAxis = option.xAxis as { min: number, max: number }
    expect(xAxis.min).toBeGreaterThanOrEqual(98)
    expect(xAxis.min).toBeLessThan(99.5)
    expect(xAxis.max).toBe(100)
  })

  it('reaches 100 % when a bracket touches the top (scatter view)', () => {
    const full = makeProfile({
      points: [
        { percentile: 'p0p1', rank: 0, value: 10 },
        { percentile: 'p99p100', rank: 99, value: 1_000 },
      ],
    })
    const option = buildProfileOption(full, { chartType: 'scatter' })
    const xAxis = option.xAxis as { min: number, max: number }
    expect(xAxis.min).toBe(0)
    expect(xAxis.max).toBe(100)
  })

  it('extends the log rank axis to the ]99.999 %, 100 %] cap when a bracket reaches 100 %', () => {
    const full = makeProfile({
      points: [
        { percentile: 'p0p1', rank: 0, value: 10 },
        { percentile: 'p99.999p100', rank: 99.999, value: 1_000_000 },
      ],
    })
    const option = buildProfileOption(full, { logScaleX: true })
    expect((option.xAxis as { max: number }).max).toBeCloseTo(rankDisplayCoordinateUpper(100)!)
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

describe('rankDisplayCoordinateUpper', () => {
  it('returns a finite coordinate beyond 99.999 % for k = 100 %', () => {
    const upper = rankDisplayCoordinateUpper(100)!
    const anchor = rankDisplayCoordinate(99.999)!
    expect(upper).toBeGreaterThan(anchor)
    expect(rankDisplayCoordinate(100)).toBeNull()
  })

  it('matches rankDisplayCoordinate for k < 100 %', () => {
    expect(rankDisplayCoordinateUpper(90)).toBeCloseTo(rankDisplayCoordinate(90)!)
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
    expect(formatRankAxisLabel(rankDisplayCoordinateUpper(100)!)).toBe('100 %')
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
    expect(pairs.some((pair) => pair[0] === -1000)).toBe(false)
    const rank90 = pairs.find((pair) => pair[0] === 200000)!
    expect(rank90[0]).toBe(200000)
    expect(rank90[1]).toBeCloseTo(rankDisplayCoordinate(90)!)
  })
})

describe('computeLorenzPoints', () => {
  it('computes cumulative population and wealth shares from brackets', () => {
    const points = computeLorenzPoints([
      { percentile: 'p0p1', rank: 0, value: 0 },
      { percentile: 'p50p51', rank: 50, value: 100 },
      { percentile: 'p100', rank: 100, value: 200 },
    ])
    expect(points[0]).toEqual({ populationShare: 0, wealthShare: 0 })
    expect(points[1]).toMatchObject({ populationShare: 50 })
    expect(points[1]!.wealthShare).toBeCloseTo(25)
    expect(points[2]).toMatchObject({ populationShare: 100, wealthShare: 100 })
  })
})

describe('buildProfileOption — Lorenz curve', () => {
  it('plots cumulative population vs cumulative wealth with an equality reference', () => {
    const option = buildProfileOption(makeProfile(), { lorenzCurve: true })
    expect((option.xAxis as { name: string }).name).toContain('population')
    expect((option.yAxis as { name: string }).name).toContain('patrimoine')
    const series = option.series as { name?: string, type: string }[]
    expect(series).toHaveLength(2)
    expect(series[0]!.name).toBe('Égalité parfaite')
    expect(series[1]!.type).toBe('line')
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
    expect((option.yAxis as { scale: boolean }).scale).toBe(false)
  })

  it('draws PDF bins as wealth-span bands anchored at the density floor on log Y', () => {
    const profile = makeProfile({
      points: [
        { percentile: 'p0p1', rank: 0, value: 1000 },
        { percentile: 'p50p51', rank: 50, value: 50_000 },
        { percentile: 'p90p91', rank: 90, value: 500_000 },
      ],
    })
    const option = buildProfileOption(profile, {
      populationDensity: true,
      probabilityDensity: true,
      chartType: 'bar',
      logScaleY: true,
    })
    const yAxis = option.yAxis as { min: number, max: number, scale: boolean }
    const series = (option.series as { type: string, data: { value: [number, number, number] }[] }[])[0]!
    const densities = series.data.map((d) => d.value[2])

    expect(series.type).toBe('custom')
    expect(series.data[0]!.value[0]).toBe(1000)
    expect(series.data[0]!.value[1]).toBe(50_000)
    expect(yAxis.scale).toBe(false)
    expect(yAxis.min).toBeLessThan(Math.min(...densities))
    expect(yAxis.max).toBeGreaterThan(Math.max(...densities))
  })
})
