import type { Ref } from 'vue'
import type {
  ExplorationPanelSnapshot,
  TimeSeriesComparePanelSnapshot,
  TimeSeriesPanelSnapshot,
} from '@application/share/shareSnapshot'
import type {
  ProfileChartLayer,
  PopulationViewMode,
  TimeSeriesPopulationMode,
  TrapezoidMethod,
} from '@domain/panelState'

export interface ExplorationPanelRefs {
  countryCode: Ref<string>
  variable: Ref<string>
  year: Ref<number>
  age: Ref<string>
  pop: Ref<string>
  method: Ref<TrapezoidMethod>
  populationViewMode: Ref<PopulationViewMode>
  approxPartitionMode: Ref<PopulationViewMode>
  customBreakpoints: Ref<number[]>
  drillLevel: Ref<number>
  showHistogram: Ref<boolean>
  showTrapezoids: Ref<boolean>
  logRichScale: Ref<boolean>
  logScaleX: Ref<boolean>
  logScaleY: Ref<boolean>
  originalViewMode: Ref<ProfileChartLayer>
  lorenzCurve: Ref<boolean>
  empiricalCdf: Ref<boolean>
  empiricalPdf: Ref<boolean>
  showEmpiricalDistribution: Ref<boolean>
  showSmoothDistribution: Ref<boolean>
  hiddenApproxIntervals: Ref<Set<number>>
}

export interface TimeSeriesPanelRefs {
  countryCode: Ref<string>
  variable: Ref<string>
  age: Ref<string>
  pop: Ref<string>
  partitionMode: Ref<TimeSeriesPopulationMode>
  customBreakpoints: Ref<number[]>
}

export interface TimeSeriesComparePanelRefs {
  countryCodes: Ref<string[]>
  variable: Ref<string>
  percentile: Ref<string>
  customLo: Ref<number>
  customHi: Ref<number>
  decileSubSelection: Ref<string>
  age: Ref<string>
  pop: Ref<string>
}

export function serializeExplorationState(refs: ExplorationPanelRefs): ExplorationPanelSnapshot {
  return {
    countryCode: refs.countryCode.value,
    variable: refs.variable.value,
    year: refs.year.value,
    age: refs.age.value,
    pop: refs.pop.value,
    method: refs.method.value,
    populationViewMode: refs.populationViewMode.value,
    approxPartitionMode: refs.approxPartitionMode.value,
    customBreakpoints: [...refs.customBreakpoints.value],
    drillLevel: refs.drillLevel.value,
    showHistogram: refs.showHistogram.value,
    showTrapezoids: refs.showTrapezoids.value,
    logRichScale: refs.logRichScale.value,
    logScaleX: refs.logScaleX.value,
    logScaleY: refs.logScaleY.value,
    originalViewMode: refs.originalViewMode.value,
    lorenzCurve: refs.lorenzCurve.value,
    empiricalCdf: refs.empiricalCdf.value,
    empiricalPdf: refs.empiricalPdf.value,
    showEmpiricalDistribution: refs.showEmpiricalDistribution.value,
    showSmoothDistribution: refs.showSmoothDistribution.value,
    hiddenApproxIntervals: [...refs.hiddenApproxIntervals.value],
  }
}

export function applyExplorationSnapshot(
  refs: ExplorationPanelRefs,
  snapshot: ExplorationPanelSnapshot,
): void {
  if (snapshot.countryCode !== undefined) refs.countryCode.value = snapshot.countryCode
  if (snapshot.variable !== undefined) refs.variable.value = snapshot.variable
  if (snapshot.year !== undefined) refs.year.value = snapshot.year
  if (snapshot.age !== undefined) refs.age.value = snapshot.age
  if (snapshot.pop !== undefined) refs.pop.value = snapshot.pop
  if (snapshot.method !== undefined) refs.method.value = snapshot.method
  if (snapshot.populationViewMode !== undefined) {
    refs.populationViewMode.value = snapshot.populationViewMode
  }
  if (snapshot.approxPartitionMode !== undefined) {
    refs.approxPartitionMode.value = snapshot.approxPartitionMode
  }
  if (snapshot.customBreakpoints !== undefined) {
    refs.customBreakpoints.value = [...snapshot.customBreakpoints]
  }
  if (snapshot.drillLevel !== undefined) refs.drillLevel.value = snapshot.drillLevel
  if (snapshot.showHistogram !== undefined) refs.showHistogram.value = snapshot.showHistogram
  if (snapshot.showTrapezoids !== undefined) refs.showTrapezoids.value = snapshot.showTrapezoids
  if (snapshot.logRichScale !== undefined) refs.logRichScale.value = snapshot.logRichScale
  else if ('logRichZoom' in snapshot && (snapshot as { logRichZoom?: boolean }).logRichZoom !== undefined) {
    refs.logRichScale.value = (snapshot as { logRichZoom: boolean }).logRichZoom
  }
  if (snapshot.logScaleX !== undefined) refs.logScaleX.value = snapshot.logScaleX
  if (snapshot.logScaleY !== undefined) refs.logScaleY.value = snapshot.logScaleY
  if (snapshot.originalViewMode !== undefined) {
    refs.originalViewMode.value = snapshot.originalViewMode
  }
  if (snapshot.lorenzCurve !== undefined) refs.lorenzCurve.value = snapshot.lorenzCurve
  if (snapshot.empiricalCdf !== undefined) refs.empiricalCdf.value = snapshot.empiricalCdf
  if (snapshot.empiricalPdf !== undefined) refs.empiricalPdf.value = snapshot.empiricalPdf
  if (snapshot.showEmpiricalDistribution !== undefined) {
    refs.showEmpiricalDistribution.value = snapshot.showEmpiricalDistribution
  }
  if (snapshot.showSmoothDistribution !== undefined) {
    refs.showSmoothDistribution.value = snapshot.showSmoothDistribution
  }
  if (snapshot.hiddenApproxIntervals !== undefined) {
    refs.hiddenApproxIntervals.value = new Set(snapshot.hiddenApproxIntervals)
  }
}

export function serializeTimeSeriesState(refs: TimeSeriesPanelRefs): TimeSeriesPanelSnapshot {
  return {
    countryCode: refs.countryCode.value,
    variable: refs.variable.value,
    age: refs.age.value,
    pop: refs.pop.value,
    partitionMode: refs.partitionMode.value,
    customBreakpoints: [...refs.customBreakpoints.value],
  }
}

export function applyTimeSeriesSnapshot(
  refs: TimeSeriesPanelRefs,
  snapshot: TimeSeriesPanelSnapshot,
): void {
  if (snapshot.countryCode !== undefined) refs.countryCode.value = snapshot.countryCode
  if (snapshot.variable !== undefined) refs.variable.value = snapshot.variable
  if (snapshot.age !== undefined) refs.age.value = snapshot.age
  if (snapshot.pop !== undefined) refs.pop.value = snapshot.pop
  if (snapshot.partitionMode !== undefined) refs.partitionMode.value = snapshot.partitionMode
  if (snapshot.customBreakpoints !== undefined) {
    refs.customBreakpoints.value = [...snapshot.customBreakpoints]
  }
}

export function serializeTimeSeriesCompareState(
  refs: TimeSeriesComparePanelRefs,
): TimeSeriesComparePanelSnapshot {
  return {
    countryCodes: [...refs.countryCodes.value],
    variable: refs.variable.value,
    percentile: refs.percentile.value,
    customLo: refs.customLo.value,
    customHi: refs.customHi.value,
    decileSubSelection: refs.decileSubSelection.value,
    age: refs.age.value,
    pop: refs.pop.value,
  }
}

export function applyTimeSeriesCompareSnapshot(
  refs: TimeSeriesComparePanelRefs,
  snapshot: TimeSeriesComparePanelSnapshot,
): void {
  if (snapshot.countryCodes !== undefined) refs.countryCodes.value = [...snapshot.countryCodes]
  if (snapshot.variable !== undefined) refs.variable.value = snapshot.variable
  if (snapshot.percentile !== undefined) refs.percentile.value = snapshot.percentile
  if (snapshot.customLo !== undefined) refs.customLo.value = snapshot.customLo
  if (snapshot.customHi !== undefined) refs.customHi.value = snapshot.customHi
  if (snapshot.decileSubSelection !== undefined) {
    refs.decileSubSelection.value = snapshot.decileSubSelection
  }
  if (snapshot.age !== undefined) refs.age.value = snapshot.age
  if (snapshot.pop !== undefined) refs.pop.value = snapshot.pop
}
