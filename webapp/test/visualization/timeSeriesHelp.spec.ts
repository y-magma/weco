import { describe, expect, it } from 'vitest'
import { buildTimeSeriesStackHelp, TIME_SERIES_HELP } from '~/visualization/timeSeriesHelp'

describe('timeSeriesHelp', () => {
  it('returns weighted help by default', () => {
    const help = buildTimeSeriesStackHelp('weighted')
    expect(help.title).toBe(TIME_SERIES_HELP.stackModeWeighted.title)
    expect(help.paragraphs.some((paragraph) => paragraph.includes('×'))).toBe(true)
  })

  it('returns raw help without transformation wording', () => {
    const help = buildTimeSeriesStackHelp('raw')
    expect(help.title).toBe(TIME_SERIES_HELP.stackModeRaw.title)
    expect(help.paragraphs.some((paragraph) => paragraph.includes('WID.world'))).toBe(true)
  })
})
