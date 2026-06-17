import { describe, expect, it } from 'vitest'
import {
  linearRankScale,
  linearValueScale,
  rankTopLogScale,
  resolveProfileAxisScales,
  strictLogValueScale,
  symlogValueScale,
} from '~/visualization/axisScale'
import { symlogToCoord } from '~/visualization/symlogScale'

describe('resolveProfileAxisScales', () => {
  it('uses symlog on wealth Y in standard profile when logScaleY is on', () => {
    const scales = resolveProfileAxisScales({
      logScaleX: false,
      logScaleY: true,
      populationDensity: false,
      showPdf: false,
    })
    expect(scales.value).toBe(symlogValueScale)
    expect(scales.rank).toBe(linearRankScale)
  })

  it('uses rank top log on X when logScaleX is on in standard profile', () => {
    const scales = resolveProfileAxisScales({
      logScaleX: true,
      logScaleY: false,
      populationDensity: false,
      showPdf: false,
    })
    expect(scales.rank).toBe(rankTopLogScale)
    expect(scales.value).toBe(linearValueScale)
  })

  it('uses strict log on wealth X in population density when logScaleX is on', () => {
    const scales = resolveProfileAxisScales({
      logScaleX: true,
      logScaleY: false,
      populationDensity: true,
      showPdf: false,
    })
    expect(scales.value).toBe(strictLogValueScale)
  })
})

describe('symlogValueScale', () => {
  it('keeps negative raw values in plot space', () => {
    expect(symlogValueScale.toPlotCoord(-1000)).toBeCloseTo(symlogToCoord(-1000)!)
    expect(symlogValueScale.toDisplayValue(symlogToCoord(-1000)!)).toBeCloseTo(-1000)
  })
})
