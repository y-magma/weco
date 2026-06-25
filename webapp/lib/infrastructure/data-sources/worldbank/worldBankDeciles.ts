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

export type PipDecileId = (typeof PIP_DECILE_IDS)[number]

export const PIP_DECILE_OPTIONS: readonly {
  id: PipDecileId
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

export function isPipDecileBundleVariable(id: string): boolean {
  return id === PIP_DECILE_BUNDLE_ID
}

export function isPipDecileId(id: string): id is PipDecileId {
  return (PIP_DECILE_IDS as readonly string[]).includes(id)
}

/** Mid-rank (percent) for each decile bucket — used in synthetic PercentileProfile. */
export const PIP_DECILE_MID_RANKS: readonly number[] = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95]

export const PIP_DECILE_PROFILE_HELP =
  'Parts de welfare (revenu ou consommation selon pays) par décile enquête WB — 10 tranches, pas les 127 centiles WID.'
