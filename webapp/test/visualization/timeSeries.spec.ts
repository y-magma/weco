import { describe, expect, it } from 'vitest'
import { buildTimeSeriesOption } from '~/visualization/timeSeries'
import type { DataSeries } from '@domain/entities'

const sampleSeries: DataSeries = {
  id: 'FR-ahweal',
  label: 'FR · Patrimoine net moyen',
  points: [
    { year: 2020, value: 150_000 },
    { year: 2021, value: 1_500_000 },
  ],
}

describe('buildTimeSeriesOption', () => {
  it('formats the y-axis with compact labels', () => {
    const option = buildTimeSeriesOption([sampleSeries], 'Test', { logScaleY: true })
    const formatter = (option.yAxis as { axisLabel: { formatter: (v: number) => string } }).axisLabel.formatter
    expect(formatter(10_000)).toBe('10k')
    expect(formatter(1_000_000)).toBe('1M')
  })

  it('uses a log y-axis when logScaleY is set', () => {
    const option = buildTimeSeriesOption([sampleSeries], 'Test', { logScaleY: true })
    expect((option.yAxis as { type: string }).type).toBe('log')
  })

  it('drops non-positive values on a log axis', () => {
    const series: DataSeries = {
      ...sampleSeries,
      points: [
        { year: 2020, value: 0 },
        { year: 2021, value: 100 },
      ],
    }
    const option = buildTimeSeriesOption([series], 'Test', { logScaleY: true })
    const data = (option.series as { data: (number | null)[] }[])[0]!.data
    expect(data[0]).toBeNull()
    expect(data[1]).toBe(100)
  })

  it('renders one line per country with a legend', () => {
    const france: DataSeries = {
      id: 'FR',
      label: 'France',
      points: [{ year: 2020, value: 100 }],
    }
    const usa: DataSeries = {
      id: 'US',
      label: 'États-Unis',
      points: [{ year: 2020, value: 200 }],
    }
    const option = buildTimeSeriesOption([france, usa], 'Patrimoine net moyen')
    const echartsSeries = option.series as { name: string, type: string }[]
    expect(echartsSeries).toHaveLength(2)
    expect(echartsSeries.map((item) => item.name)).toEqual(['France', 'États-Unis'])
    expect((option.legend as { show: boolean }).show).toBe(true)
  })
})
