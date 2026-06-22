import { describe, expect, it } from 'vitest'
import {
  buildParamAvailability,
  describeCodeAdjustment,
  describeYearAdjustment,
  intersectParamAvailability,
  intersectYears,
  preferredDefaultsForVariable,
  resolveWidParams,
} from '@domain/services/widParamAvailability'

const wealthAvailability = buildParamAvailability([
  { age: '992', pop: 'j' },
  { age: '992', pop: 'i' },
])

const carbonAvailability = buildParamAvailability([
  { age: '999', pop: 'i' },
])

describe('preferredDefaultsForVariable', () => {
  it('prefers 992/j for wealth variables', () => {
    expect(preferredDefaultsForVariable('ahweal')[0]).toEqual({ age: '992', pop: 'j' })
  })

  it('prefers 999/i for carbon variables', () => {
    expect(preferredDefaultsForVariable('lpfcar')[0]).toEqual({ age: '999', pop: 'i' })
  })
})

describe('resolveWidParams', () => {
  it('applies group defaults on variableChange', () => {
    const resolved = resolveWidParams({
      current: { countryCode: 'FR', age: '992', pop: 'j', year: 2010 },
      availability: carbonAvailability,
      availableYears: [2020, 2019],
      availableCountries: ['FR', 'US'],
      sixlet: 'lpfcar',
      mode: 'variableChange',
    })
    expect(resolved).toEqual({
      countryCode: 'FR',
      age: '999',
      pop: 'i',
      year: 2020,
    })
  })

  it('keeps valid age/pop on clamp mode', () => {
    const resolved = resolveWidParams({
      current: { countryCode: 'FR', age: '992', pop: 'i', year: 2019 },
      availability: wealthAvailability,
      availableYears: [2020, 2019],
      availableCountries: ['FR'],
      sixlet: 'ahweal',
      mode: 'clamp',
    })
    expect(resolved.age).toBe('992')
    expect(resolved.pop).toBe('i')
    expect(resolved.year).toBe(2019)
  })

  it('clamps invalid year to most recent', () => {
    const resolved = resolveWidParams({
      current: { countryCode: 'FR', age: '992', pop: 'j', year: 1990 },
      availability: wealthAvailability,
      availableYears: [2020, 2019],
      sixlet: 'ahweal',
      mode: 'clamp',
    })
    expect(resolved.year).toBe(2020)
  })

  it('keeps year on variableChange when still available', () => {
    const resolved = resolveWidParams({
      current: { countryCode: 'FR', age: '992', pop: 'j', year: 2019 },
      availability: wealthAvailability,
      availableYears: [2021, 2020, 2019],
      sixlet: 'ahweal',
      mode: 'variableChange',
    })
    expect(resolved.year).toBe(2019)
  })

  it('falls back to FR when country unavailable', () => {
    const resolved = resolveWidParams({
      current: { countryCode: 'XX', age: '992', pop: 'j' },
      availability: wealthAvailability,
      availableCountries: ['FR', 'US'],
      sixlet: 'ahweal',
      mode: 'clamp',
    })
    expect(resolved.countryCode).toBe('FR')
  })
})

describe('describeYearAdjustment', () => {
  it('returns a warning when the year was clamped', () => {
    expect(describeYearAdjustment(2010, 2020, [2020, 2019])).toMatch(
      /2010.*2020/,
    )
  })

  it('returns null when the year is unchanged', () => {
    expect(describeYearAdjustment(2020, 2020, [2020, 2019])).toBeNull()
  })

  it('describes age or pop code changes', () => {
    expect(describeCodeAdjustment('Âge', '992', '999', 'Tous âges')).toMatch(/992.*Tous âges/)
  })
})

describe('intersectParamAvailability', () => {
  it('keeps only common combos', () => {
    const secondary = buildParamAvailability([
      { age: '992', pop: 'j' },
      { age: '999', pop: 'i' },
    ])
    const result = intersectParamAvailability(wealthAvailability, secondary)
    expect(result.combos).toEqual([{ age: '992', pop: 'j' }])
  })
})

describe('intersectYears', () => {
  it('returns common years most recent first', () => {
    expect(intersectYears([2021, 2020, 2019], [2020, 2019, 2018])).toEqual([2020, 2019])
  })
})
