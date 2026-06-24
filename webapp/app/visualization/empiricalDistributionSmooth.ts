/**
 * Non-parametric smooth CDF / PDF from WID percentile knots via monotone PCHIP.
 * PDF is the derivative of the smoothed CDF (no assumed parametric law).
 */
import type { PercentilePoint } from '@domain/entities'
import type { AxisScale, RankAxisScale } from '~/visualization/axisScale'

export type SmoothDistributionMode = 'empirical' | 'smooth' | 'both'

export interface CdfKnot {
  x: number
  /** CDF value F(x) in [0, 1]. */
  f: number
}

export interface MonotonePchipSpline {
  /** Knot coordinates in spline space (x or log x). */
  xs: number[]
  fs: number[]
  /** Derivatives dF/du at knots. */
  ms: number[]
  logX: boolean
}

export interface ComputeCdfKnotsOptions {
  /** Anchor (x_min, 0) when the lowest knot has F > 0. */
  anchorZero?: boolean
  valueScale?: AxisScale
}

const EPS = 1e-12
const DEFAULT_SAMPLE_COUNT = 200

function clamp01(value: number): number {
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

/** Empirical CDF knots from percentile profile (threshold variables are rigorous). */
export function computeEmpiricalCdfKnots(
  points: PercentilePoint[],
  options: ComputeCdfKnotsOptions = {},
): CdfKnot[] {
  const valueScale = options.valueScale
  const ordered = [...points]
    .sort((a, b) => a.rank - b.rank)
    .filter((point) => {
      if (point.value === null || !Number.isFinite(point.value)) return false
      if (!Number.isFinite(point.rank) || point.rank < 0 || point.rank > 100) return false
      if (valueScale && !valueScale.acceptsRaw(point.value)) return false
      return true
    })

  const rankOrdered: CdfKnot[] = []
  let prevValue: number | null = null
  for (const point of ordered) {
    const x = point.value!
    if (prevValue !== null && x < prevValue - EPS) continue
    rankOrdered.push({ x, f: point.rank / 100 })
    prevValue = x
  }

  if (rankOrdered.length === 0) return []

  const byX = [...rankOrdered].sort((a, b) => a.x - b.x)
  const merged: CdfKnot[] = []
  for (const knot of byX) {
    const last = merged[merged.length - 1]
    if (last && Math.abs(knot.x - last.x) < EPS) {
      last.f = Math.max(last.f, knot.f)
    } else {
      merged.push({ x: knot.x, f: knot.f })
    }
  }

  if (options.anchorZero && merged.length > 0 && merged[0]!.f > EPS) {
    const minX = merged[0]!.x
    if (minX > 0) {
      // Anchor F = 0 strictly left of minX (required for monotone PCHIP / log u).
      const anchorX = minX * (1 - 1e-9)
      if (anchorX > 0) {
        merged.unshift({ x: anchorX, f: 0 })
      }
    }
  }

  return merged
}

/** PCHIP slopes (Fritsch–Carlson) preserving monotonicity when data are monotone. */
function pchipSlopes(xs: number[], fs: number[]): number[] {
  const n = xs.length
  if (n < 2) return fs.map(() => 0)

  const h = new Array(n - 1)
  const delta = new Array(n - 1)
  for (let i = 0; i < n - 1; i += 1) {
    h[i] = xs[i + 1]! - xs[i]!
    delta[i] = h[i]! > EPS ? (fs[i + 1]! - fs[i]!) / h[i]! : 0
  }

  const ms = new Array(n).fill(0)

  for (let i = 1; i < n - 1; i += 1) {
    if (delta[i - 1]! * delta[i]! <= 0) {
      ms[i] = 0
    } else {
      const w1 = 2 * h[i]! + h[i - 1]!
      const w2 = h[i]! + 2 * h[i - 1]!
      ms[i] = (w1 + w2) / (w1 / delta[i - 1]! + w2 / delta[i]!)
    }
  }

  ms[0] = ((2 * h[0]! + h[1]!) * delta[0]! - h[0]! * delta[1]!) / (h[0]! + h[1]!)
  if (ms[0] * delta[0]! < 0) ms[0] = 0
  else if (delta[0]! * delta[1]! < 0 && Math.abs(ms[0]) > 3 * Math.abs(delta[0]!)) {
    ms[0] = 3 * delta[0]!
  }

  const last = n - 1
  ms[last] = ((2 * h[last - 1]! + h[last - 2]!) * delta[last - 1]!
    - h[last - 1]! * delta[last - 2]!) / (h[last - 1]! + h[last - 2]!)
  if (ms[last] * delta[last - 1]! < 0) ms[last] = 0
  else if (delta[last - 1]! * delta[last - 2]! < 0
    && Math.abs(ms[last]) > 3 * Math.abs(delta[last - 1]!)) {
    ms[last] = 3 * delta[last - 1]!
  }

  return ms
}

export function buildMonotonePchipSpline(
  knots: CdfKnot[],
  logX = false,
): MonotonePchipSpline | null {
  if (knots.length < 2) return null

  const xs: number[] = []
  const fs: number[] = []
  for (const knot of knots) {
    const u = logX
      ? (knot.x > 0 ? Math.log(knot.x) : null)
      : knot.x
    if (u === null || !Number.isFinite(u)) continue
    xs.push(u)
    fs.push(knot.f)
  }

  if (xs.length < 2) return null
  for (let i = 1; i < xs.length; i += 1) {
    if (xs[i]! <= xs[i - 1]! + EPS) return null
  }

  const ms = pchipSlopes(xs, fs)
  return { xs, fs, ms, logX }
}

function findInterval(xs: number[], u: number): number {
  const n = xs.length
  if (u <= xs[0]!) return 0
  if (u >= xs[n - 1]!) return n - 2
  for (let i = 0; i < n - 1; i += 1) {
    if (u <= xs[i + 1]!) return i
  }
  return n - 2
}

/** Evaluate F and dF/du at spline coordinate u. */
function evaluateAtSplineCoord(
  spline: MonotonePchipSpline,
  u: number,
): { f: number, dFdu: number } | null {
  const { xs, fs, ms } = spline
  const n = xs.length
  if (n < 2 || !Number.isFinite(u)) return null

  const i = findInterval(xs, u)
  const x0 = xs[i]!
  const x1 = xs[i + 1]!
  const h = x1 - x0
  if (h <= EPS) return { f: fs[i]!, dFdu: ms[i]! }

  const t = (u - x0) / h
  const t2 = t * t
  const t3 = t2 * t
  const y0 = fs[i]!
  const y1 = fs[i + 1]!
  const m0 = ms[i]!
  const m1 = ms[i + 1]!

  const h00 = 2 * t3 - 3 * t2 + 1
  const h10 = t3 - 2 * t2 + t
  const h01 = -2 * t3 + 3 * t2
  const h11 = t3 - t2

  const f = h00 * y0 + h10 * h * m0 + h01 * y1 + h11 * h * m1

  const dh00 = 6 * t2 - 6 * t
  const dh10 = 3 * t2 - 4 * t + 1
  const dh01 = -6 * t2 + 6 * t
  const dh11 = 3 * t2 - 2 * t
  const dFdu = (dh00 * y0 + dh10 * h * m0 + dh01 * y1 + dh11 * h * m1) / h

  return { f, dFdu }
}

function naturalXFromSplineCoord(spline: MonotonePchipSpline, u: number): number | null {
  if (!spline.logX) return u
  const x = Math.exp(u)
  return Number.isFinite(x) ? x : null
}

export function evaluateCdf(spline: MonotonePchipSpline, x: number): number | null {
  if (!Number.isFinite(x)) return null
  const u = spline.logX ? (x > 0 ? Math.log(x) : null) : x
  if (u === null) return null
  const evalResult = evaluateAtSplineCoord(spline, u)
  if (!evalResult) return null
  return clamp01(evalResult.f)
}

/** PDF f(x) = dF/dx in natural wealth units. */
export function evaluatePdf(spline: MonotonePchipSpline, x: number): number | null {
  if (!Number.isFinite(x)) return null
  const u = spline.logX ? (x > 0 ? Math.log(x) : null) : x
  if (u === null) return null
  const evalResult = evaluateAtSplineCoord(spline, u)
  if (!evalResult) return null

  const dFdx = spline.logX
    ? evalResult.dFdu / x
    : evalResult.dFdu

  if (!Number.isFinite(dFdx) || dFdx <= 0) return null
  return dFdx
}

export interface SampleSmoothSeriesOptions {
  sampleCount?: number
  logX?: boolean
}

function wealthSampleGrid(knots: CdfKnot[], sampleCount: number, logX: boolean): number[] {
  const xs = knots.map((k) => k.x).filter((x) => Number.isFinite(x))
  if (xs.length === 0) return []

  const lo = Math.min(...xs)
  const hi = Math.max(...xs)
  if (hi - lo < EPS) return [lo]

  const count = Math.max(2, sampleCount)
  const grid: number[] = []

  if (logX && lo > 0 && hi > 0) {
    const logLo = Math.log(lo)
    const logHi = Math.log(hi)
    for (let i = 0; i < count; i += 1) {
      const t = i / (count - 1)
      grid.push(Math.exp(logLo + t * (logHi - logLo)))
    }
  } else {
    for (let i = 0; i < count; i += 1) {
      const t = i / (count - 1)
      grid.push(lo + t * (hi - lo))
    }
  }

  return grid
}

export function buildSmoothDistributionSpline(
  points: PercentilePoint[],
  options: { logX?: boolean } = {},
): MonotonePchipSpline | null {
  const knots = computeEmpiricalCdfKnots(points, { anchorZero: true })
  return buildMonotonePchipSpline(knots, options.logX ?? false)
}

export function sampleSmoothCdfSeries(
  spline: MonotonePchipSpline,
  valueScale: AxisScale,
  rankScale: RankAxisScale,
  options: SampleSmoothSeriesOptions = {},
): Array<[number, number]> {
  const knots = spline.xs.map((u, i) => ({
    x: naturalXFromSplineCoord(spline, u) ?? u,
    f: spline.fs[i]!,
  }))
  const grid = wealthSampleGrid(knots, options.sampleCount ?? DEFAULT_SAMPLE_COUNT, options.logX ?? spline.logX)
  const pairs: Array<[number, number]> = []

  for (const x of grid) {
    const f = evaluateCdf(spline, x)
    if (f === null) continue
    const xPlot = valueScale.toPlotCoord(x)
    const rankPlot = rankScale.toPlotCoord(f * 100)
    if (xPlot === null || rankPlot === null) continue
    pairs.push([xPlot, rankPlot])
  }

  return pairs
}

export function sampleSmoothPdfSeries(
  spline: MonotonePchipSpline,
  valueScale: AxisScale,
  densityScale: AxisScale,
  options: SampleSmoothSeriesOptions = {},
): Array<[number, number]> {
  const knots = spline.xs.map((u, i) => ({
    x: naturalXFromSplineCoord(spline, u) ?? u,
    f: spline.fs[i]!,
  }))
  const grid = wealthSampleGrid(knots, options.sampleCount ?? DEFAULT_SAMPLE_COUNT, options.logX ?? spline.logX)
  const pairs: Array<[number, number]> = []

  for (const x of grid) {
    const pdf = evaluatePdf(spline, x)
    if (pdf === null) continue
    const xPlot = valueScale.toPlotCoord(x)
    const densityPlot = densityScale.toPlotCoord(pdf)
    if (xPlot === null || densityPlot === null) continue
    pairs.push([xPlot, densityPlot])
  }

  return pairs
}

/** Numerical integral of smooth PDF from x0 to x1 (for tests). */
export function integrateSmoothPdf(
  spline: MonotonePchipSpline,
  x0: number,
  x1: number,
  steps = 500,
): number | null {
  if (!Number.isFinite(x0) || !Number.isFinite(x1) || x1 <= x0) return null
  const lo = x0
  const hi = x1
  let sum = 0
  for (let i = 0; i < steps; i += 1) {
    const a = lo + (i / steps) * (hi - lo)
    const b = lo + ((i + 1) / steps) * (hi - lo)
    const fa = evaluatePdf(spline, a)
    const fb = evaluatePdf(spline, b)
    if (fa === null || fb === null) continue
    sum += (fa + fb) * 0.5 * (b - a)
  }
  return sum
}
