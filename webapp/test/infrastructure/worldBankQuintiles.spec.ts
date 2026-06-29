import { describe, expect, it } from 'vitest'
import { wdiQuintileProfileYears } from '@infrastructure/data-sources/worldbank/worldBankQuintiles'

describe('wdiQuintileProfileYears', () => {
  it('returns intersection of years across quintile series', () => {
    const years = wdiQuintileProfileYears([
      [{ year: 2021, value: 5.1 }, { year: 2020, value: 5.0 }],
      [{ year: 2021, value: 9.2 }, { year: 2019, value: 9.0 }],
      [{ year: 2021, value: 14.3 }],
      [{ year: 2021, value: 22.4 }],
      [{ year: 2021, value: 49.0 }, { year: 2020, value: 48.5 }],
    ])

    expect(years).toEqual([2021])
  })

  it('returns empty when any quintile series is empty', () => {
    expect(wdiQuintileProfileYears([[], [{ year: 2021, value: 1 }]])).toEqual([])
  })
})
