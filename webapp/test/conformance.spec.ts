import { describe, expect, it } from 'vitest'
import { buildGPercentiles } from '@src/data-sources/wid/percentiles'
import {
  compareProfiles,
  compareProfilesStrict,
  valuesMatch,
} from '@src/data-sources/wid/conformance'

describe('compareProfiles', () => {
  it('reports exact matches', () => {
    const points = [
      { percentile: 'p0p1', rank: 0, value: 10 },
      { percentile: 'p1p2', rank: 1, value: 20 },
    ]
    const result = compareProfiles(points, points)
    expect(result.ok).toBe(true)
    expect(result.matched).toBe(2)
    expect(result.mismatches).toHaveLength(0)
  })

  it('detects value differences beyond tolerance', () => {
    const reference = [{ percentile: 'p50p51', rank: 50, value: 100 }]
    const api = [{ percentile: 'p50p51', rank: 50, value: 200 }]
    const result = compareProfiles(reference, api)
    expect(result.ok).toBe(false)
    expect(result.mismatches[0]?.kind).toBe('value_diff')
  })

  it('treats small drift as equal within default tolerance', () => {
    expect(valuesMatch(1000, 1003)).toBe(true)
    expect(valuesMatch(1000, 1010)).toBe(false)
  })

  it('accepts WID vintage drift on FR ahweal p99.999p100 2021', () => {
    // CSV dump vs live API (June 2026) — not a parsing bug.
    expect(valuesMatch(1_345_288_839.4, 1_345_288_900.4)).toBe(true)
  })
})

describe('compareProfilesStrict', () => {
  const order = buildGPercentiles()

  it('counts strict differences separately from tolerant matches', () => {
    const reference = [
      { percentile: 'p0p1', rank: 0, value: 10 },
      { percentile: 'p1p2', rank: 1, value: 20 },
      { percentile: 'p2p3', rank: 2, value: 30 },
    ]
    const api = [
      { percentile: 'p0p1', rank: 0, value: 10 },
      { percentile: 'p1p2', rank: 1, value: 21 },
      { percentile: 'p2p3', rank: 2, value: 30 },
    ]
    const result = compareProfilesStrict(reference, api, order)
    expect(result.exactMatchCount).toBe(2)
    expect(result.strictDiffCount).toBe(1)
    expect(result.rows.find((r) => r.percentile === 'p1p2')?.status).toBe('strict_diff')
  })
})
