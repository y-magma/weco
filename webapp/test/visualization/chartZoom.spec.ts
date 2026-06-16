import { describe, expect, it } from 'vitest'
import {
  buildChartAxisDataZoom,
  buildChartToolbox,
  CHART_ZOOM_GRID_BOTTOM,
  CHART_ZOOM_SLIDER_BOTTOM,
  CHART_ZOOM_SLIDER_HEIGHT,
} from '~/visualization/chartZoom'

describe('chartZoom', () => {
  it('builds the time-series toolbox (save, horizontal zoom, restore)', () => {
    const toolbox = buildChartToolbox()
    expect(toolbox.feature?.saveAsImage).toBeDefined()
    expect(toolbox.feature?.restore).toBeDefined()
    expect(toolbox.feature?.dataZoom).toEqual({ yAxisIndex: 'none' })
  })

  it('builds inside + bottom slider dataZoom on the X axis by default', () => {
    const zooms = buildChartAxisDataZoom()
    expect(zooms).toHaveLength(2)
    expect(zooms[0]).toMatchObject({ type: 'inside', xAxisIndex: 0, start: 0, end: 100, filterMode: 'filter' })
    expect(zooms[1]).toMatchObject({
      type: 'slider',
      xAxisIndex: 0,
      start: 0,
      end: 100,
      height: CHART_ZOOM_SLIDER_HEIGHT,
      bottom: CHART_ZOOM_SLIDER_BOTTOM,
      filterMode: 'filter',
    })
  })

  it('exposes shared layout constants for grid margins', () => {
    expect(CHART_ZOOM_GRID_BOTTOM).toBeGreaterThan(CHART_ZOOM_SLIDER_BOTTOM + CHART_ZOOM_SLIDER_HEIGHT)
  })
})
