import type { PercentileProfile } from '@domain/entities'

/** One scatter point: a single percentile shared by two variables. */
export interface ProfileScatterPoint {
  percentile: string
  rank: number
  /** Value of the X variable at this percentile. */
  x: number
  /** Value of the Y variable at this percentile. */
  y: number
}

/**
 * Join two WID percentile profiles on their percentile code, producing one
 * scatter point per shared percentile. See spec/version1.md (graphe #6) :
 * un point = un percentile, mêmes `age`/`pop`.
 *
 * Only percentiles present in BOTH profiles with non-null values are kept.
 * Points are ordered by rank.
 */
export function joinProfilesByPercentile(
  xProfile: PercentileProfile,
  yProfile: PercentileProfile,
): ProfileScatterPoint[] {
  const yByPercentile = new Map<string, number>()
  for (const point of yProfile.points) {
    if (point.value !== null && !Number.isNaN(point.value)) {
      yByPercentile.set(point.percentile, point.value)
    }
  }

  const points: ProfileScatterPoint[] = []
  for (const point of xProfile.points) {
    if (point.value === null || Number.isNaN(point.value)) continue
    const y = yByPercentile.get(point.percentile)
    if (y === undefined) continue
    points.push({
      percentile: point.percentile,
      rank: point.rank,
      x: point.value,
      y,
    })
  }

  return points.sort((a, b) => a.rank - b.rank)
}
