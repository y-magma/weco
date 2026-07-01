import { describe, expect, it } from 'vitest'
import type { PercentileProfile } from '@domain/entities'
import {
  buildMeanPreservingNodes,
  computeIntervalMeans,
} from '~/visualization/trapezoidApproximation'
import {
  buildOriginalProfileOption,
  buildTrapezoidProfileOption,
} from '~/visualization/trapezoidChart'
import { rankDisplayCoordinate, rankDisplayCoordinateUpper } from '~/visualization/profile'

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
      { percentile: 'p0p1', rank: 0, value: -1000 },
      { percentile: 'p50p51', rank: 50, value: 50_000 },
      { percentile: 'p90p91', rank: 90, value: 500_000 },
      { percentile: 'p99p100', rank: 99, value: 2_000_000 },
    ],
    ...overrides,
  }
}

describe('buildOriginalProfileOption — log axes', () => {
  it('uses rank-top-log spacing on X when logRichScale is enabled', () => {
    const option = buildOriginalProfileOption(makeProfile(), { logRichScale: true })
    const xAxis = option.xAxis as { min?: number, max?: number, scale: boolean, type: string }
    expect(xAxis.type).toBe('value')
    expect(xAxis.scale).toBe(true)
    expect(xAxis.min).toBeCloseTo(rankDisplayCoordinate(0)!)
    expect(xAxis.max).toBeCloseTo(rankDisplayCoordinateUpper(100)!)
  })

  it('uses native log X when logScaleX is enabled', () => {
    const option = buildOriginalProfileOption(makeProfile(), { logScaleX: true })
    const xAxis = option.xAxis as { type: string, scale: boolean, min?: number }
    expect(xAxis.type).toBe('log')
    expect(xAxis.scale).toBe(false)
    expect(xAxis.min).toBeGreaterThan(0)
  })

  it('drops non-positive ranks when logScaleX is enabled', () => {
    const option = buildOriginalProfileOption(makeProfile(), {
      logScaleX: true,
      originalViewMode: 'scatter',
    })
    const series = (option.series as { data: { value: [number, number] }[] }[])[0]!
    const xValues = series.data.map((d) => d.value[0])
    expect(xValues.every((x) => x > 0)).toBe(true)
  })

  it('uses native log Y when logScaleY is enabled', () => {
    const option = buildOriginalProfileOption(makeProfile(), { logScaleY: true })
    const yAxis = option.yAxis as { type: string, scale: boolean, min?: number }
    expect(yAxis.type).toBe('log')
    expect(yAxis.scale).toBe(false)
    expect(yAxis.min).toBeGreaterThan(0)
  })

  it('drops non-positive Y values when logScaleY is enabled', () => {
    const option = buildOriginalProfileOption(makeProfile(), {
      logScaleY: true,
      originalViewMode: 'scatter',
    })
    const series = (option.series as { data: { value: [number, number] }[] }[])[0]!
    const yValues = series.data.map((d) => d.value[1])
    expect(yValues.every((y) => y > 0)).toBe(true)
  })
})

describe('buildTrapezoidProfileOption — log axes', () => {
  const profile = makeProfile()
  const approximation = buildMeanPreservingNodes(
    computeIntervalMeans(profile.points, [50, 100]),
    'zero',
    profile.points,
  )!

  it('combines logRichScale and logScaleY independently', () => {
    const option = buildTrapezoidProfileOption(profile, approximation, {
      logRichScale: true,
      logScaleY: true,
      trapezoidBreakpoints: [50, 100],
      showWatermarkBands: true,
      showTrapezoids: true,
    })
    const xAxis = option.xAxis as { scale: boolean, type: string }
    const yAxis = option.yAxis as { type: string }
    expect(xAxis.type).toBe('value')
    expect(xAxis.scale).toBe(true)
    expect(yAxis.type).toBe('log')
  })

  it('combines strict logScaleX and logScaleY independently', () => {
    const option = buildTrapezoidProfileOption(profile, approximation, {
      logScaleX: true,
      logScaleY: true,
      trapezoidBreakpoints: [50, 100],
      showWatermarkBands: true,
      showTrapezoids: true,
    })
    const xAxis = option.xAxis as { type: string }
    const yAxis = option.yAxis as { type: string }
    expect(xAxis.type).toBe('log')
    expect(yAxis.type).toBe('log')
  })

  it('extends log Y axis to include tail percentiles beyond histogram bands', () => {
    const tailProfile = makeProfile({
      points: [
        { percentile: 'p0p1', rank: 0, value: 1000 },
        { percentile: 'p50p51', rank: 50, value: 50_000 },
        { percentile: 'p97p98', rank: 97, value: 1_200_000 },
        { percentile: 'p98p99', rank: 98, value: 3_000_000 },
        { percentile: 'p99p100', rank: 99, value: 8_000_000 },
      ],
    })
    const tailApprox = buildMeanPreservingNodes(
      computeIntervalMeans(tailProfile.points, [50, 100]),
      'zero',
      tailProfile.points,
    )!
    const option = buildTrapezoidProfileOption(tailProfile, tailApprox, {
      logScaleY: true,
      trapezoidBreakpoints: [50, 100],
      showWatermarkBands: true,
      showTrapezoids: true,
      displayPoints: tailProfile.points,
    })
    const yAxis = option.yAxis as { max?: number }
    const lineSeries = (option.series as { name?: string, data?: { value: [number, number] }[] }[])
      .find((series) => series.name === 'Courbe d\'origine')
    const maxPointY = Math.max(...(lineSeries?.data ?? []).map((entry) => entry.value[1]))
    expect(maxPointY).toBeGreaterThanOrEqual(8_000_000)
    expect(yAxis.max).toBeGreaterThan(maxPointY)
  })

  it('omits the vertical value slider (Y zoom via inside dataZoom / mouse wheel)', () => {
    const option = buildTrapezoidProfileOption(profile, approximation, {
      trapezoidBreakpoints: [50, 100],
      showTrapezoids: true,
    })
    const zooms = option.dataZoom as { type?: string, orient?: string, yAxisIndex?: number }[]
    const valueSlider = zooms.find((z) => z.type === 'slider' && z.orient === 'vertical' && z.yAxisIndex === 0)
    expect(valueSlider).toBeUndefined()
    expect(zooms.some((z) => z.type === 'inside' && z.yAxisIndex === 0)).toBe(true)
  })

  it('uses axis panning (not data filtering) on log Y so zoom-out restores the full range', () => {
    const option = buildTrapezoidProfileOption(profile, approximation, {
      logScaleY: true,
      trapezoidBreakpoints: [50, 100],
      showWatermarkBands: true,
      showTrapezoids: true,
    })
    const zooms = option.dataZoom as { yAxisIndex?: number, filterMode?: string }[]
    const valueZooms = zooms.filter((zoom) => zoom.yAxisIndex === 0)
    expect(valueZooms.length).toBeGreaterThan(0)
    expect(valueZooms.every((zoom) => zoom.filterMode === 'none')).toBe(true)
  })

  it('uses axis panning on strict log X', () => {
    const option = buildTrapezoidProfileOption(profile, approximation, {
      logScaleX: true,
      trapezoidBreakpoints: [50, 100],
      showTrapezoids: true,
    })
    const zooms = option.dataZoom as { xAxisIndex?: number, filterMode?: string }[]
    const rankZooms = zooms.filter((zoom) => zoom.xAxisIndex === 0)
    expect(rankZooms.length).toBeGreaterThan(0)
    expect(rankZooms.every((zoom) => zoom.filterMode === 'none')).toBe(true)
  })
})
