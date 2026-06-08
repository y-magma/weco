import { describe, expect, it } from 'vitest'
import {
  clampPanelCount,
  defaultPanelVariables,
  MAX_PANELS,
  MIN_PANELS,
  panelColSpan,
  resizePanelVariables,
} from '@src/domain/panels'

describe('clampPanelCount', () => {
  it('keeps values within range', () => {
    expect(clampPanelCount(1)).toBe(1)
    expect(clampPanelCount(3)).toBe(3)
  })

  it('clamps below min and above max', () => {
    expect(clampPanelCount(0)).toBe(MIN_PANELS)
    expect(clampPanelCount(-5)).toBe(MIN_PANELS)
    expect(clampPanelCount(99)).toBe(MAX_PANELS)
  })

  it('rounds and handles non-finite input', () => {
    expect(clampPanelCount(2.6)).toBe(3)
    expect(clampPanelCount(Number.NaN)).toBe(MIN_PANELS)
  })
})

describe('panelColSpan', () => {
  it('maps panel count to a Vuetify column span', () => {
    expect(panelColSpan(1)).toBe(12)
    expect(panelColSpan(2)).toBe(6)
    expect(panelColSpan(3)).toBe(4)
    expect(panelColSpan(4)).toBe(6)
  })

  it('clamps out-of-range counts before mapping', () => {
    expect(panelColSpan(0)).toBe(12)
    expect(panelColSpan(10)).toBe(6)
  })
})

describe('defaultPanelVariables', () => {
  const vars = ['ahweal', 'thweal', 'aptinc', 'tptinc']

  it('assigns distinct variables when enough are available', () => {
    expect(defaultPanelVariables(3, vars)).toEqual(['ahweal', 'thweal', 'aptinc'])
  })

  it('cycles when there are more panels than variables', () => {
    expect(defaultPanelVariables(2, ['ahweal'])).toEqual(['ahweal', 'ahweal'])
  })

  it('returns empty strings when no variables are available', () => {
    expect(defaultPanelVariables(2, [])).toEqual(['', ''])
  })
})

describe('resizePanelVariables', () => {
  const vars = ['ahweal', 'thweal', 'aptinc', 'tptinc']

  it('preserves existing choices when growing', () => {
    expect(resizePanelVariables(['tptinc'], 3, vars)).toEqual(['tptinc', 'thweal', 'aptinc'])
  })

  it('truncates when shrinking', () => {
    expect(resizePanelVariables(['ahweal', 'thweal', 'aptinc'], 1, vars)).toEqual(['ahweal'])
  })

  it('clamps the requested count', () => {
    expect(resizePanelVariables([], 99, vars)).toHaveLength(MAX_PANELS)
  })
})
