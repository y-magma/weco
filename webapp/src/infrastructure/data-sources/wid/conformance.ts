/**
 * Compare WID API responses against the local CSV reference dump.
 */

export interface ProfilePointLike {
  percentile: string
  rank: number
  value: number
}

export interface ProfileMismatch {
  percentile: string
  kind: 'missing_api' | 'missing_reference' | 'value_diff'
  reference?: number
  api?: number
  absDiff?: number
}

export interface ProfileCompareResult {
  referenceCount: number
  apiCount: number
  matched: number
  mismatches: ProfileMismatch[]
  ok: boolean
}

export interface ConformanceCase {
  country: string
  variable: string
  age: string
  pop: string
  year: number
  label?: string
}

/**
 * Canonical battery: local CSV is the structural reference for these requests.
 *
 * WID.world revises published series over time. The CSV dump (bulk export) and
 * the live API therefore diverge slightly on recent years — especially in the
 * top 0.01 % tail. Example (FR, ahwealj992, 2021, p99.999p100):
 *   CSV dump → 1 345 288 839,4 €
 *   live API → 1 345 288 900,4 €  (Δ ≈ 61 €, < 0,001 %)
 * The app uses the live API; tolerances below accept this vintage drift.
 */
export const CONFORMANCE_CASES: ConformanceCase[] = [
  { country: 'FR', variable: 'ahweal', age: '992', pop: 'j', year: 2021, label: 'FR patrimoine moyen 2021' },
  { country: 'FR', variable: 'ahweal', age: '992', pop: 'j', year: 2023, label: 'FR patrimoine moyen 2023' },
  { country: 'FR', variable: 'thweal', age: '992', pop: 'j', year: 2023, label: 'FR patrimoine seuil 2023' },
  { country: 'FR', variable: 'aptinc', age: '992', pop: 'j', year: 2021, label: 'FR revenu avant impôt moyen 2021' },
  { country: 'FR', variable: 'aptinc', age: '992', pop: 'j', year: 2023, label: 'FR revenu avant impôt moyen 2023' },
  { country: 'US', variable: 'ahweal', age: '992', pop: 'j', year: 2020, label: 'US patrimoine moyen 2020' },
  { country: 'DE', variable: 'ahweal', age: '992', pop: 'j', year: 2022, label: 'DE patrimoine moyen 2022' },
]

/** Default tolerances for API vs CSV dump (minor rounding / vintage drift). */
export const DEFAULT_REL_TOL = 1e-3
export const DEFAULT_ABS_TOL = 5

export function valuesMatch(
  reference: number,
  api: number,
  relTol = DEFAULT_REL_TOL,
  absTol = DEFAULT_ABS_TOL,
): boolean {
  if (reference === api) return true
  const diff = Math.abs(reference - api)
  if (diff <= absTol) return true
  const scale = Math.max(Math.abs(reference), Math.abs(api), 1)
  return diff / scale <= relTol
}

export type ProfileSideBySideStatus =
  | 'equal'
  | 'strict_diff'
  | 'missing_csv'
  | 'missing_api'

export interface ProfileSideBySideRow {
  percentile: string
  rank: number
  csv?: number
  api?: number
  absDiff?: number
  status: ProfileSideBySideStatus
}

export interface StrictCompareResult {
  rows: ProfileSideBySideRow[]
  gPercentileCount: number
  csvCount: number
  apiCount: number
  /** Rows where CSV and API values are strictly equal (`===`). */
  exactMatchCount: number
  /** Rows present in both sources with different values (`!==`). */
  strictDiffCount: number
  missingCsvCount: number
  missingApiCount: number
}

/**
 * Build a side-by-side view of CSV vs API for each g-percentile.
 * Uses strict equality (`===`) — no tolerance.
 */
export function compareProfilesStrict(
  reference: ProfilePointLike[],
  api: ProfilePointLike[],
  percentileOrder: string[],
): StrictCompareResult {
  const refMap = new Map(reference.map((p) => [p.percentile, p.value]))
  const apiMap = new Map(api.map((p) => [p.percentile, p.value]))
  const rankMap = new Map([
    ...reference.map((p) => [p.percentile, p.rank] as const),
    ...api.map((p) => [p.percentile, p.rank] as const),
  ])

  const rows: ProfileSideBySideRow[] = []
  let exactMatchCount = 0
  let strictDiffCount = 0
  let missingCsvCount = 0
  let missingApiCount = 0

  for (const percentile of percentileOrder) {
    const csv = refMap.get(percentile)
    const apiValue = apiMap.get(percentile)
    const rank = rankMap.get(percentile) ?? Number.NaN

    if (csv === undefined && apiValue === undefined) continue

    if (csv === undefined) {
      missingCsvCount++
      rows.push({ percentile, rank, api: apiValue, status: 'missing_csv' })
      continue
    }
    if (apiValue === undefined) {
      missingApiCount++
      rows.push({ percentile, rank, csv, status: 'missing_api' })
      continue
    }
    if (csv === apiValue) {
      exactMatchCount++
      rows.push({ percentile, rank, csv, api: apiValue, absDiff: 0, status: 'equal' })
      continue
    }

    strictDiffCount++
    rows.push({
      percentile,
      rank,
      csv,
      api: apiValue,
      absDiff: Math.abs(csv - apiValue),
      status: 'strict_diff',
    })
  }

  return {
    rows,
    gPercentileCount: percentileOrder.length,
    csvCount: reference.length,
    apiCount: api.length,
    exactMatchCount,
    strictDiffCount,
    missingCsvCount,
    missingApiCount,
  }
}

export function compareProfiles(
  reference: ProfilePointLike[],
  api: ProfilePointLike[],
  relTol = DEFAULT_REL_TOL,
  absTol = DEFAULT_ABS_TOL,
): ProfileCompareResult {
  const refMap = new Map(reference.map((p) => [p.percentile, p.value]))
  const apiMap = new Map(api.map((p) => [p.percentile, p.value]))
  const mismatches: ProfileMismatch[] = []
  let matched = 0

  for (const [percentile, refValue] of refMap) {
    if (!apiMap.has(percentile)) {
      mismatches.push({ percentile, kind: 'missing_api', reference: refValue })
      continue
    }
    const apiValue = apiMap.get(percentile)!
    if (!valuesMatch(refValue, apiValue, relTol, absTol)) {
      mismatches.push({
        percentile,
        kind: 'value_diff',
        reference: refValue,
        api: apiValue,
        absDiff: Math.abs(refValue - apiValue),
      })
      continue
    }
    matched++
  }

  for (const [percentile, apiValue] of apiMap) {
    if (!refMap.has(percentile)) {
      mismatches.push({ percentile, kind: 'missing_reference', api: apiValue })
    }
  }

  mismatches.sort((a, b) => a.percentile.localeCompare(b.percentile))

  return {
    referenceCount: reference.length,
    apiCount: api.length,
    matched,
    mismatches,
    ok: mismatches.length === 0 && reference.length > 0 && api.length > 0,
  }
}
