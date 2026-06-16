/**
 * WID variable / age / population codes used by the profile panel.
 * See spec/version1.md (Sémantique des préfixes, Schéma brut WID).
 *
 * A WID "indicator" is a 6-letter sixlet: 1 letter for the measure type
 * (a = average, t = threshold, s = share, g = Gini…) + 5 letters for the
 * income/wealth concept (hweal = net personal wealth, ptinc = pre-tax income…).
 */

import { buildGPercentiles } from '@domain/services/percentiles'

export type MeasureKind = 'average' | 'threshold' | 'other'

export type WidVariableGroup = 'income' | 'wealth'

export interface WidVariable {
  /** Six-letter code, e.g. `ahweal`. */
  sixlet: string
  label: string
  /** Measure kind derived from the first letter. */
  kind: MeasureKind
  /** Stable key to pair average/threshold variants. */
  concept: string
  unit: string
  group: WidVariableGroup
  /** Label for v-select group-by. */
  groupLabel: string
}

/** Number of g-percentiles requested from the API (WID standard grid). */
export const WID_G_PERCENTILE_COUNT = buildGPercentiles().length

/** First-letter prefix -> measure kind. */
export function measureKind(sixlet: string): MeasureKind {
  const head = sixlet.charAt(0).toLowerCase()
  if (head === 'a') return 'average'
  if (head === 't') return 'threshold'
  return 'other'
}

const GROUP_LABELS: Record<WidVariableGroup, string> = {
  wealth: 'Patrimoine',
  income: 'Revenus',
}

function v(
  sixlet: string,
  label: string,
  concept: string,
  unit: string,
  group: WidVariableGroup,
): WidVariable {
  return {
    sixlet,
    label,
    kind: measureKind(sixlet),
    concept,
    unit,
    group,
    groupLabel: GROUP_LABELS[group],
  }
}

/**
 * Variables exposées dans le panneau de visualisation (V1).
 * Paires moyenne / seuil pour le patrimoine net et le revenu avant impôt.
 */
export const WID_PROFILE_VARIABLES: WidVariable[] = [
  v('ahweal', 'Patrimoine net moyen', 'hweal', 'monnaie locale constante', 'wealth'),
  v('thweal', 'Patrimoine net — seuil', 'hweal', 'monnaie locale constante', 'wealth'),
  v('aptinc', 'Revenu avant impôt moyen', 'ptinc', 'monnaie locale constante', 'income'),
  v('tptinc', 'Revenu avant impôt — seuil', 'ptinc', 'monnaie locale constante', 'income'),
]

export function findWidVariable(sixlet: string): WidVariable | undefined {
  return WID_PROFILE_VARIABLES.find((item) => item.sixlet === sixlet)
}

export const WID_THRESHOLD_VARIABLES = WID_PROFILE_VARIABLES.filter((item) => item.kind === 'threshold')

/** Retourne la variable seuil jumelle (même concept). */
export function thresholdVariableFor(sixlet: string): string {
  const current = findWidVariable(sixlet)
  if (!current) return sixlet
  if (current.kind === 'threshold') return sixlet
  const pair = WID_PROFILE_VARIABLES.find(
    (item) => item.concept === current.concept && item.kind === 'threshold',
  )
  return pair?.sixlet ?? sixlet
}

export interface CodeOption {
  value: string
  label: string
}

/** Age group codes (3 digits). Mandatory filter — see version1.md. */
export const WID_AGE_OPTIONS: CodeOption[] = [
  { value: '992', label: '992 — adultes (20 ans et +)' },
  { value: '999', label: '999 — tous âges' },
  { value: '991', label: '991 — moins de 20 ans' },
]

/** Population unit codes (1 letter). Mandatory filter — see version1.md. */
export const WID_POP_OPTIONS: CodeOption[] = [
  { value: 'j', label: 'j — adultes equal-split' },
  { value: 'i', label: 'i — individus' },
  { value: 't', label: 't — foyers fiscaux' },
]

export const WID_DEFAULT_AGE = '992'
export const WID_DEFAULT_POP = 'j'

/** Build the API variable code `sixlet_percentile_age_pop`. */
export function buildVariableCode(
  sixlet: string,
  percentile: string,
  age: string,
  pop: string,
): string {
  return `${sixlet}_${percentile}_${age}_${pop}`
}
