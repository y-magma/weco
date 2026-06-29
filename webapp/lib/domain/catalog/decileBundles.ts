import type { SourceIndicator } from '@domain/entities'

/** Bundle variable: loads all PIP decile shares together. */
export const PIP_DECILE_BUNDLE_ID = 'PIP_DECILE_SHARES'

export const PIP_DECILE_IDS = [
  'decile1',
  'decile2',
  'decile3',
  'decile4',
  'decile5',
  'decile6',
  'decile7',
  'decile8',
  'decile9',
  'decile10',
] as const

export const PIP_DECILE_OPTIONS: readonly {
  id: (typeof PIP_DECILE_IDS)[number]
  label: string
  shortLabel: string
}[] = [
  { id: 'decile1', label: 'D1 — 10 % les plus pauvres', shortLabel: 'D1' },
  { id: 'decile2', label: 'D2', shortLabel: 'D2' },
  { id: 'decile3', label: 'D3', shortLabel: 'D3' },
  { id: 'decile4', label: 'D4', shortLabel: 'D4' },
  { id: 'decile5', label: 'D5', shortLabel: 'D5' },
  { id: 'decile6', label: 'D6', shortLabel: 'D6' },
  { id: 'decile7', label: 'D7', shortLabel: 'D7' },
  { id: 'decile8', label: 'D8', shortLabel: 'D8' },
  { id: 'decile9', label: 'D9', shortLabel: 'D9' },
  { id: 'decile10', label: 'D10 — 10 % les plus riches', shortLabel: 'D10' },
]

export const PIP_DECILE_PROFILE_HELP =
  'Parts de welfare (revenu ou consommation selon pays) par décile enquête WB'

/** Bundle variable: loads all published OECD decile ratios together. */
export const OECD_DECILE_BUNDLE_ID = 'INC_DISP_DECILE_RATIOS'

export const OECD_DECILE_RATIO_IDS = [
  'D9_1_INC_DISP',
  'D5_1_INC_DISP',
  'D9_5_INC_DISP',
] as const

export const OECD_DECILE_RATIO_OPTIONS: readonly {
  id: (typeof OECD_DECILE_RATIO_IDS)[number]
  label: string
  shortLabel: string
}[] = [
  { id: 'D9_1_INC_DISP', label: 'P90 / P10', shortLabel: 'D9/D1' },
  { id: 'D5_1_INC_DISP', label: 'P50 / P10', shortLabel: 'D5/D1' },
  { id: 'D9_5_INC_DISP', label: 'P90 / P50', shortLabel: 'D9/D5' },
]

/** Bundle variable: WDI quintile income shares (5 × 20 %). */
export const WDI_QUINTILE_BUNDLE_ID = 'WDI_QUINTILE_BUNDLE'

export const WDI_QUINTILE_IDS = [
  'SI.DST.FRST.20',
  'SI.DST.02ND.20',
  'SI.DST.03RD.20',
  'SI.DST.04TH.20',
  'SI.DST.05TH.20',
] as const

export const WDI_QUINTILE_OPTIONS: readonly {
  id: (typeof WDI_QUINTILE_IDS)[number]
  label: string
  shortLabel: string
}[] = [
  { id: 'SI.DST.FRST.20', label: 'Q1 — 20 % les plus pauvres', shortLabel: 'Q1' },
  { id: 'SI.DST.02ND.20', label: 'Q2', shortLabel: 'Q2' },
  { id: 'SI.DST.03RD.20', label: 'Q3', shortLabel: 'Q3' },
  { id: 'SI.DST.04TH.20', label: 'Q4', shortLabel: 'Q4' },
  { id: 'SI.DST.05TH.20', label: 'Q5 — 20 % les plus riches', shortLabel: 'Q5' },
]

export const WDI_QUINTILE_PROFILE_HELP =
  'Parts de revenu WDI par quintile (5 × 20 %) — granularité plus grossière que les déciles PIP'

/** Variables profil exploration World Bank (pas de centiles WID). */
export const WORLD_BANK_EXPLORATION_PROFILE_BUNDLE_IDS = [
  PIP_DECILE_BUNDLE_ID,
  WDI_QUINTILE_BUNDLE_ID,
] as const

const WORLD_BANK_EXPLORATION_PROFILE_BUNDLE_SET = new Set<string>(
  WORLD_BANK_EXPLORATION_PROFILE_BUNDLE_IDS,
)

export function isWorldBankExplorationProfileBundle(id: string): boolean {
  return WORLD_BANK_EXPLORATION_PROFILE_BUNDLE_SET.has(id)
}

export interface DecileBundleOption {
  id: string
  label: string
  shortLabel?: string
}

export interface DecileBundleConfig {
  bundleId: string
  options: readonly DecileBundleOption[]
  /** Label for compare-panel sub-selector. */
  subSelectorLabel: string
  /** Time-series subtitle fragment. */
  seriesSubtitle: string
}

export function isPipDecileBundleVariable(id: string): boolean {
  return id === PIP_DECILE_BUNDLE_ID
}

export function isOecdDecileBundleVariable(id: string): boolean {
  return id === OECD_DECILE_BUNDLE_ID
}

export function isWdiQuintileBundleVariable(id: string): boolean {
  return id === WDI_QUINTILE_BUNDLE_ID
}

export function isDecileBundleVariable(id: string): boolean {
  return isOecdDecileBundleVariable(id)
    || isPipDecileBundleVariable(id)
    || isWdiQuintileBundleVariable(id)
}

export function getDecileBundleConfig(variableId: string): DecileBundleConfig | undefined {
  if (isOecdDecileBundleVariable(variableId)) {
    return {
      bundleId: OECD_DECILE_BUNDLE_ID,
      options: OECD_DECILE_RATIO_OPTIONS,
      subSelectorLabel: 'Ratio décile',
      seriesSubtitle: 'ratios inter-déciles',
    }
  }
  if (isPipDecileBundleVariable(variableId)) {
    return {
      bundleId: PIP_DECILE_BUNDLE_ID,
      options: PIP_DECILE_OPTIONS,
      subSelectorLabel: 'Décile',
      seriesSubtitle: 'parts par décile',
    }
  }
  if (isWdiQuintileBundleVariable(variableId)) {
    return {
      bundleId: WDI_QUINTILE_BUNDLE_ID,
      options: WDI_QUINTILE_OPTIONS,
      subSelectorLabel: 'Quintile',
      seriesSubtitle: 'parts par quintile',
    }
  }
  return undefined
}

export function decileBundleSubIds(variableId: string): readonly string[] {
  const config = getDecileBundleConfig(variableId)
  return config?.options.map((item) => item.id) ?? []
}

export function decileBundleSubIdsForLoad(variableId: string): readonly string[] {
  if (isOecdDecileBundleVariable(variableId)) return OECD_DECILE_RATIO_IDS
  if (isPipDecileBundleVariable(variableId)) return PIP_DECILE_IDS
  if (isWdiQuintileBundleVariable(variableId)) return WDI_QUINTILE_IDS
  return []
}

export function labelForDecileBundleSub(
  variableId: string,
  subId: string,
): string | undefined {
  return getDecileBundleConfig(variableId)?.options.find((item) => item.id === subId)?.label
}

/** Variables du 1er panneau série temporelle WB : parts empilées uniquement. */
export const WORLD_BANK_PRIMARY_TIME_SERIES_IDS = [
  PIP_DECILE_BUNDLE_ID,
  WDI_QUINTILE_BUNDLE_ID,
] as const

const WORLD_BANK_PRIMARY_TIME_SERIES_SET = new Set<string>(WORLD_BANK_PRIMARY_TIME_SERIES_IDS)

export function isWorldBankPrimaryTimeSeriesIndicator(id: string): boolean {
  return WORLD_BANK_PRIMARY_TIME_SERIES_SET.has(id)
}

export function worldBankPrimaryTimeSeriesIndicators(
  indicators: readonly SourceIndicator[],
): readonly SourceIndicator[] {
  return indicators.filter((item) => WORLD_BANK_PRIMARY_TIME_SERIES_SET.has(item.id))
}
