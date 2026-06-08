import { describe, expect, it } from 'vitest'
import { buildActiveCalculationHelp } from '@src/charts/profileHelp'
import type { PercentileProfile } from '@src/domain/types'

const baseProfile: PercentileProfile = {
  id: 'FR-thweal-992-j-2021',
  country: 'FR',
  variable: 'thweal',
  year: 2021,
  age: '992',
  pop: 'j',
  kind: 'threshold',
  unit: 'EUR',
  label: 'FR · Patrimoine seuil (2021)',
  sample: true,
  points: [{ percentile: 'p0p1', rank: 0, value: 1000 }],
}

describe('buildActiveCalculationHelp', () => {
  it('describes the default profile view', () => {
    const help = buildActiveCalculationHelp({
      chartType: 'line',
      logScaleX: false,
      logScaleY: false,
      populationDensity: false,
      probabilityDensity: false,
      profile: baseProfile,
    })
    expect(help.title).toBe('Comment sont calculées mes données ?')
    expect(help.paragraphs.some((p) => p.includes('profil par centile'))).toBe(true)
  })

  it('describes probability density when enabled', () => {
    const help = buildActiveCalculationHelp({
      chartType: 'bar',
      logScaleX: false,
      logScaleY: false,
      populationDensity: true,
      probabilityDensity: true,
      profile: baseProfile,
    })
    expect(help.paragraphs.some((p) => p.includes('densité de probabilité'))).toBe(true)
    expect(help.paragraphs.some((p) => p.includes('Δ(rang'))).toBe(true)
  })
})
