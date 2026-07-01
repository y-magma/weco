/**
 * Approximation continue affine par morceaux conservant la moyenne sur chaque intervalle.
 *
 * Sur ]x_{i-1}, x_i], la moyenne imposée est m_i. Pour une ligne par morceaux avec nœuds
 * y_0 … y_n aux abscisses x_0 … x_n, on a (y_{i-1} + y_i) / 2 = m_i, d'où
 * y_i = 2 m_i - y_{i-1}. Tous les nœuds dépendent linéairement de y_0 seul.
 */
import type { PercentilePoint } from '@domain/entities'
import type { TrapezoidMethod } from '@domain/panelState'
import { parsePercentileInterval } from '@domain/services/percentiles'
import {
  aggregatePointValue,
  buildPartitionPoints,
} from '~/visualization/populationPartition'

export type { TrapezoidMethod } from '@domain/panelState'

export interface TrapezoidNode {
  x: number
  y: number
}

export interface IntervalMean {
  lo: number
  hi: number
  mean: number | null
}

export interface TrapezoidPolygon {
  lo: number
  hi: number
  yLo: number
  yHi: number
}

export interface MeanPreservingApproximation {
  nodes: TrapezoidNode[]
  means: IntervalMean[]
  y0: number
  method: TrapezoidMethod
}

const EPS = 1e-9

function roundBoundary(n: number): number {
  return Number(n.toFixed(6))
}

/** Moyennes pondérées par la population sur chaque intervalle ]lo, hi]. */
export function computeIntervalMeans(
  points: PercentilePoint[],
  breakpoints: number[],
): IntervalMean[] {
  const partition = buildPartitionPoints(points, breakpoints)
  const means: IntervalMean[] = []
  let lo = 0

  for (let i = 0; i < breakpoints.length; i += 1) {
    const hi = roundBoundary(breakpoints[i]!)
    means.push({
      lo,
      hi,
      mean: partition[i]?.value ?? null,
    })
    lo = hi
  }

  return means
}

/** Coefficients c_i tels que y_i = c_i + (-1)^i * y_0 (c_0 = 0). */
export function buildAlternatingCoefficients(means: number[]): number[] {
  const coeffs = [0]
  for (let i = 0; i < means.length; i += 1) {
    coeffs.push(2 * means[i]! - coeffs[i]!)
  }
  return coeffs
}

function nodeXFromBreakpoints(breakpoints: number[]): number[] {
  return [0, ...breakpoints.map(roundBoundary)]
}

function valueAtRank(points: PercentilePoint[], rank: number): number | null {
  const ordered = [...points]
    .filter((p) => p.value !== null && Number.isFinite(p.value))
    .sort((a, b) => a.rank - b.rank)

  if (ordered.length === 0) return null

  const exact = ordered.find((p) => Math.abs(p.rank - rank) < EPS)
  if (exact) return exact.value

  if (rank <= ordered[0]!.rank) return ordered[0]!.value
  if (rank >= ordered[ordered.length - 1]!.rank) return ordered[ordered.length - 1]!.value

  for (let i = 0; i < ordered.length - 1; i += 1) {
    const lo = ordered[i]!
    const hi = ordered[i + 1]!
    if (rank >= lo.rank && rank <= hi.rank) {
      const t = (rank - lo.rank) / (hi.rank - lo.rank)
      return lo.value! + t * (hi.value! - lo.value!)
    }
  }

  return null
}

function samplePointsForInterval(
  allPoints: PercentilePoint[],
  lo: number,
  hi: number,
): Array<{ x: number, y: number }> {
  const samples: Array<{ x: number, y: number }> = []

  for (const point of allPoints) {
    if (point.value === null || !Number.isFinite(point.value)) continue
    const interval = parsePercentileInterval(point.percentile)
    const mid = interval ? (interval.i + interval.k) / 2 : point.rank
    if (mid > lo + EPS && mid <= hi + EPS) {
      samples.push({ x: mid, y: point.value })
    }
  }

  if (samples.length === 0) {
    const agg = aggregatePointValue(
      allPoints.filter((point) => {
        const interval = parsePercentileInterval(point.percentile)
        if (!interval) return false
        return interval.i >= lo - EPS && interval.k <= hi + EPS
      }),
    )
    if (agg !== null) {
      samples.push({ x: (lo + hi) / 2, y: agg })
    }
  }

  return samples
}

function approxAtX(
  x: number,
  nodesX: number[],
  coeffs: number[],
  y0: number,
): number {
  for (let i = 1; i < nodesX.length; i += 1) {
    const xLo = nodesX[i - 1]!
    const xHi = nodesX[i]!
    if (x <= xHi + EPS || i === nodesX.length - 1) {
      const yLo = coeffs[i - 1]! + (-1) ** (i - 1) * y0
      const yHi = coeffs[i]! + (-1) ** i * y0
      if (Math.abs(xHi - xLo) < EPS) return yLo
      const t = (x - xLo) / (xHi - xLo)
      return yLo + t * (yHi - yLo)
    }
  }
  const last = nodesX.length - 1
  return coeffs[last]! + (-1) ** last * y0
}

/** Affine decomposition f(x) = base(x) + scale(x) * y_0 on one interval. */
function affineAtX(
  x: number,
  nodesX: number[],
  coeffs: number[],
): { base: number, scale: number } {
  for (let i = 1; i < nodesX.length; i += 1) {
    const xLo = nodesX[i - 1]!
    const xHi = nodesX[i]!
    if (x <= xHi + EPS || i === nodesX.length - 1) {
      const cLo = coeffs[i - 1]!
      const cHi = coeffs[i]!
      const sLo = (-1) ** (i - 1)
      const sHi = (-1) ** i
      if (Math.abs(xHi - xLo) < EPS) {
        return { base: cLo, scale: sLo }
      }
      const t = (x - xLo) / (xHi - xLo)
      return {
        base: cLo + t * (cHi - cLo),
        scale: sLo + t * (sHi - sLo),
      }
    }
  }
  const last = nodesX.length - 1
  return { base: coeffs[last]!, scale: (-1) ** last }
}

function resolveY0LeastSquares(
  samplePoints: Array<{ x: number, y: number }>,
  nodesX: number[],
  coeffs: number[],
): number {
  let num = 0
  let den = 0
  for (const sample of samplePoints) {
    const { base, scale } = affineAtX(sample.x, nodesX, coeffs)
    const residual = sample.y - base
    num += scale * residual
    den += scale * scale
  }
  return den > EPS ? num / den : 0
}

function resolveY0MinOscillation(
  nodesX: number[],
  coeffs: number[],
): number {
  let num = 0
  let den = 0
  for (let i = 1; i < nodesX.length; i += 1) {
    const dx = nodesX[i]! - nodesX[i - 1]!
    if (dx <= EPS) continue
    const dBase = (coeffs[i]! - coeffs[i - 1]!) / dx
    const dScale = ((-1) ** i - (-1) ** (i - 1)) / dx
    num += dBase * dScale
    den += dScale * dScale
  }
  return den > EPS ? -num / den : 0
}

function resolveY0(
  method: TrapezoidMethod,
  means: IntervalMean[],
  nodesX: number[],
  coeffs: number[],
  samplePoints: PercentilePoint[],
): number {
  if (method === 'zero') return 0

  if (method === 'anchor') {
    return valueAtRank(samplePoints, nodesX[0] ?? 0) ?? 0
  }

  if (method === 'leastSquares') {
    const samples = means.flatMap(({ lo, hi }) =>
      samplePointsForInterval(samplePoints, lo, hi),
    )
    return resolveY0LeastSquares(samples, nodesX, coeffs)
  }

  return resolveY0MinOscillation(nodesX, coeffs)
}

/** Construit les nœuds de l'approximation conservant la moyenne sur chaque intervalle. */
export function buildMeanPreservingNodes(
  means: IntervalMean[],
  method: TrapezoidMethod,
  samplePoints: PercentilePoint[],
): MeanPreservingApproximation | null {
  if (means.length === 0) return null
  if (means.some((item) => item.mean === null || !Number.isFinite(item.mean))) return null

  const numericMeans = means.map((item) => item.mean!)
  const breakpoints = means.map((item) => item.hi)
  const nodesX = nodeXFromBreakpoints(breakpoints)
  const coeffs = buildAlternatingCoefficients(numericMeans)
  const y0 = resolveY0(method, means, nodesX, coeffs, samplePoints)

  const nodes: TrapezoidNode[] = nodesX.map((x, i) => ({
    x,
    y: coeffs[i]! + (-1) ** i * y0,
  }))

  return { nodes, means, y0, method }
}

/** Moyenne de l'approximation linéaire sur ]lo, hi] (doit valoir m_i). */
export function intervalMeanFromNodes(
  nodes: TrapezoidNode[],
  lo: number,
  hi: number,
): number | null {
  const yLo = nodes.find((n) => Math.abs(n.x - lo) < EPS)?.y
  const yHi = nodes.find((n) => Math.abs(n.x - hi) < EPS)?.y
  if (yLo === undefined || yHi === undefined) return null
  return (yLo + yHi) / 2
}

/** Trapèzes sous la ligne d'approximation (base = baseline, typiquement 0). */
export function trapezoidPolygons(
  nodes: TrapezoidNode[],
  baseline = 0,
): TrapezoidPolygon[] {
  const polygons: TrapezoidPolygon[] = []
  for (let i = 1; i < nodes.length; i += 1) {
    const prev = nodes[i - 1]!
    const curr = nodes[i]!
    polygons.push({
      lo: prev.x,
      hi: curr.x,
      yLo: prev.y,
      yHi: curr.y,
    })
  }
  void baseline
  return polygons
}

/** Point d'évaluation de l'approximation à l'abscisse x (pour tests). */
export function evaluateApproximation(
  x: number,
  nodes: TrapezoidNode[],
  means: IntervalMean[],
): number {
  const numericMeans = means.map((m) => m.mean!)
  const breakpoints = means.map((m) => m.hi)
  const nodesX = nodeXFromBreakpoints(breakpoints)
  const coeffs = buildAlternatingCoefficients(numericMeans)
  const y0 = nodes[0]?.y ?? 0
  return approxAtX(x, nodesX, coeffs, y0)
}
