import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import {
  applyExplorationSnapshot,
  applyTimeSeriesCompareSnapshot,
  applyTimeSeriesSnapshot,
  serializeExplorationState,
  serializeTimeSeriesCompareState,
  serializeTimeSeriesState,
} from '@application/share/panelSnapshots'

describe('panelSnapshots', () => {
  it('serializes and applies exploration panel state', () => {
    const refs = {
      countryCode: ref('FR'),
      variable: ref('ahweal'),
      year: ref(2021),
      age: ref('992'),
      pop: ref('j'),
      method: ref<'zero' | 'anchor' | 'leastSquares'>('zero'),
      populationViewMode: ref<'all' | 'step1' | 'step10' | 'step25' | 'custom'>('step1'),
      approxPartitionMode: ref<'all' | 'step1' | 'step10' | 'step25' | 'custom'>('custom'),
      customBreakpoints: ref<number[]>([10, 50]),
      drillLevel: ref(1),
      showHistogram: ref(true),
      showTrapezoids: ref(false),
      logRichZoom: ref(false),
      logScaleX: ref(true),
      logScaleY: ref(false),
      originalViewMode: ref<'line' | 'scatter' | 'bar'>('line'),
      lorenzCurve: ref(false),
      empiricalCdf: ref(true),
      empiricalPdf: ref(false),
      showEmpiricalDistribution: ref(true),
      showSmoothDistribution: ref(false),
      hiddenApproxIntervals: ref(new Set([2, 4])),
    }

    const snapshot = serializeExplorationState(refs)
    expect(snapshot.customBreakpoints).toEqual([10, 50])
    expect(snapshot.hiddenApproxIntervals).toEqual([2, 4])

    refs.countryCode.value = 'US'
    refs.hiddenApproxIntervals.value = new Set()
    applyExplorationSnapshot(refs, snapshot)
    expect(refs.countryCode.value).toBe('FR')
    expect([...refs.hiddenApproxIntervals.value]).toEqual([2, 4])
  })

  it('serializes and applies time series panel state', () => {
    const refs = {
      countryCode: ref('DE'),
      variable: ref('sptinc'),
      age: ref('992'),
      pop: ref('j'),
      partitionMode: ref<'distribution' | 'whole' | 'step10' | 'step25' | 'custom'>('step10'),
      customBreakpoints: ref<number[]>([]),
    }

    const snapshot = serializeTimeSeriesState(refs)
    refs.countryCode.value = 'FR'
    applyTimeSeriesSnapshot(refs, snapshot)
    expect(refs.countryCode.value).toBe('DE')
  })

  it('serializes and applies compare panel state', () => {
    const refs = {
      countryCodes: ref(['FR', 'US']),
      variable: ref('ahweal'),
      percentile: ref('p0p50'),
      customLo: ref(50),
      customHi: ref(51),
      decileSubSelection: ref(''),
      age: ref('992'),
      pop: ref('j'),
    }

    const snapshot = serializeTimeSeriesCompareState(refs)
    refs.countryCodes.value = ['DE']
    applyTimeSeriesCompareSnapshot(refs, snapshot)
    expect(refs.countryCodes.value).toEqual(['FR', 'US'])
  })
})
