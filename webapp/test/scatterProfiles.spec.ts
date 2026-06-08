import { describe, expect, it } from 'vitest'
import { buildProfileScatterOption } from '@src/charts/scatterProfiles'
import type { ProfileScatterPoint } from '@src/domain/joinProfiles'

const POINTS: ProfileScatterPoint[] = [
  { percentile: 'p0p1', rank: 0, x: -100, y: -50 },
  { percentile: 'p50p51', rank: 50, x: 500, y: 600 },
  { percentile: 'p90p91', rank: 90, x: 9000, y: 12000 },
]

function seriesData(option: ReturnType<typeof buildProfileScatterOption>) {
  return (option.series as { data: { value: number[], name: string }[] }[])[0]!.data
}

describe('buildProfileScatterOption', () => {
  it('emits [x, y, rank] values with the percentile as name', () => {
    const option = buildProfileScatterOption(POINTS, { xLabel: 'X', yLabel: 'Y' })
    const data = seriesData(option)
    expect(data).toHaveLength(3)
    expect(data[1]!.value).toEqual([500, 600, 50])
    expect(data[1]!.name).toBe('p50p51')
  })

  it('uses linear axes by default and log axes when requested', () => {
    const linear = buildProfileScatterOption(POINTS, { xLabel: 'X', yLabel: 'Y' })
    expect((linear.xAxis as { type: string }).type).toBe('value')
    expect((linear.yAxis as { type: string }).type).toBe('value')

    const log = buildProfileScatterOption(POINTS, {
      xLabel: 'X',
      yLabel: 'Y',
      logScaleX: true,
      logScaleY: true,
    })
    expect((log.xAxis as { type: string }).type).toBe('log')
    expect((log.yAxis as { type: string }).type).toBe('log')
  })

  it('drops non-positive X on a log X axis (guard)', () => {
    const option = buildProfileScatterOption(POINTS, { xLabel: 'X', yLabel: 'Y', logScaleX: true })
    const data = seriesData(option)
    expect(data.every((d) => d.value[0]! > 0)).toBe(true)
    expect(data).toHaveLength(2)
  })

  it('drops non-positive Y on a log Y axis (guard)', () => {
    const option = buildProfileScatterOption(POINTS, { xLabel: 'X', yLabel: 'Y', logScaleY: true })
    const data = seriesData(option)
    expect(data.every((d) => d.value[1]! > 0)).toBe(true)
    expect(data).toHaveLength(2)
  })

  it('labels the axes', () => {
    const option = buildProfileScatterOption(POINTS, { xLabel: 'Seuil', yLabel: 'Moyenne' })
    expect((option.xAxis as { name: string }).name).toBe('Seuil')
    expect((option.yAxis as { name: string }).name).toBe('Moyenne')
  })
})
