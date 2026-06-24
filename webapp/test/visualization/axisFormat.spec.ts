import { describe, expect, it } from 'vitest'
import { formatCompactAxisValue, formatFractionAxisValue } from '~/visualization/axisFormat'

describe('formatFractionAxisValue', () => {
  it('formats small fractional shares without rounding to zero', () => {
    expect(formatFractionAxisValue(0)).toBe('0')
    expect(formatFractionAxisValue(0.001)).toBe('0,001')
    expect(formatFractionAxisValue(0.01)).toBe('0,01')
    expect(formatFractionAxisValue(0.05)).toBe('0,05')
    expect(formatFractionAxisValue(0.15)).toBe('0,15')
  })
})

describe('formatCompactAxisValue', () => {
  it('formats WID-style log axis ticks', () => {
    expect(formatCompactAxisValue(0)).toBe('0')
    expect(formatCompactAxisValue(0.05)).toBe('0,05')
    expect(formatCompactAxisValue(1000)).toBe('1000')
    expect(formatCompactAxisValue(10_000)).toBe('10k')
    expect(formatCompactAxisValue(100_000)).toBe('100k')
    expect(formatCompactAxisValue(1_000_000)).toBe('1M')
    expect(formatCompactAxisValue(10_000_000)).toBe('10M')
    expect(formatCompactAxisValue(100_000_000)).toBe('100M')
    expect(formatCompactAxisValue(1_000_000_000)).toBe('1B')
  })
})
