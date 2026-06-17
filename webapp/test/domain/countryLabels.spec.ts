import { describe, expect, it } from 'vitest'
import { countryDisplayName, formatCountryLabel } from '@domain/catalog/countryLabels'

describe('formatCountryLabel', () => {
  it('shows WID country name with code', () => {
    expect(formatCountryLabel('FR')).toBe('France (FR)')
    expect(formatCountryLabel('DE')).toBe('Germany (DE)')
    expect(formatCountryLabel('US')).toBe('USA (US)')
  })

  it('shows WID subregion name with code', () => {
    expect(formatCountryLabel('US-CA')).toBe('California (US-CA)')
  })

  it('shows French label for historical WID codes', () => {
    expect(formatCountryLabel('SU')).toBe('URSS (SU)')
  })
})

describe('countryDisplayName', () => {
  it('normalises case', () => {
    expect(countryDisplayName(' fr ')).toBe('France')
  })
})
