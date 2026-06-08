import { describe, expect, it } from 'vitest'
import {
  buildVariableCode,
  findWidVariable,
  measureKind,
  WID_V1_VARIABLES,
} from '@src/data-sources/wid/widCodes'

describe('measureKind', () => {
  it('maps the leading letter to a measure kind', () => {
    expect(measureKind('ahweal')).toBe('average')
    expect(measureKind('aptinc')).toBe('average')
    expect(measureKind('thweal')).toBe('threshold')
    expect(measureKind('tptinc')).toBe('threshold')
    expect(measureKind('ghweal')).toBe('other')
    expect(measureKind('sptinc')).toBe('other')
  })

  it('is case-insensitive', () => {
    expect(measureKind('Ahweal')).toBe('average')
    expect(measureKind('Thweal')).toBe('threshold')
  })
})

describe('buildVariableCode', () => {
  it('joins sixlet / percentile / age / pop with underscores', () => {
    expect(buildVariableCode('ahweal', 'p90p91', '992', 'j')).toBe('ahweal_p90p91_992_j')
    expect(buildVariableCode('tptinc', 'p0p100', '999', 'i')).toBe('tptinc_p0p100_999_i')
  })
})

describe('findWidVariable', () => {
  it('finds a known V1 variable', () => {
    const v = findWidVariable('ahweal')
    expect(v).toBeDefined()
    expect(v?.kind).toBe('average')
    expect(v?.concept).toBe('Net personal wealth')
  })

  it('returns undefined for an unknown sixlet', () => {
    expect(findWidVariable('zzzzzz')).toBeUndefined()
  })
})

describe('WID_V1_VARIABLES', () => {
  it('pairs each concept with an average and a threshold variable', () => {
    const concepts = new Set(WID_V1_VARIABLES.map((v) => v.concept))
    for (const concept of concepts) {
      const kinds = WID_V1_VARIABLES.filter((v) => v.concept === concept).map((v) => v.kind)
      expect(kinds).toContain('average')
      expect(kinds).toContain('threshold')
    }
  })

  it('keeps sixlet/kind consistent', () => {
    for (const v of WID_V1_VARIABLES) {
      expect(measureKind(v.sixlet)).toBe(v.kind)
    }
  })
})
