import { describe, expect, it } from 'vitest'
import {
  fractionValueScale,
  linearRankScale,
  linearValueScale,
  rankTopLogScale,
  resolveProfileAxisScales,
  strictLogFractionScale,
  strictLogValueScale,
  symlogValueScale,
} from '~/visualization/axisScale'

describe('resolveProfileAxisScales', () => {
  it('uses symlog on wealth Y in standard profile when logScaleY is on', () => {
    const scales = resolveProfileAxisScales({
      logScaleX: false,
      logScaleY: true,
      empiricalCdf: false,
      showPdf: false,
    })
    expect(scales.value).toBe(symlogValueScale)
    expect(scales.rank).toBe(linearRankScale)
  })

  it('uses fraction scale for share variables', () => {
    const scales = resolveProfileAxisScales({
      logScaleX: false,
      logScaleY: false,
      empiricalCdf: false,
      showPdf: false,
      measureKind: 'share',
    })
    expect(scales.value).toBe(fractionValueScale)
  })

  it('uses strict log fraction scale for share variables with log Y', () => {
    const scales = resolveProfileAxisScales({
      logScaleX: false,
      logScaleY: true,
      empiricalCdf: false,
      showPdf: false,
      measureKind: 'share',
    })
    expect(scales.value).toBe(strictLogFractionScale)
  })

  it('uses rank top log on X when logScaleX is on in standard profile', () => {
    const scales = resolveProfileAxisScales({
      logScaleX: true,
      logScaleY: false,
      empiricalCdf: false,
      showPdf: false,
    })
    expect(scales.rank).toBe(rankTopLogScale)
    expect(scales.value).toBe(linearValueScale)
  })

  it('uses strict log on wealth X in empirical CDF view when logScaleX is on', () => {
    const scales = resolveProfileAxisScales({
      logScaleX: true,
      logScaleY: false,
      empiricalCdf: true,
      showPdf: false,
    })
    expect(scales.value).toBe(strictLogValueScale)
  })
})
