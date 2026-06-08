/**
 * WID g-percentiles helpers.
 *
 * WID encodes the distribution as 127 "generalized percentiles" (g-percentiles)
 * written `pXX` or `pXXpYY` where XX/YY are the lower/upper bounds in percent
 * (decimals allowed, e.g. `p99.9p99.91`). They MUST be ordered by parsed rank,
 * never alphabetically (`p100` would sort before `p99.9`).
 *
 * See spec/version1.md (Les 127 g-percentiles) and B4 (tri des percentiles).
 */

/**
 * Parse the lower bound (rank, in percent) of a WID percentile code.
 * `p90p91` -> 90, `p99.9p99.91` -> 99.9, `p50` -> 50.
 * Returns NaN for codes that cannot be parsed.
 */
export function parsePercentileRank(percentile: string): number {
  if (!percentile) return Number.NaN
  const match = percentile.trim().match(/^p(\d+(?:\.\d+)?)/i)
  if (!match) return Number.NaN
  return Number.parseFloat(match[1]!)
}

/**
 * Parse the upper bound of a WID percentile code.
 * `p90p91` -> 91, `p50` -> 50 (single-bound codes are treated as points).
 */
export function parsePercentileUpper(percentile: string): number {
  if (!percentile) return Number.NaN
  const match = percentile.trim().match(/^p\d+(?:\.\d+)?p(\d+(?:\.\d+)?)/i)
  if (match) return Number.parseFloat(match[1]!)
  return parsePercentileRank(percentile)
}

/** Sort percentile codes by their parsed lower bound (ascending). */
export function sortPercentileCodes(codes: string[]): string[] {
  return [...codes].sort((a, b) => parsePercentileRank(a) - parsePercentileRank(b))
}

/**
 * Build the 127 standard WID g-percentiles, ordered by rank:
 * - p0p1 … p98p99            (99 wide brackets, 0–99 %)
 * - p99p99.1 … p99.8p99.9    (top 1 % zoom)
 * - p99.9p99.91 … p99.98p99.99 (top 0.1 % zoom)
 * - p99.99p99.991 … p99.999p100 (top 0.01 % zoom)
 */
export function buildGPercentiles(): string[] {
  const codes: string[] = []
  const fmt = (n: number) => Number(n.toFixed(3)).toString()

  for (let i = 0; i < 99; i++) {
    codes.push(`p${i}p${i + 1}`)
  }
  // top 1 % : 99 -> 99.9 by 0.1
  for (let i = 0; i < 9; i++) {
    const lo = 99 + i * 0.1
    const hi = 99 + (i + 1) * 0.1
    codes.push(`p${fmt(lo)}p${fmt(hi)}`)
  }
  // top 0.1 % : 99.9 -> 99.99 by 0.01
  for (let i = 0; i < 9; i++) {
    const lo = 99.9 + i * 0.01
    const hi = 99.9 + (i + 1) * 0.01
    codes.push(`p${fmt(lo)}p${fmt(hi)}`)
  }
  // top 0.01 % : 99.99 -> 100 by 0.001
  for (let i = 0; i < 10; i++) {
    const lo = 99.99 + i * 0.001
    const hi = i === 9 ? 100 : 99.99 + (i + 1) * 0.001
    codes.push(`p${fmt(lo)}p${fmt(hi)}`)
  }

  return codes
}
