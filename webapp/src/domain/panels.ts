/**
 * Pure helpers for the multi-panel view (spec/version1.md, graphe #5 :
 * « choisir le nombre de graphes en parallèle »).
 */

export const MIN_PANELS = 1
export const MAX_PANELS = 4

/** Clamp an arbitrary (possibly NaN) count into [MIN_PANELS, MAX_PANELS]. */
export function clampPanelCount(
  count: number,
  min = MIN_PANELS,
  max = MAX_PANELS,
): number {
  if (!Number.isFinite(count)) return min
  return Math.min(max, Math.max(min, Math.round(count)))
}

/**
 * Vuetify column span (out of 12) for a given number of panels:
 * 1 → 12, 2 → 6, 3 → 4, 4 → 6 (2×2). Out-of-range counts are clamped first.
 */
export function panelColSpan(count: number): number {
  const n = clampPanelCount(count)
  switch (n) {
    case 1: return 12
    case 2: return 6
    case 3: return 4
    default: return 6
  }
}

/**
 * Default variable assignment for `count` panels, cycling through the available
 * sixlets so panels start on distinct variables when possible.
 */
export function defaultPanelVariables(count: number, variables: string[]): string[] {
  const n = clampPanelCount(count)
  if (variables.length === 0) return Array.from({ length: n }, () => '')
  return Array.from({ length: n }, (_, i) => variables[i % variables.length]!)
}

/**
 * Resize a list of panel variables to `count` entries, preserving existing
 * choices and filling new slots with cycling defaults.
 */
export function resizePanelVariables(
  current: string[],
  count: number,
  variables: string[],
): string[] {
  const n = clampPanelCount(count)
  const defaults = defaultPanelVariables(n, variables)
  return Array.from({ length: n }, (_, i) => current[i] ?? defaults[i]!)
}
