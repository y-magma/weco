/**
 * WID variable / age / population codes used by the profile panel.
 * See spec/version1.md (Sémantique des préfixes, Schéma brut WID).
 *
 * A WID "indicator" is a 6-letter sixlet: 1 letter for the measure type
 * (a = average, t = threshold, s = share, g = Gini…) + 5 letters for the
 * income/wealth concept (hweal = net personal wealth, ptinc = pre-tax income…).
 */

import { buildGPercentiles } from '@domain/services/percentiles'

export type MeasureKind = 'average' | 'threshold' | 'share' | 'gini' | 'groupLevel' | 'other'

export type WidVariableGroup = 'income' | 'wealth' | 'carbon'

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
  if (head === 's') return 'share'
  if (head === 'g') return 'gini'
  if (head === 'l') return 'groupLevel'
  return 'other'
}

/** Threshold semantics for CDF/PDF/Lorenz (lower-bound placement, strict PDF eligibility). */
export function isThresholdLikeKind(kind: MeasureKind): boolean {
  return kind === 'threshold' || kind === 'groupLevel'
}

/** Percentile code for aggregate indicators (Gini) published at population level. */
export const WID_SCALAR_PERCENTILE = 'p0p100'

/**
 * Percentile codes to request from the WID API for a given indicator.
 * Gini is a single scalar (`p0p100`); distributional series use the 127 g-percentiles.
 */
export function profilePercentilesFor(sixlet: string): string[] {
  if (measureKind(sixlet) === 'gini') return [WID_SCALAR_PERCENTILE]
  return buildGPercentiles()
}

/** Expected number of percentile observations for completeness checks in the UI. */
export function expectedProfilePointCount(sixlet: string): number {
  return profilePercentilesFor(sixlet).length
}

/** Representative percentiles used to probe the year span of a profile variable. */
export function profileYearProbePercentiles(sixlet: string): readonly string[] {
  if (measureKind(sixlet) === 'gini') return [WID_SCALAR_PERCENTILE]
  return ['p50p51', 'p0p1', 'p90p100'] as const
}

/** CDF / PDF / Lorenz modes apply to average, threshold and group-level (l…) distributions. */
export function supportsDistributionAnalytics(sixlet: string): boolean {
  const kind = measureKind(sixlet)
  return kind === 'average' || isThresholdLikeKind(kind)
}

const GROUP_LABELS: Record<WidVariableGroup, string> = {
  wealth: 'Patrimoine',
  income: 'Revenus',
  carbon: 'Carbone',
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
 * Variables exposées dans le panneau de visualisation.
 * Paires moyenne / seuil pour le patrimoine net et le revenu avant impôt,
 * parts (s…) et Gini (g…) associés, revenus travail/capital (pllin / pkkin),
 * plus l’empreinte CO₂ (`lpfcar`, préfixe l = niveau par groupe, sémantique seuil pour CDF/PDF).
 * Pour les variables carbone, utiliser age=999 (tous âges) et pop=i (individus).
 */
export const WID_PROFILE_VARIABLES: WidVariable[] = [
  v('ahweal', 'Patrimoine net moyen', 'hweal', 'monnaie locale constante', 'wealth'),
  v('thweal', 'Patrimoine net — seuil', 'hweal', 'monnaie locale constante', 'wealth'),
  v('shweal', 'Part du patrimoine net', 'hweal', 'part (0–1)', 'wealth'),
  v('ghweal', 'Gini — patrimoine net', 'hweal', 'coefficient de Gini', 'wealth'),
  v('aptinc', 'Revenu avant impôt moyen', 'ptinc', 'monnaie locale constante', 'income'),
  v('tptinc', 'Revenu avant impôt — seuil', 'ptinc', 'monnaie locale constante', 'income'),
  v('sptinc', 'Part du revenu avant impôt', 'ptinc', 'part (0–1)', 'income'),
  v('gptinc', 'Gini — revenu avant impôt', 'ptinc', 'coefficient de Gini', 'income'),
  v('apllin', 'Revenu du travail moyen', 'pllin', 'monnaie locale constante', 'income'),
  v('tpllin', 'Revenu du travail — seuil', 'pllin', 'monnaie locale constante', 'income'),
  v('apkkin', 'Revenu du capital moyen', 'pkkin', 'monnaie locale constante', 'income'),
  v('tpkkin', 'Revenu du capital — seuil', 'pkkin', 'monnaie locale constante', 'income'),
  v('lpfcar', 'Empreinte CO₂ personnelle', 'pfcar', 'tCO₂ / pers. / an', 'carbon'),
]

export function findWidVariable(sixlet: string): WidVariable | undefined {
  return WID_PROFILE_VARIABLES.find((item) => item.sixlet === sixlet)
}

export const WID_THRESHOLD_VARIABLES = WID_PROFILE_VARIABLES.filter((item) => item.kind === 'threshold')

/** Variables sélectionnables en PDF empirique (seuil t… ou niveau l… sans jumelle t…). */
export const WID_STRICT_DISTRIBUTION_VARIABLES = WID_PROFILE_VARIABLES.filter((item) =>
  isThresholdLikeKind(item.kind),
)

/** Retourne la variable seuil jumelle (même concept), ou la variable courante si aucune paire t… n’existe. */
export function thresholdVariableFor(sixlet: string): string {
  const current = findWidVariable(sixlet)
  if (!current) return sixlet
  if (isThresholdLikeKind(current.kind)) return sixlet
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
  { value: '992', label: 'Adultes (20 ans et +)' },
  { value: '999', label: 'Tous âges' },
  { value: '991', label: 'Moins de 20 ans' },
]

/** Population unit codes (1 letter). Mandatory filter — see version1.md. */
export const WID_POP_OPTIONS: CodeOption[] = [
  { value: 'j', label: 'Adultes equal-split' },
  { value: 'i', label: 'Individus' },
  { value: 't', label: 'Foyers fiscaux' },
]

export const WID_DEFAULT_AGE = '992'
export const WID_DEFAULT_POP = 'j'

export interface WidParamCombo {
  age: string
  pop: string
}

/** Canonical age/pop defaults by variable group (optimistic UI + resolve order). */
export const WID_GROUP_DEFAULTS: Record<WidVariableGroup, WidParamCombo[]> = {
  wealth: [
    { age: '992', pop: 'j' },
    { age: '992', pop: 'i' },
    { age: '999', pop: 'i' },
  ],
  income: [
    { age: '992', pop: 'j' },
    { age: '992', pop: 'i' },
    { age: '999', pop: 'i' },
  ],
  carbon: [{ age: '999', pop: 'i' }],
}

/** Fallback combos shown before API metadata arrives. */
export function knownParamCombosForVariable(sixlet: string): WidParamCombo[] {
  const meta = findWidVariable(sixlet)
  if (!meta) return [{ age: WID_DEFAULT_AGE, pop: WID_DEFAULT_POP }]
  return WID_GROUP_DEFAULTS[meta.group]
}

/** Build the API variable code `sixlet_percentile_age_pop`. */
export function buildVariableCode(
  sixlet: string,
  percentile: string,
  age: string,
  pop: string,
): string {
  return `${sixlet}_${percentile}_${age}_${pop}`
}
