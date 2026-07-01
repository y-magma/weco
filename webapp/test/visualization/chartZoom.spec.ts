import { describe, expect, it, vi } from 'vitest'
import {
  applyChartToolbox,
  buildChartAxisDataZoom,
  buildChartToolbox,
  buildLogToolboxFeature,
  CHART_TOOLBOX_LOG_ICON_OFF,
  CHART_TOOLBOX_LOG_ICON_ON,
  CHART_ZOOM_GRID_BOTTOM,
  CHART_ZOOM_SLIDER_BOTTOM,
  CHART_ZOOM_SLIDER_HEIGHT,
  readAxisLogStateFromOption,
  syncToolboxLogButtonStates,
  toggleChartAxisLog,
} from '~/visualization/chartZoom'

describe('chartZoom', () => {
  it('builds the shared toolbox (dataZoom, dataView, magicType, myLogX/Y, restore, saveAsImage)', () => {
    const toolbox = buildChartToolbox({}, { logX: false, logY: false })
    expect(toolbox.feature?.dataZoom).toEqual({ yAxisIndex: 'none' })
    expect(toolbox.feature?.dataView).toEqual({ readOnly: false })
    expect(toolbox.feature?.magicType).toEqual({ type: ['line', 'bar'] })
    expect(toolbox.feature?.myLogX).toMatchObject({
      show: true,
      title: 'logX',
      icon: CHART_TOOLBOX_LOG_ICON_OFF,
    })
    expect(toolbox.feature?.myLogY).toMatchObject({
      show: true,
      title: 'logY',
      icon: CHART_TOOLBOX_LOG_ICON_OFF,
    })
    expect(toolbox.feature?.restore).toBeDefined()
    expect(toolbox.feature?.saveAsImage).toBeDefined()
  })

  it('buildLogToolboxFeature reflects active log state', () => {
    const off = buildLogToolboxFeature('myLogX', false)
    const on = buildLogToolboxFeature('myLogX', true)
    expect(off.title).toBe('logX')
    expect(on.title).toBe('logX')
    expect(off.icon).toBe(CHART_TOOLBOX_LOG_ICON_OFF)
    expect(on.icon).toBe(CHART_TOOLBOX_LOG_ICON_ON)
    expect(off.icon).toBe(on.icon)
    expect(on.iconStyle).toMatchObject({ borderColor: '#1565C0', borderWidth: 2 })
    expect(off.iconStyle).toMatchObject({ borderColor: '#757575', borderWidth: 1 })
  })

  it('reads log state from traceur option axes', () => {
    expect(readAxisLogStateFromOption({
      xAxis: { type: 'value' },
      yAxis: { type: 'log' },
    })).toEqual({ logX: false, logY: true })

    expect(readAxisLogStateFromOption({
      xAxis: { type: 'category', data: ['2020'] },
      yAxis: { type: 'value' },
    })).toEqual({ logX: null, logY: false })
  })

  it('wires myLog handlers into the toolbox', () => {
    const onToggleLogX = vi.fn()
    const onToggleLogY = vi.fn()
    const toolbox = buildChartToolbox({ onToggleLogX, onToggleLogY }, { logX: false, logY: false })
    toolbox.feature?.myLogX?.onclick?.({} as never, {} as never)
    toolbox.feature?.myLogY?.onclick?.({} as never, {} as never)
    expect(onToggleLogX).toHaveBeenCalledOnce()
    expect(onToggleLogY).toHaveBeenCalledOnce()
  })

  it('applyChartToolbox superposes the toolbox on a traceur option', () => {
    const option = applyChartToolbox({
      title: { text: 'Test' },
      xAxis: { type: 'log' },
      yAxis: { type: 'value' },
      series: [],
    })
    expect(option.title).toEqual({ text: 'Test' })
    expect(option.toolbox?.feature?.myLogX).toMatchObject({ title: 'logX' })
    expect(option.toolbox?.feature?.myLogY).toMatchObject({ title: 'logY' })
  })

  it('toggleChartAxisLog switches value axes to log and syncs toolbox icons', () => {
    let yAxis = [{ type: 'value', name: 'Y' }]
    const setOption = vi.fn((patch: { yAxis?: typeof yAxis }) => {
      if (patch.yAxis) yAxis = patch.yAxis
    })
    const chart = {
      getOption: () => ({ yAxis }),
      setOption,
    }

    const becameLog = toggleChartAxisLog(chart as never, 'yAxis')
    expect(becameLog).toBe(true)
    expect(setOption).toHaveBeenCalledWith({ yAxis: [{ type: 'log', name: 'Y' }] })
    expect(setOption).toHaveBeenCalledWith({
      toolbox: {
        feature: {
          myLogY: expect.objectContaining({ title: 'logY', icon: CHART_TOOLBOX_LOG_ICON_ON }),
        },
      },
    })

    const becameLin = toggleChartAxisLog(chart as never, 'yAxis')
    expect(becameLin).toBe(false)
    expect(setOption).toHaveBeenLastCalledWith({
      toolbox: {
        feature: {
          myLogY: expect.objectContaining({ title: 'logY', icon: CHART_TOOLBOX_LOG_ICON_OFF }),
        },
      },
    })
  })

  it('syncToolboxLogButtonStates updates both log buttons', () => {
    const setOption = vi.fn()
    const chart = {
      getOption: () => ({
        xAxis: [{ type: 'log' }],
        yAxis: [{ type: 'value' }],
      }),
      setOption,
    }

    syncToolboxLogButtonStates(chart as never)
    expect(setOption).toHaveBeenCalledWith({
      toolbox: {
        feature: {
          myLogX: expect.objectContaining({ title: 'logX' }),
          myLogY: expect.objectContaining({ title: 'logY' }),
        },
      },
    })
  })

  it('toggleChartAxisLog ignores category axes', () => {
    const setOption = vi.fn()
    const chart = {
      getOption: () => ({
        xAxis: [{ type: 'category', data: ['2020', '2021'] }],
      }),
      setOption,
    }

    expect(toggleChartAxisLog(chart as never, 'xAxis')).toBeNull()
    expect(setOption).not.toHaveBeenCalled()
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
