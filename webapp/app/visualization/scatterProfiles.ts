import type { MeasureKind } from '@domain/catalog/widCodes'
import type { ProfileScatterPoint } from '@domain/services/joinProfiles'
import type { EChartsOption } from 'echarts'
import { buildEchartsAxis, resolveValueScaleForMeasure } from '~/visualization/axisScale'
import { formatAxisValue } from '~/visualization/axisFormat'
import {
  buildChartAxisDataZoom,
  buildChartToolbox,
  CHART_ZOOM_GRID_BOTTOM,
  CHART_ZOOM_GRID_RIGHT,
  CHART_ZOOM_SLIDER_BOTTOM,
  CHART_ZOOM_SLIDER_HEIGHT,
} from '~/visualization/chartZoom'

const SCATTER_VISUAL_MAP_BOTTOM = CHART_ZOOM_SLIDER_BOTTOM + CHART_ZOOM_SLIDER_HEIGHT + 6
const SCATTER_GRID_BOTTOM = 88

export interface ProfileScatterOptions {
  xLabel: string
  yLabel: string
  /** Unité affichée entre parenthèses sur l'axe X. */
  xUnit?: string
  /** Unité affichée entre parenthèses sur l'axe Y. */
  yUnit?: string
  xMeasureKind?: MeasureKind
  yMeasureKind?: MeasureKind
  /** Log scale on the X axis. Non-positive X values are dropped. */
  logScaleX?: boolean
  /** Log scale on the Y axis. Non-positive Y values are dropped. */
  logScaleY?: boolean
  title?: string
}

/**
 * Nuage de 2 variables joint par percentile (graphe #6 de spec/version1.md).
 * Chaque point est un percentile : abscisse = valeur var1, ordonnée = valeur
 * var2. Les points sont colorés par rang (visualMap) pour situer le bas/haut de
 * distribution. En échelle log, les valeurs ≤ 0 de l'axe concerné sont retirées.
 */
export function buildProfileScatterOption(
  points: ProfileScatterPoint[],
  options: ProfileScatterOptions,
): EChartsOption {
  const {
    xLabel,
    yLabel,
    xUnit,
    yUnit,
    xMeasureKind = 'average',
    yMeasureKind = 'average',
    logScaleX = false,
    logScaleY = false,
    title,
  } = options
  const xAxisName = xUnit ? `${xLabel} (${xUnit})` : xLabel
  const yAxisName = yUnit ? `${yLabel} (${yUnit})` : yLabel
  const xScale = resolveValueScaleForMeasure(xMeasureKind, logScaleX)
  const yScale = resolveValueScaleForMeasure(yMeasureKind, logScaleY)

  const data = points
    .filter((point) => !(logScaleX && point.x <= 0) && !(logScaleY && point.y <= 0))
    .map((point) => ({
      value: [point.x, point.y, point.rank],
      name: point.percentile,
    }))

  return {
    title: {
      text: title ?? `${yLabel} vs ${xLabel}`,
      left: 'center',
      textStyle: { fontSize: 14 },
    },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const p = params as { name?: string, value?: [number, number, number] }
        const v = p?.value
        if (!v) return ''
        return `Percentile ${p.name ?? ''} (rang ${v[2]})<br/>`
          + `${xLabel}: ${formatAxisValue(v[0], xMeasureKind)}<br/>`
          + `${yLabel}: ${formatAxisValue(v[1], yMeasureKind)}`
      },
    },
    grid: { left: 64, right: CHART_ZOOM_GRID_RIGHT, top: 56, bottom: SCATTER_GRID_BOTTOM },
    toolbox: buildChartToolbox(),
    dataZoom: buildChartAxisDataZoom(),
    visualMap: {
      type: 'continuous',
      min: 0,
      max: 100,
      dimension: 2,
      calculable: true,
      orient: 'horizontal',
      left: 64,
      right: CHART_ZOOM_GRID_RIGHT,
      bottom: SCATTER_VISUAL_MAP_BOTTOM,
      /** Horizontal bar: itemWidth = thickness, length follows left/right. */
      itemWidth: 16,
      handleSize: '120%',
      text: ['rang 100', 'rang 0'],
      textGap: 10,
      inRange: { color: ['#1565C0', '#00897B', '#EF6C00'] },
    },
    xAxis: {
      ...buildEchartsAxis(xAxisName, xScale, { nameGap: 32 }),
      scale: !logScaleX,
      nameTextStyle: { fontSize: 11 },
    },
    yAxis: {
      ...buildEchartsAxis(yAxisName, yScale, { nameGap: 56 }),
      scale: !logScaleY,
      nameTextStyle: { fontSize: 11 },
    },
    series: [
      {
        name: 'percentiles',
        type: 'scatter',
        symbolSize: 8,
        data,
        emphasis: { focus: 'series' },
      },
    ],
  }
}
