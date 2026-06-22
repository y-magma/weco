import { describe, expect, it } from 'vitest'
import {
  buildMonotonePchipSpline,
  buildSmoothDistributionSpline,
  computeEmpiricalCdfKnots,
  evaluateCdf,
  evaluatePdf,
  integrateSmoothPdf,
  sampleSmoothCdfSeries,
  sampleSmoothPdfSeries,
} from '~/visualization/empiricalDistributionSmooth'
import { linearRankScale, linearValueScale, resolveProfileAxisScales } from '~/visualization/axisScale'
import type { PercentilePoint } from '@domain/entities'

const thresholdPoints: PercentilePoint[] = [
  { percentile: 'p0p1', rank: 0, value: 1000 },
  { percentile: 'p50p51', rank: 50, value: 50_000 },
  { percentile: 'p90p91', rank: 90, value: 500_000 },
]

describe('computeEmpiricalCdfKnots', () => {
  it('builds monotone knots from percentile ranks', () => {
    const knots = computeEmpiricalCdfKnots(thresholdPoints)
    expect(knots).toEqual([
      { x: 1000, f: 0 },
      { x: 50_000, f: 0.5 },
      { x: 500_000, f: 0.9 },
    ])
  })

  it('merges plateaus at the same wealth keeping max F', () => {
    const knots = computeEmpiricalCdfKnots([
      { percentile: 'p40p41', rank: 40, value: 100_000 },
      { percentile: 'p50p51', rank: 50, value: 100_000 },
      { percentile: 'p70p71', rank: 70, value: 200_000 },
    ])
    expect(knots).toEqual([
      { x: 100_000, f: 0.5 },
      { x: 200_000, f: 0.7 },
    ])
  })

  it('skips decreasing wealth when ordered by rank', () => {
    const knots = computeEmpiricalCdfKnots([
      { percentile: 'p0p1', rank: 0, value: 10 },
      { percentile: 'p50p51', rank: 50, value: 50 },
      { percentile: 'p90p91', rank: 90, value: 40 },
    ])
    expect(knots.map((k) => k.x)).toEqual([10, 50])
  })

  it('anchors F=0 strictly below minimum wealth (monotone abscissae for log spline)', () => {
    const knots = computeEmpiricalCdfKnots([
      { percentile: 'p1p2', rank: 1, value: 5000 },
      { percentile: 'p50p51', rank: 50, value: 50_000 },
    ], { anchorZero: true })
    expect(knots[0]).toMatchObject({ f: 0 })
    expect(knots[0]!.x).toBeLessThan(5000)
    expect(knots[1]).toMatchObject({ x: 5000, f: 0.5 })
  })
})

describe('monotone PCHIP spline', () => {
  it('interpolates exactly at knots', () => {
    const knots = computeEmpiricalCdfKnots(thresholdPoints)
    const spline = buildMonotonePchipSpline(knots)
    expect(spline).not.toBeNull()
    for (const knot of knots) {
      expect(evaluateCdf(spline!, knot.x)).toBeCloseTo(knot.f, 10)
    }
  })

  it('keeps CDF monotone on a sample grid', () => {
    const spline = buildMonotonePchipSpline(computeEmpiricalCdfKnots(thresholdPoints))!
    const values = [2000, 10_000, 100_000, 300_000].map((x) => evaluateCdf(spline, x)!)
    for (let i = 1; i < values.length; i += 1) {
      expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]! - 1e-9)
    }
  })

  it('PDF integral approximates Delta F over an interval', () => {
    const spline = buildMonotonePchipSpline(computeEmpiricalCdfKnots(thresholdPoints))!
    const integral = integrateSmoothPdf(spline, 1000, 50_000)
    const deltaF = evaluateCdf(spline, 50_000)! - evaluateCdf(spline, 1000)!
    expect(integral).not.toBeNull()
    expect(integral!).toBeCloseTo(deltaF, 2)
  })

  it('evaluates positive PDF on strictly increasing wealth', () => {
    const spline = buildMonotonePchipSpline(computeEmpiricalCdfKnots(thresholdPoints))!
    const pdf = evaluatePdf(spline, 25_000)
    expect(pdf).not.toBeNull()
    expect(pdf!).toBeGreaterThan(0)
  })
})

describe('sample smooth series', () => {
  it('samples CDF curve in plot coordinates', () => {
    const scales = resolveProfileAxisScales({
      logScaleX: false,
      logScaleY: false,
      empiricalCdf: true,
      showPdf: false,
    })
    const spline = buildSmoothDistributionSpline(thresholdPoints)!
    const pairs = sampleSmoothCdfSeries(spline, scales.value, scales.rank)
    expect(pairs.length).toBeGreaterThan(10)
    expect(pairs[0]![0]).toBe(1000)
    expect(pairs[pairs.length - 1]![0]).toBe(500_000)
  })

  it('samples PDF curve in plot coordinates', () => {
    const scales = resolveProfileAxisScales({
      logScaleX: false,
      logScaleY: false,
      empiricalCdf: true,
      showPdf: true,
    })
    const spline = buildSmoothDistributionSpline(thresholdPoints)!
    const pairs = sampleSmoothPdfSeries(spline, scales.value, scales.density)
    expect(pairs.length).toBeGreaterThan(10)
    expect(pairs.every((p) => p[1] > 0)).toBe(true)
  })

  it('supports log-wealth spline construction', () => {
    const spline = buildSmoothDistributionSpline(thresholdPoints, { logX: true })!
    expect(spline.logX).toBe(true)
    expect(evaluatePdf(spline, 10_000)).toBeGreaterThan(0)
  })

  it('builds logX spline when the lowest rank has strictly positive wealth', () => {
    const spline = buildSmoothDistributionSpline([
      { percentile: 'p1p2', rank: 1, value: 5000 },
      { percentile: 'p50p51', rank: 50, value: 50_000 },
      { percentile: 'p90p91', rank: 90, value: 500_000 },
    ], { logX: true })
    expect(spline).not.toBeNull()
    const scales = resolveProfileAxisScales({
      logScaleX: true,
      logScaleY: false,
      empiricalCdf: true,
      showPdf: false,
    })
    const pairs = sampleSmoothCdfSeries(spline!, scales.value, scales.rank, { logX: true })
    expect(pairs.length).toBeGreaterThan(10)
  })
})
