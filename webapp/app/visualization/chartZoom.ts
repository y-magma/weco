import type { DataZoomComponentOption, ToolboxComponentOption } from 'echarts'

export const CHART_ZOOM_SLIDER_HEIGHT = 18
export const CHART_ZOOM_SLIDER_BOTTOM = 12
export const CHART_ZOOM_SLIDER_WIDTH = 18
export const CHART_ZOOM_SLIDER_RIGHT = 4

/** Grid bottom margin when a horizontal dataZoom slider is shown (axis labels + slider). */
export const CHART_ZOOM_GRID_BOTTOM = 64
/** Grid right margin when a vertical dataZoom slider is shown (keeps Y axis name on the left clear). */
export const CHART_ZOOM_GRID_RIGHT = 48

export interface ChartAxisDataZoomOptions {
  /** Horizontal slider distance from chart bottom (px). */
  bottom?: number
  /** Vertical slider distance from chart right edge (px). */
  right?: number
  xAxisIndex?: number | number[]
  yAxisIndex?: number | number[]
  filterMode?: DataZoomComponentOption['filterMode']
  showXSlider?: boolean
  showYSlider?: boolean
  /** Plot top — vertical slider starts here (align with grid.top). */
  gridTop?: number | string
  /** Plot bottom margin — vertical slider ends above the horizontal slider stack. */
  gridBottom?: number
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

/** Inside scroll + bottom X slider + right Y slider (axis names stay on the left). */
export function buildChartAxisDataZoom(
  options: ChartAxisDataZoomOptions = {},
): DataZoomComponentOption[] {
  const {
    bottom = CHART_ZOOM_SLIDER_BOTTOM,
    right = CHART_ZOOM_SLIDER_RIGHT,
    xAxisIndex = 0,
    yAxisIndex = 0,
    filterMode,
    showXSlider = true,
    showYSlider = true,
    gridTop = 56,
    gridBottom = CHART_ZOOM_GRID_BOTTOM,
  } = options

  const shared = {
    start: 0,
    end: 100,
    filterMode: filterMode ?? 'filter',
  }

  const zooms: DataZoomComponentOption[] = []
  const bottomClearance = showXSlider
    ? CHART_ZOOM_SLIDER_BOTTOM + CHART_ZOOM_SLIDER_HEIGHT
    : 0

  if (showXSlider) {
    zooms.push(
      { type: 'inside', xAxisIndex, ...shared },
      {
        type: 'slider',
        xAxisIndex,
        ...shared,
        height: CHART_ZOOM_SLIDER_HEIGHT,
        bottom,
      },
    )
  }

  if (showYSlider) {
    zooms.push(
      { type: 'inside', yAxisIndex, ...shared },
      {
        type: 'slider',
        orient: 'vertical',
        yAxisIndex,
        ...shared,
        width: CHART_ZOOM_SLIDER_WIDTH,
        right,
        top: gridTop,
        bottom: gridBottom + bottomClearance,
      },
    )
  }

  return zooms
}
