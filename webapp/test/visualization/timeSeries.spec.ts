import { describe, expect, it } from 'vitest'
import {
  buildStackedShareTimeSeriesOption,
  buildStackedTimeSeriesOption,
  buildTimeSeriesOption,
} from '~/visualization/timeSeries'
import type { DataSeries } from '@domain/entities'
import { buildTimeSeriesTranches, TIME_SERIES_DEFAULT_BREAKPOINTS } from '~/visualization/timeSeriesPartition'

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

  it('keeps each country history when year ranges differ', () => {
    const france: DataSeries = {
      id: 'FR',
      label: 'France',
      points: [
        { year: 1800, value: 100 },
        { year: 1900, value: 200 },
      ],
    }
    const usa: DataSeries = {
      id: 'US',
      label: 'États-Unis',
      points: [{ year: 1913, value: 300 }],
    }
    const option = buildTimeSeriesOption([france, usa], 'Patrimoine net moyen')
    const echartsSeries = option.series as { data: (number | null)[] }[]
    const years = (option.xAxis as { data: string[] }).data

    expect(years).toEqual(['1800', '1900', '1913'])
    expect(echartsSeries[0]!.data).toEqual([100, 200, null])
    expect(echartsSeries[1]!.data).toEqual([null, null, 300])
  })

  it('formats fractional share values on the y-axis', () => {
    const shareSeries: DataSeries = {
      id: 'FR-shweal',
      label: 'FR · Part du patrimoine net',
      points: [
        { year: 2020, value: 0.001 },
        { year: 2021, value: 0.05 },
      ],
    }
    const option = buildTimeSeriesOption([shareSeries], 'Part du patrimoine net', {
      measureKind: 'share',
    })
    const formatter = (option.yAxis as { axisLabel: { formatter: (v: number) => string } }).axisLabel.formatter
    expect(formatter(0.001)).toBe('0,001')
    expect(formatter(0.05)).toBe('0,05')
  })
})

describe('buildStackedShareTimeSeriesOption', () => {
  it('renders stacked area series for decile or quintile shares', () => {
    const deciles = Array.from({ length: 3 }, (_, index) => ({
      id: `decile${index + 1}`,
      label: `D${index + 1}`,
      points: [{ year: 2020, value: 0.1 }],
    }))
    const option = buildStackedShareTimeSeriesOption(deciles, 'Parts par décile (10)', {
      subtitle: 'France · parts par décile',
      measureKind: 'share',
    })
    const echartsSeries = option.series as { type: string, stack: string, areaStyle: { opacity: number } }[]
    expect(echartsSeries).toHaveLength(3)
    expect(echartsSeries.every((item) => item.type === 'line' && item.stack === 'share')).toBe(true)
    expect(echartsSeries.every((item) => item.areaStyle.opacity > 0)).toBe(true)
    expect((option.legend as { orient: string }).orient).toBe('vertical')
  })
})

describe('buildStackedTimeSeriesOption', () => {
  it('renders stacked area series for each tranche', () => {
    const tranches = buildTimeSeriesTranches([...TIME_SERIES_DEFAULT_BREAKPOINTS], 'wealth')
    const option = buildStackedTimeSeriesOption(
      [{
        countryCode: 'US',
        countryLabel: 'États-Unis',
        tranches: tranches.map((tranche) => ({
          tranche,
          byYear: new Map([
            [2020, 100_000 * tranche.hi],
            [2021, 120_000 * tranche.hi],
          ]),
        })),
      }],
      'Patrimoine net moyen',
      'États-Unis · par tranche de population',
    )

    const echartsSeries = option.series as { type: string, stack: string, areaStyle: { opacity: number } }[]
    expect(echartsSeries).toHaveLength(5)
    expect(echartsSeries.every((item) => item.type === 'line' && item.stack === 'US')).toBe(true)
    expect(echartsSeries.every((item) => item.areaStyle.opacity > 0)).toBe(true)
    expect((option.legend as { orient: string }).orient).toBe('vertical')
  })
})
