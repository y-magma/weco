import { describe, expect, it } from 'vitest'
import {
  buildVariableCode,
  expectedProfilePointCount,
  findWidVariable,
  knownParamCombosForVariable,
  measureKind,
  profilePercentilesFor,
  profileYearProbePercentiles,
  supportsDistributionAnalytics,
  thresholdVariableFor,
  WID_PROFILE_VARIABLES,
  WID_SCALAR_PERCENTILE,
  WID_STRICT_DISTRIBUTION_VARIABLES,
} from '@domain/catalog/widCodes'

describe('measureKind', () => {
  it('maps the leading letter to a measure kind', () => {
    expect(measureKind('ahweal')).toBe('average')
    expect(measureKind('aptinc')).toBe('average')
    expect(measureKind('thweal')).toBe('threshold')
    expect(measureKind('tptinc')).toBe('threshold')
    expect(measureKind('shweal')).toBe('share')
    expect(measureKind('sptinc')).toBe('share')
    expect(measureKind('ghweal')).toBe('gini')
    expect(measureKind('gptinc')).toBe('gini')
    expect(measureKind('lpfcar')).toBe('groupLevel')
  })

  it('is case-insensitive', () => {
    expect(measureKind('Ahweal')).toBe('average')
    expect(measureKind('Thweal')).toBe('threshold')
  })
})

describe('profilePercentilesFor', () => {
  it('requests a single aggregate percentile for Gini indicators', () => {
    expect(profilePercentilesFor('gptinc')).toEqual([WID_SCALAR_PERCENTILE])
    expect(profilePercentilesFor('ghweal')).toEqual([WID_SCALAR_PERCENTILE])
    expect(expectedProfilePointCount('gptinc')).toBe(1)
  })

  it('requests the full g-percentile grid for distributional indicators', () => {
    expect(profilePercentilesFor('ahweal')).toHaveLength(127)
    expect(profilePercentilesFor('sptinc')).toHaveLength(127)
    expect(profileYearProbePercentiles('ahweal')).toEqual(['p50p51', 'p0p1', 'p90p100'])
    expect(profileYearProbePercentiles('gptinc')).toEqual([WID_SCALAR_PERCENTILE])
  })
})

describe('supportsDistributionAnalytics', () => {
  it('allows CDF/PDF/Lorenz only for average and threshold series', () => {
    expect(supportsDistributionAnalytics('ahweal')).toBe(true)
    expect(supportsDistributionAnalytics('tpllin')).toBe(true)
    expect(supportsDistributionAnalytics('sptinc')).toBe(false)
    expect(supportsDistributionAnalytics('gptinc')).toBe(false)
    expect(supportsDistributionAnalytics('lpfcar')).toBe(true)
  })
})

describe('WID_STRICT_DISTRIBUTION_VARIABLES', () => {
  it('includes threshold variables and group-level carbon without t… twins', () => {
    const sixlets = WID_STRICT_DISTRIBUTION_VARIABLES.map((v) => v.sixlet)
    expect(sixlets).toContain('thweal')
    expect(sixlets).toContain('lpfcar')
    expect(sixlets).not.toContain('ahweal')
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
    expect(v?.concept).toBe('hweal')
  })

  it('finds share, Gini and labor/capital income variables', () => {
    expect(findWidVariable('sptinc')?.kind).toBe('share')
    expect(findWidVariable('ghweal')?.kind).toBe('gini')
    expect(findWidVariable('apllin')?.concept).toBe('pllin')
    expect(findWidVariable('tpkkin')?.concept).toBe('pkkin')
  })

  it('returns undefined for an unknown sixlet', () => {
    expect(findWidVariable('zzzzzz')).toBeUndefined()
  })
})

describe('thresholdVariableFor', () => {
  it('maps an average variable to its threshold pair', () => {
    expect(thresholdVariableFor('ahweal')).toBe('thweal')
    expect(thresholdVariableFor('aptinc')).toBe('tptinc')
    expect(thresholdVariableFor('apllin')).toBe('tpllin')
    expect(thresholdVariableFor('apkkin')).toBe('tpkkin')
  })

  it('keeps a threshold or group-level variable unchanged', () => {
    expect(thresholdVariableFor('thweal')).toBe('thweal')
    expect(thresholdVariableFor('tptinc')).toBe('tptinc')
    expect(thresholdVariableFor('lpfcar')).toBe('lpfcar')
  })

})

describe('WID_PROFILE_VARIABLES', () => {
  it('pairs each income/wealth concept with an average and a threshold variable', () => {
    const distributional = WID_PROFILE_VARIABLES.filter(
      (v) => (v.group === 'income' || v.group === 'wealth') && v.kind !== 'share' && v.kind !== 'gini',
    )
    const concepts = new Set(distributional.map((v) => v.concept))
    for (const concept of concepts) {
      const kinds = distributional.filter((v) => v.concept === concept).map((v) => v.kind)
      expect(kinds).toContain('average')
      expect(kinds).toContain('threshold')
    }
  })

  it('exposes share and Gini indicators for patrimoine and revenu', () => {
    const sixlets = WID_PROFILE_VARIABLES.map((v) => v.sixlet)
    expect(sixlets).toContain('shweal')
    expect(sixlets).toContain('sptinc')
    expect(sixlets).toContain('ghweal')
    expect(sixlets).toContain('gptinc')
  })

  it('exposes labor and capital income average/threshold pairs', () => {
    const sixlets = WID_PROFILE_VARIABLES.map((v) => v.sixlet)
    expect(sixlets).toEqual(expect.arrayContaining(['apllin', 'tpllin', 'apkkin', 'tpkkin']))
  })

  it('includes the carbon footprint variable as group-level', () => {
    const carbonVars = WID_PROFILE_VARIABLES.filter((v) => v.group === 'carbon')
    expect(carbonVars.map((v) => v.sixlet)).toContain('lpfcar')
    for (const v of carbonVars) {
      expect(v.kind).toBe('groupLevel')
      expect(v.unit).toMatch(/tCO/)
    }
  })

  it('exposes group defaults for param resolution', () => {
    expect(knownParamCombosForVariable('ahweal')[0]).toEqual({ age: '992', pop: 'j' })
    expect(knownParamCombosForVariable('apllin')[0]).toEqual({ age: '992', pop: 'j' })
    expect(knownParamCombosForVariable('lpfcar')[0]).toEqual({ age: '999', pop: 'i' })
  })

  it('keeps sixlet/kind consistent', () => {
    for (const v of WID_PROFILE_VARIABLES) {
      expect(measureKind(v.sixlet)).toBe(v.kind)
    }
  })
})
