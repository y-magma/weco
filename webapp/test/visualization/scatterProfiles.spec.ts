import { describe, expect, it } from 'vitest'
import { buildProfileScatterOption } from '~/visualization/scatterProfiles'
import type { ProfileScatterPoint } from '@domain/services/joinProfiles'

const samplePoints: ProfileScatterPoint[] = [
  { percentile: 'p50p51', rank: 50, x: 10_000, y: 1_000_000 },
]

describe('buildProfileScatterOption', () => {
  it('formats both axes with compact labels (linear or log)', () => {
    const linear = buildProfileScatterOption(samplePoints, {
      xLabel: 'X',
      yLabel: 'Y',
    })
    const log = buildProfileScatterOption(samplePoints, {
      xLabel: 'X',
      yLabel: 'Y',
      logScaleX: true,
      logScaleY: true,
    })

    for (const option of [linear, log]) {
      const xFormatter = (option.xAxis as { axisLabel: { formatter: (v: number) => string } }).axisLabel.formatter
      const yFormatter = (option.yAxis as { axisLabel: { formatter: (v: number) => string } }).axisLabel.formatter
      expect(xFormatter(10_000)).toBe('10k')
      expect(yFormatter(1_000_000)).toBe('1M')
    }
  })

  it('positions the visualMap above the zoom slider below the x-axis name', () => {
    const option = buildProfileScatterOption(samplePoints, { xLabel: 'X', yLabel: 'Y' })
    const visualMap = option.visualMap as { left: number, right: number, bottom: number, itemWidth: number, itemHeight?: number }
    expect((option.grid as { bottom: number }).bottom).toBeGreaterThanOrEqual(80)
    expect(visualMap.left).toBe(64)
    expect(visualMap.right).toBe(24)
    expect(visualMap.bottom).toBeGreaterThan(12)
    expect(visualMap.itemWidth).toBeGreaterThanOrEqual(12)
    expect(visualMap.itemHeight).toBeUndefined()
    expect(option.toolbox).toBeDefined()
    expect((option.dataZoom as unknown[]).length).toBeGreaterThanOrEqual(2)
  })
})
