/** Bundle variable: loads all published OECD decile ratios together. */
export const OECD_DECILE_BUNDLE_ID = 'INC_DISP_DECILE_RATIOS'

/** Ratio indicator ids published in OECD IDD SDMX (not D1–D9 thresholds). */
export const OECD_DECILE_RATIO_IDS = [
  'D9_1_INC_DISP',
  'D5_1_INC_DISP',
  'D9_5_INC_DISP',
] as const

export type OecdDecileRatioId = (typeof OECD_DECILE_RATIO_IDS)[number]

export const OECD_DECILE_RATIO_OPTIONS: readonly {
  id: OecdDecileRatioId
  label: string
  shortLabel: string
}[] = [
  { id: 'D9_1_INC_DISP', label: 'P90 / P10', shortLabel: 'D9/D1' },
  { id: 'D5_1_INC_DISP', label: 'P50 / P10', shortLabel: 'D5/D1' },
  { id: 'D9_5_INC_DISP', label: 'P90 / P50', shortLabel: 'D9/D5' },
]

export function isOecdDecileBundleVariable(id: string): boolean {
  return id === OECD_DECILE_BUNDLE_ID
}

export function isOecdDecileRatioId(id: string): id is OecdDecileRatioId {
  return (OECD_DECILE_RATIO_IDS as readonly string[]).includes(id)
}

export const OECD_DECILE_PROFILE_HELP =
  'L\'API OECD publie les ratios inter-déciles (P90/P10, P50/P10, P90/P50), pas les 127 centiles WID ni les seuils D1–D9 individuels.'
