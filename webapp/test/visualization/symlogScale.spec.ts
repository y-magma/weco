import { describe, expect, it } from 'vitest'
import {
  formatSymlogTick,
  symlogFromCoord,
  symlogToCoord,
} from '~/visualization/symlogScale'

describe('symlogScale', () => {
  it('maps f(x) = sign(x)*log10(1+|x|)', () => {
    expect(symlogToCoord(0)).toBe(0)
    expect(symlogToCoord(9)).toBeCloseTo(1)
    expect(symlogToCoord(-9)).toBeCloseTo(-1)
  })

  it('inverts coordinates back to real values', () => {
    expect(symlogFromCoord(symlogToCoord(-1000)!)).toBeCloseTo(-1000)
    expect(symlogFromCoord(symlogToCoord(200000)!)).toBeCloseTo(200000)
  })

  it('formats ticks as real values', () => {
    expect(formatSymlogTick(1)).toBe('9')
  })
})
