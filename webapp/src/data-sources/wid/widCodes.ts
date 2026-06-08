/**
 * WID variable / age / population codes used by Version 1.
 * See spec/version1.md (Sémantique des préfixes, Schéma brut WID).
 *
 * A WID "indicator" is a 6-letter sixlet: 1 letter for the measure type
 * (a = average, t = threshold, s = share, g = Gini…) + 5 letters for the
 * income/wealth concept (hweal = net personal wealth, ptinc = pre-tax income…).
 */

export type MeasureKind = 'average' | 'threshold' | 'other'

export interface WidVariable {
  /** Six-letter code, e.g. `ahweal`. */
  sixlet: string
  label: string
  /** Measure kind derived from the first letter. */
  kind: MeasureKind
  /** Income/wealth concept label. */
  concept: string
  unit: string
}

/** First-letter prefix -> measure kind. */
export function measureKind(sixlet: string): MeasureKind {
  const head = sixlet.charAt(0).toLowerCase()
  if (head === 'a') return 'average'
  if (head === 't') return 'threshold'
  return 'other'
}

/**
 * Variables exposed in Version 1. We keep matched average/threshold pairs so
 * the profile (a…) and CDF (t…) views share the same concept.
 */
export const WID_V1_VARIABLES: WidVariable[] = [
  {
    sixlet: 'ahweal',
    label: 'Patrimoine net moyen (average)',
    kind: 'average',
    concept: 'Net personal wealth',
    unit: 'monnaie locale constante',
  },
  {
    sixlet: 'thweal',
    label: 'Patrimoine net — seuil (threshold)',
    kind: 'threshold',
    concept: 'Net personal wealth',
    unit: 'monnaie locale constante',
  },
  {
    sixlet: 'aptinc',
    label: 'Revenu avant impôt moyen (average)',
    kind: 'average',
    concept: 'Pre-tax national income',
    unit: 'monnaie locale constante',
  },
  {
    sixlet: 'tptinc',
    label: 'Revenu avant impôt — seuil (threshold)',
    kind: 'threshold',
    concept: 'Pre-tax national income',
    unit: 'monnaie locale constante',
  },
]

export function findWidVariable(sixlet: string): WidVariable | undefined {
  return WID_V1_VARIABLES.find((v) => v.sixlet === sixlet)
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
