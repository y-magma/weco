import { describe, expect, it } from 'vitest'
import {
  buildProfileDataZoom,
  buildProfileOption,
  buildRankBandItems,
  computeBandAxisBounds,
  computeProfileValueExtent,
  computeRankIntervalExtent,
  createRenderRankBand,
  filterPointsByValueRange,
  computePdfBins,
  computeLorenzPoints,
  formatRankAxisLabel,
  plotRankForPoint,
  rankDisplayCoordinate,
  rankDisplayCoordinateUpper,
  rankFromDisplayCoordinate,
  rankFromTopLogCoordinate,
  normalizeChartTypeLayers,
  resolveProfileChartType,
  rankTopLogCoordinate,
} from '~/visualization/profile'
import { symlogToCoord } from '~/visualization/symlogScale'
import { linearRankScale, linearValueScale, rankTopLogScale, resolveProfileAxisScales } from '~/visualization/axisScale'
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
  const seriesList = option.series as { type?: string, data: SeriesDatum[] }[]
  const overlay = seriesList.find((series) => series.type === 'scatter' || series.type === 'line')
  const series = overlay ?? seriesList[0]!
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

describe('resolveProfileChartType', () => {
  it('maps single layers to bar, scatter or line', () => {
    expect(resolveProfileChartType(['bar'])).toBe('bar')
    expect(resolveProfileChartType(['scatter'])).toBe('scatter')
    expect(resolveProfileChartType(['line'])).toBe('line')
  })

  it('maps bandes + nuage or bandes + ligne to overlay modes', () => {
    expect(resolveProfileChartType(['bar', 'scatter'])).toBe('scatter-bar')
    expect(resolveProfileChartType(['scatter', 'bar'])).toBe('scatter-bar')
    expect(resolveProfileChartType(['bar', 'line'])).toBe('line-bar')
  })
})

describe('normalizeChartTypeLayers', () => {
  it('keeps at least one layer selected', () => {
    expect(normalizeChartTypeLayers([], ['scatter'])).toEqual(['scatter'])
  })

  it('limits selection to two layers, preferring bandes in overlays', () => {
    expect(normalizeChartTypeLayers(['bar', 'scatter', 'line'], ['bar', 'scatter'])).toEqual(['bar', 'line'])
    expect(normalizeChartTypeLayers(['scatter', 'line', 'bar'], ['scatter', 'line'])).toEqual(['bar', 'scatter'])
  })
})

describe('buildProfileDataZoom', () => {
  it('filters data so the orthogonal axis can autoscale when zooming', () => {
    const zooms = buildProfileDataZoom(false)
    expect(zooms.every((z) => z.filterMode === 'filter')).toBe(true)
  })

  it('omits vertical sliders; Y zoom remains via inside dataZoom', () => {
    const zooms = buildProfileDataZoom(false)
    expect(zooms.find((z) => z.type === 'slider' && (z as { orient?: string }).orient === 'vertical')).toBeUndefined()
    expect(zooms.find((z) => z.type === 'slider' && (z as { xAxisIndex?: number }).xAxisIndex === 0)).toBeDefined()
    expect(zooms.some((z) => z.type === 'inside' && (z as { yAxisIndex?: number }).yAxisIndex === 0)).toBe(true)
  })

  it('omits vertical sliders in empirical CDF view (rank on Y)', () => {
    const zooms = buildProfileDataZoom(true)
    expect(zooms.find((z) => z.type === 'slider' && (z as { orient?: string }).orient === 'vertical')).toBeUndefined()
    expect(zooms.find((z) => z.type === 'slider' && (z as { xAxisIndex?: number }).xAxisIndex === 0)).toBeDefined()
    expect(zooms.some((z) => z.type === 'inside' && (z as { yAxisIndex?: number }).yAxisIndex === 0)).toBe(true)
  })

  it('can omit the horizontal value slider in CDF view', () => {
    const zooms = buildProfileDataZoom(true, undefined, { showValueSlider: false })
    expect(zooms.filter((z) => z.type === 'slider')).toHaveLength(0)
    expect(zooms.some((z) => z.type === 'inside' && (z as { yAxisIndex?: number }).yAxisIndex === 0)).toBe(true)
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

  it('zooms X (richesse) and Y (population %) in empirical CDF view', () => {
    const option = buildProfileOption(makeProfile(), {
      empiricalCdf: true,
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
  it('anchors bars at yBase = 0 on symlog value axis with negative data', () => {
    const scales = resolveProfileAxisScales({
      logScaleX: false,
      logScaleY: true,
      empiricalCdf: false,
      showPdf: false,
    })
    const items = buildRankBandItems([
      { percentile: 'p0p1', rank: 0, value: -1000 },
      { percentile: 'p90p91', rank: 90, value: 200000 },
    ], { rankScale: scales.rank, valueScale: scales.value })
    const bounds = computeBandAxisBounds(items, {
      rankScale: scales.rank,
      valueScale: scales.value,
    })
    expect(bounds.yBase).toBe(0)
    expect(bounds.yMin).toBeLessThan(0)
  })
})

describe('createRenderRankBand', () => {
  it('extends bars below zero for negative values', () => {
    const render = createRenderRankBand(0)
    const grid = { x: 0, y: 0, width: 400, height: 300 }
    const yToPixel = (value: number) => 150 - value * 0.1

    const negative = render(
      { coordSys: grid } as Parameters<ReturnType<typeof createRenderRankBand>>[0],
      {
        value: (i: number) => [0, 1, -750][i] as number,
        coord: (pair: [number, number]) => [50, yToPixel(pair[1])],
        style: () => ({}),
      } as Parameters<ReturnType<typeof createRenderRankBand>>[1],
    )
    const positive = render(
      { coordSys: grid } as Parameters<ReturnType<typeof createRenderRankBand>>[0],
      {
        value: (i: number) => [0, 1, 1500][i] as number,
        coord: (pair: [number, number]) => [50, yToPixel(pair[1])],
        style: () => ({}),
      } as Parameters<ReturnType<typeof createRenderRankBand>>[1],
    )

    expect(negative?.shape).toMatchObject({ y: 150, height: 75 })
    expect(positive?.shape).toMatchObject({ y: 0, height: 150 })
  })

  it('skips inverted segments when a positive value plots below the density floor', () => {
    const render = createRenderRankBand(1e-12)
    const grid = { x: 0, y: 0, width: 400, height: 300 }

    const inverted = render(
      { coordSys: grid } as Parameters<ReturnType<typeof createRenderRankBand>>[0],
      {
        value: (i: number) => [0, 1, 1e-14][i] as number,
        coord: (pair: [number, number]) => {
          if (pair[1] === 1e-12) return [50, 200]
          return [50, 250]
        },
        style: () => ({}),
      } as Parameters<ReturnType<typeof createRenderRankBand>>[1],
    )

    expect(inverted).toBeNull()
  })
})

describe('buildRankBandItems', () => {
  it('keeps the ]99.999 %, 100 %] band when log X is enabled', () => {
    const bands = buildRankBandItems(
      [{ percentile: 'p99.999p100', rank: 99.999, value: 1_000_000 }],
      { rankScale: rankTopLogScale, valueScale: linearValueScale },
    )
    expect(bands).toHaveLength(1)
    expect(bands[0]!.i).toBe(99.999)
    expect(bands[0]!.k).toBe(100)
    expect(bands[0]!.value[0]).toBeCloseTo(rankDisplayCoordinate(99.999)!)
    expect(bands[0]!.value[1]).toBeCloseTo(rankDisplayCoordinateUpper(100)!)
    expect(bands[0]!.value[1]).toBeGreaterThan(bands[0]!.value[0])
  })

  it('maps each pᵢpₖ bracket to a band on ]i %, k %]', () => {
    const bands = buildRankBandItems(makeProfile().points, {
      rankScale: linearRankScale,
      valueScale: linearValueScale,
    })
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
  it('orders points by rank on a linear X axis (average → interval midpoint)', () => {
    const option = buildProfileOption(makeProfile(), { chartType: 'scatter' })
    expect((option.xAxis as { type: string }).type).toBe('value')
    expect(seriesPairs(option).map((pair) => pair[0])).toEqual([0.5, 20.5, 50.5, 90.5])
  })

  it('keeps explicit gaps (null) as null', () => {
    const option = buildProfileOption(makeProfile(), { chartType: 'scatter' })
    const gap = seriesPairs(option).find((pair) => pair[0] === 20.5)!
    expect(gap[1]).toBeNull()
  })

  it('uses a value (linear) axis by default', () => {
    const option = buildProfileOption(makeProfile())
    expect((option.yAxis as { type: string }).type).toBe('value')
  })

  it('uses symlog coords on a linear Y axis when logScaleY is set (standard profile)', () => {
    const option = buildProfileOption(makeProfile(), { logScaleY: true })
    expect((option.yAxis as { type: string }).type).toBe('value')
    expect((option.title as { subtext?: string }).subtext).toContain('symlog')
  })

  it('formats the value axis with real values from symlog coords', () => {
    const option = buildProfileOption(makeProfile(), { logScaleY: true })
    const formatter = (option.yAxis as { axisLabel: { formatter: (v: number) => string } }).axisLabel.formatter
    expect(formatter(1)).toBe('9')
    expect(formatter(-1)).toBe('-9')
  })

  it('keeps non-positive values visible with logScaleY (symlog)', () => {
    const option = buildProfileOption(makeProfile(), { chartType: 'scatter', logScaleY: true })
    const bottom = seriesPairs(option).find((pair) => pair[0] === 0.5)!
    expect(bottom[1]).toBeCloseTo(symlogToCoord(-1000)!)
  })

  it('honours the chart type', () => {
    const bar = buildProfileOption(makeProfile(), { chartType: 'bar' })
    const scatter = buildProfileOption(makeProfile(), { chartType: 'scatter' })
    expect((bar.series as { type: string }[])[0]!.type).toBe('custom')
    expect((scatter.series as { type: string }[])[0]!.type).toBe('scatter')
  })

  it('draws watermark bands behind scatter or line overlays', () => {
    const scatterBar = buildProfileOption(makeProfile(), { chartType: 'scatter-bar' })
    const lineBar = buildProfileOption(makeProfile(), { chartType: 'line-bar' })
    const scatterSeries = scatterBar.series as { type: string, z?: number, itemStyle?: { opacity?: number } }[]
    const lineSeries = lineBar.series as { type: string, z?: number }[]

    expect(scatterSeries).toHaveLength(2)
    expect(scatterSeries[0]!.type).toBe('custom')
    expect(scatterSeries[0]!.z).toBe(0)
    expect(scatterSeries[0]!.itemStyle?.opacity).toBeLessThan(0.3)
    expect(scatterSeries[1]!.type).toBe('scatter')
    expect(scatterSeries[1]!.z).toBe(2)

    expect(lineSeries).toHaveLength(2)
    expect(lineSeries[1]!.type).toBe('line')
    expect(lineSeries[1]!.z).toBe(2)
  })

  it('keeps fine overlay points while bands use aggregated brackets', () => {
    const fine = makeProfile().points
    const aggregated = [
      { percentile: 'p0p25', rank: 0, value: 12 },
      { percentile: 'p25p50', rank: 25, value: 37 },
      { percentile: 'p50p75', rank: 50, value: 62 },
      { percentile: 'p75p100', rank: 75, value: 87 },
    ]
    const profile = makeProfile({ points: aggregated })
    const option = buildProfileOption(profile, {
      chartType: 'line-bar',
      overlayPoints: fine,
    })
    const series = option.series as { type: string, data: unknown[] }[]

    expect(series[0]!.data).toHaveLength(4)
    expect(series[1]!.data).toHaveLength(fine.length)
  })

  it('frames initial dataZoom on band bounds in overlay mode', () => {
    const fine = [
      { percentile: 'p0p1', rank: 0, value: 1000 },
      { percentile: 'p50p51', rank: 50, value: 50000 },
      { percentile: 'p90p91', rank: 90, value: 500000 },
    ]
    const aggregated = [
      { percentile: 'p0p50', rank: 0, value: 20000 },
      { percentile: 'p50p100', rank: 50, value: 200000 },
    ]
    const profile = makeProfile({ points: aggregated })
    const option = buildProfileOption(profile, {
      chartType: 'line-bar',
      overlayPoints: fine,
    })
    const zoom = option.dataZoom as { yAxisIndex?: number, startValue?: number, endValue?: number }[]
    const valueSlider = zoom.find((z) => z.yAxisIndex === 0 && z.endValue != null)

    expect(valueSlider).toBeDefined()
    expect(valueSlider!.endValue!).toBeLessThan(500000)
    expect(valueSlider!.endValue!).toBeGreaterThan(150000)
  })

  it('draws bands by default', () => {
    const option = buildProfileOption(makeProfile())
    expect((option.series as { type: string }[])[0]!.type).toBe('custom')
  })

  it('draws a connected line in line mode', () => {
    const option = buildProfileOption(makeProfile(), { chartType: 'line' })
    const series = (option.series as { type: string, step?: string }[])[0]!
    expect(series.type).toBe('line')
    expect(series.step).toBeUndefined()
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

  it('enables rank-axis autoscale for interactive zoom (line view)', () => {
    const option = buildProfileOption(makeProfile(), { chartType: 'line' })
    expect((option.xAxis as { name: string }).name).toBe('Part de population (%)')
    expect((option.xAxis as { scale: boolean }).scale).toBe(true)
    expect((option.xAxis as { min?: number }).min).toBeUndefined()
    expect((option.xAxis as { max?: number }).max).toBeUndefined()
  })

  it('fits the rank axis when a value-range drill zoom is active (line view)', () => {
    const topTail = makeProfile({
      points: [
        { percentile: 'p99p99.1', rank: 99, value: 1_000_000 },
        { percentile: 'p99.5p99.6', rank: 99.5, value: 2_000_000 },
        { percentile: 'p99.9p100', rank: 99.9, value: 5_000_000 },
      ],
    })
    const option = buildProfileOption(topTail, {
      chartType: 'line',
      valueRange: { min: 1_500_000, max: 6_000_000 },
    })
    const xAxis = option.xAxis as { min: number, max: number }
    expect(xAxis.min).toBeGreaterThanOrEqual(98)
    expect(xAxis.min).toBeLessThan(99.5)
    expect(xAxis.max).toBe(100)
  })

  it('does not lock the rank axis to 0–100 % before zoom (scatter view)', () => {
    const full = makeProfile({
      points: [
        { percentile: 'p0p1', rank: 0, value: 10 },
        { percentile: 'p99p100', rank: 99, value: 1_000 },
      ],
    })
    const option = buildProfileOption(full, { chartType: 'scatter' })
    const xAxis = option.xAxis as { min?: number, max?: number, scale: boolean }
    expect(xAxis.scale).toBe(true)
    expect(xAxis.min).toBeUndefined()
    expect(xAxis.max).toBeUndefined()
  })

  it('uses log rank coordinates without fixed axis caps (log X)', () => {
    const full = makeProfile({
      points: [
        { percentile: 'p0p1', rank: 0, value: 10 },
        { percentile: 'p99.999p100', rank: 99.999, value: 1_000_000 },
      ],
    })
    const option = buildProfileOption(full, { logScaleX: true })
    expect((option.xAxis as { scale: boolean }).scale).toBe(true)
    expect((option.xAxis as { min?: number }).min).toBeUndefined()
    expect((option.xAxis as { max?: number }).max).toBeUndefined()
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

describe('plotRankForPoint', () => {
  it('uses the midpoint of ]i, k] for average variables', () => {
    expect(plotRankForPoint({ percentile: 'p50p51', rank: 50, value: 1 }, 'average')).toBe(50.5)
    expect(plotRankForPoint({ percentile: 'p0p1', rank: 0, value: 1 }, 'average')).toBe(0.5)
  })

  it('keeps the lower bound for threshold variables', () => {
    expect(plotRankForPoint({ percentile: 'p50p51', rank: 50, value: 1 }, 'threshold')).toBe(50)
  })
})

describe('buildProfileOption — log X scale', () => {
  it('keeps rank % as the X axis label while spacing in log space', () => {
    const option = buildProfileOption(makeProfile(), { chartType: 'scatter', logScaleX: true })
    expect((option.xAxis as { type: string }).type).toBe('value')
    expect((option.xAxis as { name: string }).name).toBe('Part de population (%)')
    expect((option.xAxis as { scale: boolean }).scale).toBe(true)
    expect((option.xAxis as { min?: number }).min).toBeUndefined()
    expect((option.xAxis as { axisLabel: { formatter: (v: number) => string } }).axisLabel.formatter(-1)).toBe('90 %')
  })

  it('emits [x, y] pairs with x = rankDisplayCoordinate(midpoint), increasing with rank', () => {
    const option = buildProfileOption(makeProfile(), { chartType: 'scatter', logScaleX: true })
    const pairs = seriesPairs(option)
    expect(pairs).toHaveLength(4)
    expect(pairs[0]![0]).toBeCloseTo(rankDisplayCoordinate(0.5)!)
    expect(pairs.at(-1)![0]).toBeCloseTo(rankDisplayCoordinate(90.5)!)
    for (let i = 1; i < pairs.length; i++) {
      expect(pairs[i]![0]).toBeGreaterThan(pairs[i - 1]![0])
    }
  })

  it('keeps negative Y values visible with log Y in log X mode (symlog)', () => {
    const option = buildProfileOption(makeProfile(), { chartType: 'scatter', logScaleX: true, logScaleY: true })
    const pairs = seriesPairs(option)
    const bottom = pairs.find((pair) => pair[0] === rankDisplayCoordinate(0.5))!
    expect(bottom[1]).toBeCloseTo(symlogToCoord(-1000)!)
  })

  it('drops points at rank 100 when log X is enabled', () => {
    const option = buildProfileOption(makeProfile({
      points: [
        { percentile: 'p99.999p100', rank: 99.999, value: 1_000_000 },
        { percentile: 'p100', rank: 100, value: 2_000_000 },
      ],
    }), { chartType: 'scatter', logScaleX: true })
    expect(seriesPairs(option)).toHaveLength(1)
    expect(seriesPairs(option)[0]![0]).toBeCloseTo(rankDisplayCoordinate(99.9995)!)
  })
})

describe('buildProfileOption — threshold variable positioning', () => {
  it('plots scatter points at the lower bound of each bracket', () => {
    const option = buildProfileOption(makeProfile({
      kind: 'threshold',
      variable: 'thweal',
      points: [
        { percentile: 'p50p51', rank: 50, value: 50000 },
        { percentile: 'p0p1', rank: 0, value: 1000 },
      ],
    }), { chartType: 'scatter' })
    expect(seriesPairs(option).map((pair) => pair[0])).toEqual([0, 50])
  })
})

describe('buildProfileOption — empirical CDF view', () => {
  it('swaps axes: X = value, Y = population share (average → interval midpoint)', () => {
    const option = buildProfileOption(makeProfile(), { chartType: 'scatter', empiricalCdf: true })
    expect((option.xAxis as { name: string }).name).toContain('EUR')
    expect((option.yAxis as { name: string }).name).toBe('Part de population (%)')
    const pairs = seriesPairs(option)
    expect(pairs.find((pair) => pair[1] === 0.5)).toEqual([-1000, 0.5])
    expect(pairs.find((pair) => pair[1] === 90.5)).toEqual([200000, 90.5])
    expect(pairs.some((pair) => pair[1] === 20.5)).toBe(false)
  })

  it('routes logScaleX to the value axis and logScaleY to the rank axis', () => {
    const option = buildProfileOption(makeProfile(), {
      chartType: 'scatter',
      empiricalCdf: true,
      logScaleX: true,
      logScaleY: true,
    })
    expect((option.xAxis as { type: string }).type).toBe('log')
    expect((option.yAxis as { scale: boolean }).scale).toBe(true)
    const pairs = seriesPairs(option)
    expect(pairs.some((pair) => pair[0] === -1000)).toBe(false)
    const rank90 = pairs.find((pair) => pair[0] === 200000)!
    expect(rank90[0]).toBe(200000)
    expect(rank90[1]).toBeCloseTo(rankDisplayCoordinate(90.5)!)
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

  it('skips decreasing wealth intervals (Δv < 0)', () => {
    const bins = computePdfBins([
      { percentile: 'p0p1', rank: 0, value: 100 },
      { percentile: 'p50p51', rank: 50, value: 50 },
    ])
    expect(bins).toHaveLength(0)
  })

  it('merges consecutive plateaus (Δv = 0) into one bin at the next wealth jump', () => {
    const bins = computePdfBins([
      { percentile: 'p40p41', rank: 40, value: 100_000 },
      { percentile: 'p50p51', rank: 50, value: 100_000 },
      { percentile: 'p60p61', rank: 60, value: 100_000 },
      { percentile: 'p70p71', rank: 70, value: 200_000 },
    ])
    expect(bins).toHaveLength(1)
    expect(bins[0]).toMatchObject({
      valueLo: 100_000,
      valueHi: 200_000,
      rankLo: 40,
      rankHi: 70,
      density: (30 / 100) / (200_000 - 100_000),
      percentileLo: 'p40p41',
      percentileHi: 'p70p71',
    })
  })
})

describe('buildProfileOption — empirical PDF view', () => {
  it('plots the empirical PDF on wealth vs density axes', () => {
    const option = buildProfileOption(makeProfile(), {
      empiricalCdf: true,
      empiricalPdf: true,
    })
    expect((option.xAxis as { name: string }).name).toContain('EUR')
    expect((option.yAxis as { name: string }).name).toContain('PDF empirique')
    const pairs = seriesPairs(option)
    expect(pairs.length).toBeGreaterThan(0)
    expect(pairs[0]![1]).toBeGreaterThan(0)
  })

  it('routes logScaleY to the density axis', () => {
    const option = buildProfileOption(makeProfile(), {
      empiricalCdf: true,
      empiricalPdf: true,
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
      empiricalCdf: true,
      empiricalPdf: true,
      chartType: 'bar',
      logScaleY: true,
    })
    const yAxis = option.yAxis as { min?: number, max?: number, scale: boolean }
    const series = (option.series as { type: string, data: { value: [number, number, number] }[] }[])[0]!
    const densities = series.data.map((d) => d.value[2])

    expect(series.type).toBe('custom')
    expect(series.data[0]!.value[0]).toBe(1000)
    expect(series.data[0]!.value[1]).toBe(50_000)
    expect(yAxis.scale).toBe(false)
    expect(yAxis.min).toBeDefined()
    expect(yAxis.max).toBeDefined()
    const minDensity = Math.min(...densities)
    expect(yAxis.min!).toBeLessThanOrEqual(minDensity)
    expect(yAxis.max!).toBeGreaterThan(Math.max(...densities))
    expect(Math.min(...densities)).toBeGreaterThan(0)
  })
})

function makeThresholdProfile(): PercentileProfile {
  return makeProfile({
    variable: 'thweal',
    kind: 'threshold',
    points: [
      { percentile: 'p0p1', rank: 0, value: 1000 },
      { percentile: 'p50p51', rank: 50, value: 50_000 },
      { percentile: 'p90p91', rank: 90, value: 500_000 },
    ],
  })
}

function seriesNames(option: ReturnType<typeof buildProfileOption>): string[] {
  return (option.series as { name?: string }[]).map((series) => series.name ?? '')
}

describe('buildProfileOption — smooth CDF/PDF', () => {
  it('shows empirical and smooth CDF series when mode is both', () => {
    const option = buildProfileOption(makeThresholdProfile(), {
      empiricalCdf: true,
      chartType: 'line',
      smoothDistributionMode: 'both',
    })
    const names = seriesNames(option)
    expect(names).toContain('thweal')
    expect(names).toContain('CDF lissée')
  })

  it('shows only smooth CDF when mode is smooth', () => {
    const option = buildProfileOption(makeThresholdProfile(), {
      empiricalCdf: true,
      chartType: 'line',
      smoothDistributionMode: 'smooth',
    })
    const names = seriesNames(option)
    expect(names).not.toContain('thweal')
    expect(names).toContain('CDF lissée')
  })

  it('shows smooth PDF overlay when empirical PDF and mode both', () => {
    const option = buildProfileOption(makeThresholdProfile(), {
      empiricalCdf: true,
      empiricalPdf: true,
      chartType: 'line',
      smoothDistributionMode: 'both',
    })
    const names = seriesNames(option)
    expect(names).toContain('PDF empirique')
    expect(names).toContain('PDF lissée')
  })

  it('shows smooth CDF with logX when only smooth mode is active', () => {
    const option = buildProfileOption(makeThresholdProfile(), {
      empiricalCdf: true,
      chartType: 'line',
      logScaleX: true,
      smoothDistributionMode: 'smooth',
    })
    const names = seriesNames(option)
    expect(names).toContain('CDF lissée')
    expect(names).not.toContain('thweal')
    const xAxis = option.xAxis as { type: string, min?: number, max?: number }
    expect(xAxis.type).toBe('log')
    expect(xAxis.min).toBeGreaterThan(0)
    expect(xAxis.max).toBeGreaterThan(xAxis.min!)
  })
})
