import type { DataZoomComponentOption, ToolboxComponentOption } from 'echarts'

export const CHART_ZOOM_SLIDER_HEIGHT = 18
export const CHART_ZOOM_SLIDER_BOTTOM = 12

/** Grid bottom margin when a horizontal dataZoom slider is shown (axis labels + slider). */
export const CHART_ZOOM_GRID_BOTTOM = 64

export interface ChartAxisDataZoomOptions {
  /** Horizontal slider distance from chart bottom (px). */
  bottom?: number
  xAxisIndex?: number | number[]
  yAxisIndex?: number | number[]
  filterMode?: DataZoomComponentOption['filterMode']
}

/** Toolbox shared by time-series, scatter and profile panels (save, horizontal zoom, restore). */
export function buildChartToolbox(): ToolboxComponentOption {
  return {
    feature: {
      saveAsImage: {},
      dataZoom: { yAxisIndex: 'none' },
      restore: {},
    },
  }
}

/** Inside scroll + bottom slider on the horizontal axis (time-series zoom pattern). */
export function buildChartAxisDataZoom(
  options: ChartAxisDataZoomOptions = {},
): DataZoomComponentOption[] {
  const {
    bottom = CHART_ZOOM_SLIDER_BOTTOM,
    xAxisIndex = 0,
    yAxisIndex,
    filterMode,
  } = options

  const axisBinding = yAxisIndex !== undefined
    ? { yAxisIndex }
    : { xAxisIndex }

  const shared = {
    start: 0,
    end: 100,
    filterMode: filterMode ?? 'filter',
  }

  return [
    { type: 'inside', ...axisBinding, ...shared },
    {
      type: 'slider',
      ...axisBinding,
      ...shared,
      height: CHART_ZOOM_SLIDER_HEIGHT,
      bottom,
    },
  ]
}
