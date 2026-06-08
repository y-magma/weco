import { describe, expect, it } from 'vitest'
import { getSampleProfile } from '@src/data-sources/wid/sampleData'

describe('getSampleProfile', () => {
  const profile = getSampleProfile('FR', 'ahweal', 2021, '992', 'j')

  it('returns the 127 g-percentiles ordered by rank', () => {
    expect(profile.points).toHaveLength(127)
    const ranks = profile.points.map((p) => p.rank)
    for (let i = 1; i < ranks.length; i++) {
      expect(ranks[i]).toBeGreaterThan(ranks[i - 1]!)
    }
  })

  it('is flagged as sample data', () => {
    expect(profile.sample).toBe(true)
  })

  it('carries the variable metadata', () => {
    expect(profile.country).toBe('FR')
    expect(profile.variable).toBe('ahweal')
    expect(profile.year).toBe(2021)
    expect(profile.kind).toBe('average')
    expect(profile.unit).toBeDefined()
  })

  it('produces net debt (negative values) at the bottom of the wealth distribution', () => {
    const bottom = profile.points[0]!
    expect(bottom.value).not.toBeNull()
    expect(bottom.value as number).toBeLessThan(0)
  })

  it('grows towards the top of the distribution', () => {
    const top = profile.points[profile.points.length - 1]!.value as number
    const median = profile.points.find((p) => p.rank === 50)!.value as number
    expect(top).toBeGreaterThan(median)
  })

  it('differs across years (year selector visibly changes the data)', () => {
    const p2000 = getSampleProfile('FR', 'ahweal', 2000, '992', 'j')
    const p2020 = getSampleProfile('FR', 'ahweal', 2020, '992', 'j')
    const top2000 = p2000.points.at(-1)!.value as number
    const top2020 = p2020.points.at(-1)!.value as number
    expect(top2020).not.toBe(top2000)
  })

  it('scales values by country', () => {
    const fr = getSampleProfile('FR', 'ahweal', 2021, '992', 'j').points.at(-1)!.value as number
    const us = getSampleProfile('US', 'ahweal', 2021, '992', 'j').points.at(-1)!.value as number
    expect(us).toBeGreaterThan(fr)
  })

  it('marks threshold variables with the threshold kind', () => {
    const t = getSampleProfile('FR', 'thweal', 2021, '992', 'j')
    expect(t.kind).toBe('threshold')
  })
})
