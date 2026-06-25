import type { SourceIndicator } from '@domain/entities'
import { PIP_DECILE_BUNDLE_ID } from '@infrastructure/data-sources/worldbank/worldBankDeciles'
import { WDI_QUINTILE_BUNDLE_ID } from '@infrastructure/data-sources/worldbank/worldBankQuintiles'

export type WorldBankApi = 'wdi' | 'pip'

export interface WorldBankIndicatorDef extends SourceIndicator {
  api: WorldBankApi
  /** WDI indicator code or PIP CSV column name. */
  field: string
}

export const WORLD_BANK_DEFAULT_POVLINE = 3.65

const INDICATOR_DEFS: readonly WorldBankIndicatorDef[] = [
  {
    id: 'SI.POV.GINI',
    label: 'Gini',
    unit: '0–100',
    group: 'gini',
    groupLabel: 'Inégalité',
    kind: 'gini',
    concept: 'Enquêtes — revenu ou consommation (agrégé WDI)',
    api: 'wdi',
    field: 'SI.POV.GINI',
  },
  {
    id: 'SI.DST.FRST.10',
    label: 'Part revenu — 10 % les plus pauvres',
    unit: '%',
    group: 'share',
    groupLabel: 'Parts',
    kind: 'share',
    concept: 'Comparable qualitatif à WID sptinc (extrême bas)',
    api: 'wdi',
    field: 'SI.DST.FRST.10',
  },
  {
    id: 'SI.DST.10TH.10',
    label: 'Part revenu — 10 % les plus riches',
    unit: '%',
    group: 'share',
    groupLabel: 'Parts',
    kind: 'share',
    concept: 'Extrême haut de la distribution',
    api: 'wdi',
    field: 'SI.DST.10TH.10',
  },
  {
    id: 'SI.POV.DDAY',
    label: 'Pauvreté < 3,00 $/j (PPP 2021)',
    unit: '% pop.',
    group: 'poverty',
    groupLabel: 'Pauvreté',
    kind: 'scalar',
    concept: 'Seuil international — absent du WID',
    api: 'wdi',
    field: 'SI.POV.DDAY',
  },
  {
    id: 'SI.POV.GAPS',
    label: 'Gap de pauvreté (3,00 $/j)',
    unit: '%',
    group: 'poverty',
    groupLabel: 'Pauvreté',
    kind: 'scalar',
    concept: 'Écart moyen sous le seuil international',
    api: 'wdi',
    field: 'SI.POV.GAPS',
  },
  {
    id: WDI_QUINTILE_BUNDLE_ID,
    label: 'Parts par quintile (5 × 20 %)',
    unit: '%',
    group: 'decile',
    groupLabel: 'Quintiles',
    kind: 'share',
    concept: 'Profil grossier WDI — 5 parts par 20 %',
    api: 'wdi',
    field: WDI_QUINTILE_BUNDLE_ID,
  },
  {
    id: 'PIP_GINI',
    label: 'Gini (enquête)',
    unit: '0–1',
    group: 'gini',
    groupLabel: 'Inégalité',
    kind: 'gini',
    concept: 'PIP — revenu ou consommation selon pays',
    api: 'pip',
    field: 'gini',
  },
  {
    id: PIP_DECILE_BUNDLE_ID,
    label: 'Parts par décile (10)',
    unit: 'part (0–1)',
    group: 'decile',
    groupLabel: 'Déciles',
    kind: 'share',
    concept: 'PIP — parts de welfare par décile (revenu ou consommation)',
    api: 'pip',
    field: PIP_DECILE_BUNDLE_ID,
  },
  {
    id: 'PIP_HEADCOUNT',
    label: 'Taux de pauvreté (PIP)',
    unit: '% pop.',
    group: 'poverty',
    groupLabel: 'Pauvreté',
    kind: 'scalar',
    concept: `Seuil ${WORLD_BANK_DEFAULT_POVLINE} $/j (PPP 2017)`,
    api: 'pip',
    field: 'headcount',
  },
  {
    id: 'PIP_POV_GAP',
    label: 'Gap de pauvreté (PIP)',
    unit: '%',
    group: 'poverty',
    groupLabel: 'Pauvreté',
    kind: 'scalar',
    concept: `Seuil ${WORLD_BANK_DEFAULT_POVLINE} $/j (PPP 2017)`,
    api: 'pip',
    field: 'poverty_gap',
  },
] as const

export const WORLD_BANK_INDICATORS: readonly SourceIndicator[] = INDICATOR_DEFS

export function findWorldBankIndicator(id: string): WorldBankIndicatorDef | undefined {
  return INDICATOR_DEFS.find((item) => item.id === id)
}

export function isWorldBankProfileVariable(id: string): boolean {
  return id === PIP_DECILE_BUNDLE_ID || id === WDI_QUINTILE_BUNDLE_ID
}
