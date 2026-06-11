import { describe, expect, it } from 'vitest'
import { parseProfileResponse } from '@src/data-sources/wid/widClient'

/** Minimal fixture mimicking the WID `countries-variables` response shape. */
function fixture() {
  return {
    'ahweal_p0p1_992_j': [
      { FR: { values: [[2020, -1000], [2021, -1200]] } },
    ],
    'ahweal_p50p51_992_j': [
      { FR: { values: [[2020, 50000], [2021, 52000]] } },
    ],
    'ahweal_p99p99.1_992_j': [
      { FR: { values: [[2021, 900000]] } },
    ],
  } as Record<string, unknown>
}

describe('parseProfileResponse', () => {
  it('extracts one row per percentile for the requested year', () => {
    const rows = parseProfileResponse(fixture(), 2021)
    expect(rows).toHaveLength(3)
    const byPct = Object.fromEntries(rows.map((r) => [r.percentile, r.value]))
    expect(byPct['p0p1']).toBe(-1200)
    expect(byPct['p50p51']).toBe(52000)
    expect(byPct['p99p99.1']).toBe(900000)
  })

  it('parses the rank from the full variable code', () => {
    const rows = parseProfileResponse(fixture(), 2021)
    const top = rows.find((r) => r.percentile === 'p99p99.1')!
    expect(top.rank).toBeCloseTo(99)
  })

  it('selects the correct year and skips missing ones', () => {
    const rows = parseProfileResponse(fixture(), 2020)
    // p99p99.1 has no 2020 value -> dropped
    expect(rows).toHaveLength(2)
    expect(rows.every((r) => r.year === 2020)).toBe(true)
  })

  it('returns an empty array for an empty or invalid response', () => {
    expect(parseProfileResponse({}, 2021)).toEqual([])
    expect(parseProfileResponse(null as unknown as Record<string, unknown>, 2021)).toEqual([])
  })

  it('ignores non-finite and non-numeric values', () => {
    const broken = {
      ahweal_p10p11_992_j: [{ FR: { values: [[2021, 'oops']] } }],
      ahweal_p20p21_992_j: [{ FR: { values: [[2021, null]] } }],
    } as unknown as Record<string, unknown>
    expect(parseProfileResponse(broken, 2021)).toEqual([])
  })

  it('accepts { y, v } objects from the live webservice', () => {
    const live = {
      ahweal_p50p51_992_j: [
        { FR: { values: [{ y: 2020, v: 50000 }, { y: 2021, v: 52000 }] } },
      ],
    } as Record<string, unknown>
    const rows = parseProfileResponse(live, 2021)
    expect(rows).toHaveLength(1)
    expect(rows[0]?.value).toBe(52000)
  })
})
