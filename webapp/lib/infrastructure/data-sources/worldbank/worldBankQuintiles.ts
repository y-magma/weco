/** Bundle variable: WDI quintile income shares (5 × 20 %). */
export const WDI_QUINTILE_BUNDLE_ID = 'WDI_QUINTILE_BUNDLE'

export const WDI_QUINTILE_IDS = [
  'SI.DST.FRST.20',
  'SI.DST.02ND.20',
  'SI.DST.03RD.20',
  'SI.DST.04TH.20',
  'SI.DST.05TH.20',
] as const

export type WdiQuintileId = (typeof WDI_QUINTILE_IDS)[number]

export const WDI_QUINTILE_OPTIONS: readonly {
  id: WdiQuintileId
  label: string
  shortLabel: string
}[] = [
  { id: 'SI.DST.FRST.20', label: 'Q1 — 20 % les plus pauvres', shortLabel: 'Q1' },
  { id: 'SI.DST.02ND.20', label: 'Q2', shortLabel: 'Q2' },
  { id: 'SI.DST.03RD.20', label: 'Q3', shortLabel: 'Q3' },
  { id: 'SI.DST.04TH.20', label: 'Q4', shortLabel: 'Q4' },
  { id: 'SI.DST.05TH.20', label: 'Q5 — 20 % les plus riches', shortLabel: 'Q5' },
]

export function isWdiQuintileBundleVariable(id: string): boolean {
  return id === WDI_QUINTILE_BUNDLE_ID
}

export function isWdiQuintileId(id: string): id is WdiQuintileId {
  return (WDI_QUINTILE_IDS as readonly string[]).includes(id)
}
