import type { EChartsOption } from 'echarts'
import type { ProfileScatterPoint } from '@src/domain/joinProfiles'

export interface ProfileScatterOptions {
  xLabel: string
  yLabel: string
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
  const { xLabel, yLabel, logScaleX = false, logScaleY = false, title } = options

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
    grid: { left: 64, right: 24, top: 56, bottom: 64 },
    visualMap: {
      type: 'continuous',
      min: 0,
      max: 100,
      dimension: 2,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      text: ['rang 100', 'rang 0'],
      inRange: { color: ['#1565C0', '#00897B', '#EF6C00'] },
    },
    xAxis: {
      type: logScaleX ? 'log' : 'value',
      name: xLabel,
      nameLocation: 'middle',
      nameGap: 32,
      scale: true,
    },
    yAxis: {
      type: logScaleY ? 'log' : 'value',
      name: yLabel,
      scale: true,
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
