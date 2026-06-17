import { describe, expect, it } from 'vitest'
import type { PercentilePoint } from '@domain/entities'
import {
  buildAlternatingCoefficients,
  buildMeanPreservingNodes,
  computeIntervalMeans,
  intervalMeanFromNodes,
} from '~/visualization/trapezoidApproximation'

/** Synthetic profile: linear ramp 100 + 10 * rank on ]0,100]. */
function syntheticPoints(): PercentilePoint[] {
  const points: PercentilePoint[] = []
  for (let lo = 0; lo < 100; lo += 10) {
    const hi = lo + 10
    const mid = (lo + hi) / 2
    points.push({
      percentile: `p${lo}p${hi}`,
      rank: lo,
      value: 100 + 10 * mid,
    })
  }
  return points
}

describe('trapezoidApproximation', () => {
  const points = syntheticPoints()
  const breakpoints = [50, 100]

  it('computes interval means from partition', () => {
    const means = computeIntervalMeans(points, breakpoints)
    expect(means).toHaveLength(2)
    expect(means[0]?.lo).toBe(0)
    expect(means[0]?.hi).toBe(50)
    expect(means[0]?.mean).toBeCloseTo(350, 0)
    expect(means[1]?.mean).toBeCloseTo(850, 0)
  })

  it('builds alternating coefficients from means', () => {
    const coeffs = buildAlternatingCoefficients([10, 20])
    expect(coeffs).toEqual([0, 20, 20])
  })

  const methods = ['anchor', 'zero', 'leastSquares', 'minOscillation'] as const

  for (const method of methods) {
    it(`preserves interval means for method ${method}`, () => {
      const means = computeIntervalMeans(points, breakpoints)
      const result = buildMeanPreservingNodes(means, method, points)
      expect(result).not.toBeNull()

      for (const interval of means) {
        const approxMean = intervalMeanFromNodes(result!.nodes, interval.lo, interval.hi)
        expect(approxMean).toBeCloseTo(interval.mean!, 6)
      }
    })
  }

  it('anchor method fixes y0 to curve value at rank 0', () => {
    const means = computeIntervalMeans(points, breakpoints)
    const result = buildMeanPreservingNodes(means, 'anchor', points)
    expect(result!.y0).toBeCloseTo(150, 0)
  })

  it('zero method fixes y0 to 0', () => {
    const means = computeIntervalMeans(points, breakpoints)
    const result = buildMeanPreservingNodes(means, 'zero', points)
    expect(result!.y0).toBe(0)
  })

  it('least squares y0 matches closed form on synthetic ramp', () => {
    const means = computeIntervalMeans(points, breakpoints)
    const nodesX = [0, 50, 100]
    const coeffs = buildAlternatingCoefficients(means.map((m) => m.mean!))
    const samples = points.flatMap((p) => {
      const interval = p.percentile.match(/p([\d.]+)p([\d.]+)/)
      if (!interval) return []
      const lo = Number(interval[1])
      const hi = Number(interval[2])
      const mid = (lo + hi) / 2
      return [{ x: mid, y: p.value! }]
    })

    let num = 0
    let den = 0
    for (const sample of samples) {
      for (let i = 1; i < nodesX.length; i += 1) {
        const xLo = nodesX[i - 1]!
        const xHi = nodesX[i]!
        if (sample.x <= xHi || i === nodesX.length - 1) {
          const t = (sample.x - xLo) / (xHi - xLo)
          const base = coeffs[i - 1]! + t * (coeffs[i]! - coeffs[i - 1]!)
          const scale = (-1) ** (i - 1) + t * ((-1) ** i - (-1) ** (i - 1))
          num += scale * (sample.y - base)
          den += scale * scale
          break
        }
      }
    }
    const expectedY0 = num / den
    const result = buildMeanPreservingNodes(means, 'leastSquares', points)
    expect(result!.y0).toBeCloseTo(expectedY0, 4)
  })

  it('min oscillation y0 minimizes slope energy', () => {
    const means = computeIntervalMeans(points, breakpoints)
    const nodesX = [0, 50, 100]
    const coeffs = buildAlternatingCoefficients(means.map((m) => m.mean!))

    let num = 0
    let den = 0
    for (let i = 1; i < nodesX.length; i += 1) {
      const dx = nodesX[i]! - nodesX[i - 1]!
      const dBase = (coeffs[i]! - coeffs[i - 1]!) / dx
      const dScale = ((-1) ** i - (-1) ** (i - 1)) / dx
      num += dBase * dScale
      den += dScale * dScale
    }
    const expectedY0 = -num / den
    const result = buildMeanPreservingNodes(means, 'minOscillation', points)
    expect(result!.y0).toBeCloseTo(expectedY0, 4)
  })

  it('produces connected nodes at breakpoints', () => {
    const means = computeIntervalMeans(points, [25, 75, 100])
    const result = buildMeanPreservingNodes(means, 'zero', points)!
    expect(result.nodes.map((n) => n.x)).toEqual([0, 25, 75, 100])
    expect(result.nodes.every((n) => Number.isFinite(n.y))).toBe(true)
  })
})
