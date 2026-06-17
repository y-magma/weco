import type { ProfileScatterPoint } from '@domain/services/joinProfiles'
import type { EChartsOption } from 'echarts'
import { formatCompactAxisValue } from '~/visualization/axisFormat'
import {
  buildChartAxisDataZoom,
  buildChartToolbox,
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
  const { xLabel, yLabel, xUnit, yUnit, logScaleX = false, logScaleY = false, title } = options
  const xAxisName = xUnit ? `${xLabel} (${xUnit})` : xLabel
  const yAxisName = yUnit ? `${yLabel} (${yUnit})` : yLabel

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
          + `${xLabel}: ${v[0].toLocaleString('fr-FR')}<br/>`
          + `${yLabel}: ${v[1].toLocaleString('fr-FR')}`
      },
    },
    grid: { left: 64, right: 24, top: 56, bottom: SCATTER_GRID_BOTTOM },
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
      right: 24,
      bottom: SCATTER_VISUAL_MAP_BOTTOM,
      /** Horizontal bar: itemWidth = thickness, length follows left/right. */
      itemWidth: 16,
      handleSize: '120%',
      text: ['rang 100', 'rang 0'],
      textGap: 10,
      inRange: { color: ['#1565C0', '#00897B', '#EF6C00'] },
    },
    xAxis: {
      type: logScaleX ? 'log' : 'value',
      name: xAxisName,
      nameLocation: 'middle',
      nameGap: 32,
      nameTextStyle: { fontSize: 11 },
      scale: !logScaleX,
      axisLabel: {
        formatter: (value: number) => formatCompactAxisValue(value),
      },
    },
    yAxis: {
      type: logScaleY ? 'log' : 'value',
      name: yAxisName,
      nameLocation: 'middle',
      nameGap: 56,
      nameTextStyle: { fontSize: 11 },
      scale: !logScaleY,
      axisLabel: {
        formatter: (value: number) => formatCompactAxisValue(value),
      },
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
