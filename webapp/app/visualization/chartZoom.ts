import type { ECharts } from 'echarts/core'
import type { DataZoomComponentOption, ToolboxComponentOption } from 'echarts'

export const CHART_ZOOM_SLIDER_HEIGHT = 18
export const CHART_ZOOM_SLIDER_BOTTOM = 12

/** Grid bottom margin when a horizontal dataZoom slider is shown (axis labels + slider). */
export const CHART_ZOOM_GRID_BOTTOM = 64

/** Chemin SVG MDI `math-log` (viewBox 0 0 24 24). */
export const CHART_TOOLBOX_LOG_MDI_PATH
  = 'M18 7C16.9 7 16 7.9 16 9V15C16 16.1 16.9 17 18 17H20C21.1 17 22 16.1 22 15V11H20V15H18V9H22V7H18M2 7V17H8V15H4V7H2M11 7C9.9 7 9 7.9 9 9V15C9 16.1 9.9 17 11 17H13C14.1 17 15 16.1 15 15V9C15 7.9 14.1 7 13 7H11M11 9H13V15H11V9Z'

const CHART_TOOLBOX_LOG_ICON_PATH = `path://${CHART_TOOLBOX_LOG_MDI_PATH}`

/** Icône toolbox log — état linéaire. */
export const CHART_TOOLBOX_LOG_ICON_OFF = CHART_TOOLBOX_LOG_ICON_PATH

/** Icône toolbox log — état logarithmique (même glyphe, style actif via iconStyle). */
export const CHART_TOOLBOX_LOG_ICON_ON = CHART_TOOLBOX_LOG_ICON_PATH

/** @deprecated Utiliser CHART_TOOLBOX_LOG_ICON_OFF */
export const CHART_TOOLBOX_LOG_ICON = CHART_TOOLBOX_LOG_ICON_OFF

const LOG_ACTIVE_COLOR = '#1565C0'
const LOG_INACTIVE_COLOR = '#757575'

export interface ChartAxisDataZoomOptions {
  /** Horizontal slider distance from chart bottom (px). */
  bottom?: number
  xAxisIndex?: number | number[]
  yAxisIndex?: number | number[]
  filterMode?: DataZoomComponentOption['filterMode']
}

export interface ChartToolboxHandlers {
  onToggleLogX?: () => void
  onToggleLogY?: () => void
}

export interface ChartToolboxLogState {
  logX?: boolean | null
  logY?: boolean | null
}

type AxisDimension = 'xAxis' | 'yAxis'
type LogToolId = 'myLogX' | 'myLogY'

interface AxisLike {
  type?: string
  [key: string]: unknown
}

function axisList(raw: AxisLike | AxisLike[] | undefined): AxisLike[] {
  if (raw == null) return []
  return Array.isArray(raw) ? raw : [raw]
}

function toggleableValueAxis(axes: AxisLike[]): AxisLike | undefined {
  return axes.find((axis) => {
    const type = axis.type ?? 'value'
    return type === 'value' || type === 'log'
  })
}

/** `true` = log, `false` = lin, `null` = axe non basculable (ex. category). */
export function readAxisLogActive(
  source: Record<string, AxisLike | AxisLike[] | undefined>,
  dimension: AxisDimension,
): boolean | null {
  const reference = toggleableValueAxis(axisList(source[dimension]))
  if (!reference) return null
  return (reference.type ?? 'value') === 'log'
}

export function readAxisLogStateFromOption(option: Record<string, unknown>): ChartToolboxLogState {
  const source = option as Record<string, AxisLike | AxisLike[] | undefined>
  return {
    logX: readAxisLogActive(source, 'xAxis'),
    logY: readAxisLogActive(source, 'yAxis'),
  }
}

function logToolId(dimension: AxisDimension): LogToolId {
  return dimension === 'xAxis' ? 'myLogX' : 'myLogY'
}

function logToolLabel(toolId: LogToolId): string {
  return toolId === 'myLogX' ? 'logX' : 'logY'
}

export function buildLogToolboxFeature(toolId: LogToolId, active: boolean, onclick?: () => void) {
  const label = logToolLabel(toolId)
  return {
    show: true,
    title: label,
    icon: active ? CHART_TOOLBOX_LOG_ICON_ON : CHART_TOOLBOX_LOG_ICON_OFF,
    iconStyle: {
      borderColor: active ? LOG_ACTIVE_COLOR : LOG_INACTIVE_COLOR,
      borderWidth: active ? 2 : 1,
    },
    emphasis: {
      iconStyle: {
        borderColor: LOG_ACTIVE_COLOR,
        borderWidth: 2,
      },
    },
    onclick,
  }
}

/** Met à jour l’apparence des boutons myLogX / myLogY selon le type d’axe courant. */
export function syncToolboxLogButtonStates(
  chart: ECharts,
  handlers: ChartToolboxHandlers = {},
): void {
  const option = chart.getOption() as Record<string, AxisLike | AxisLike[] | undefined>
  const feature: ToolboxComponentOption['feature'] = {}

  const logX = readAxisLogActive(option, 'xAxis')
  if (logX !== null) {
    feature.myLogX = buildLogToolboxFeature('myLogX', logX, handlers.onToggleLogX)
  }

  const logY = readAxisLogActive(option, 'yAxis')
  if (logY !== null) {
    feature.myLogY = buildLogToolboxFeature('myLogY', logY, handlers.onToggleLogY)
  }

  if (Object.keys(feature).length === 0) return

  chart.setOption({ toolbox: { feature } })
}

/** Bascule lin ↔ log sur tous les axes value/log d'une dimension (via setOption ECharts). */
export function toggleChartAxisLog(
  chart: ECharts,
  dimension: AxisDimension,
  handlers: ChartToolboxHandlers = {},
): boolean | null {
  const raw = chart.getOption() as Record<string, AxisLike | AxisLike[] | undefined>
  const axes = raw[dimension]
  if (axes == null) return null

  const list = axisList(axes)
  const reference = toggleableValueAxis(list)
  if (!reference) return null

  const currentType = reference.type ?? 'value'
  const newType = currentType === 'log' ? 'value' : 'log'

  const updated = list.map((axis) => {
    const type = axis.type ?? 'value'
    if (type !== 'value' && type !== 'log') return axis
    return { ...axis, type: newType }
  })

  chart.setOption({
    [dimension]: Array.isArray(axes) ? updated : updated[0],
  })

  syncToolboxLogButtonStates(chart, handlers)
  return newType === 'log'
}

/** Toolbox ECharts identique sur tous les graphiques (`<EChart />`). */
export function buildChartToolbox(
  handlers: ChartToolboxHandlers = {},
  logState: ChartToolboxLogState = {},
): ToolboxComponentOption {
  const { logX = null, logY = null } = logState
  const feature: NonNullable<ToolboxComponentOption['feature']> = {
    dataZoom: { yAxisIndex: 'none' },
    dataView: { readOnly: false },
    magicType: { type: ['line', 'bar'] },
    restore: {},
    saveAsImage: {},
  }

  if (logX !== null) {
    feature.myLogX = buildLogToolboxFeature('myLogX', logX, handlers.onToggleLogX)
  }
  if (logY !== null) {
    feature.myLogY = buildLogToolboxFeature('myLogY', logY, handlers.onToggleLogY)
  }

  return { feature }
}

/** Superpose la toolbox standard sur une option traceur (sans dataZoom). */
export function applyChartToolbox<T extends Record<string, unknown>>(
  option: T,
  handlers?: ChartToolboxHandlers,
): T & { toolbox: ToolboxComponentOption } {
  const logState = readAxisLogStateFromOption(option)
  return {
    ...option,
    toolbox: buildChartToolbox(handlers, logState),
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
