import type { InjectionKey, Ref, ComputedRef } from 'vue'
import type { createExplorationPanelState } from '~/composables/useExplorationPanel'

export interface PanneauExplorationExtendedContext {
  state: ReturnType<typeof createExplorationPanelState>
  customBreakpointInput: Ref<number | null>
  customBreakpointError: Ref<string | null>
  showIntervalVisibilityPanel: Ref<boolean>
  selectableBoundaries: ComputedRef<number[]>
  selectableBoundaryItems: ComputedRef<Array<{ title: string, value: number }>>
  customPartitionReadyHint: ComputedRef<string>
  nextBoundaryHint: ComputedRef<string>
  onCustomBoundarySelected: (value: number | null) => void
  removeLastCustomBreakpoint: () => void
  resetCustomBreakpoints: () => void
  toggleLorenzCurve: () => void
  toggleEmpiricalCdf: () => void
  toggleEmpiricalPdf: () => void
  anyDensityActive: ComputedRef<boolean>
  visibleApproxIntervalCount: ComputedRef<number>
}

export const PANNEAU_EXPLORATION_EXTENDED_KEY: InjectionKey<PanneauExplorationExtendedContext> =
  Symbol('panneauExplorationExtended')
