import type { SourceIndicator } from '@domain/entities'
import { OECD_DECILE_BUNDLE_ID } from '@domain/catalog/oecdDeciles'

export interface OecdIddIndicatorDef extends SourceIndicator {
  measure: string
  statisticalOperation: string
  unitMeasure: string
  povertyLine: string
}

const OECD_IDD_BASE = 'OECD.WISE.INE,DSD_WISE_IDD@DF_IDD,1.0'

const INDICATOR_DEFS: readonly OecdIddIndicatorDef[] = [
  {
    id: 'INC_MRKT_GINI',
    label: 'Gini — revenu de marché',
    unit: '0–1',
    group: 'gini',
    groupLabel: 'Inégalité',
    kind: 'gini',
    concept: 'Pré-impôt, revenu de marché',
    measure: 'INC_MRKT_GINI',
    statisticalOperation: '_Z',
    unitMeasure: '0_TO_1',
    povertyLine: '_Z',
  },
  {
    id: 'INC_DISP_GINI',
    label: 'Gini — revenu disponible',
    unit: '0–1',
    group: 'gini',
    groupLabel: 'Inégalité',
    kind: 'gini',
    concept: 'Post-impôt + transferts',
    measure: 'INC_DISP_GINI',
    statisticalOperation: '_Z',
    unitMeasure: '0_TO_1',
    povertyLine: '_Z',
  },
  {
    id: OECD_DECILE_BUNDLE_ID,
    label: 'Ratios déciles — revenu disponible',
    unit: 'ratio',
    group: 'decile',
    groupLabel: 'Déciles',
    kind: 'scalar',
    concept: 'Ratios inter-déciles OECD (P90/P10, P50/P10, P90/P50)',
    measure: 'INC_DISP',
    statisticalOperation: '_Z',
    unitMeasure: 'FCTR',
    povertyLine: '_Z',
  },
  {
    id: 'D9_1_INC_DISP',
    label: 'Ratio P90/P10',
    unit: 'ratio',
    group: 'decile',
    groupLabel: 'Déciles',
    kind: 'scalar',
    concept: 'Ratio 9e / 1er décile (revenu disponible)',
    measure: 'D9_1_INC_DISP',
    statisticalOperation: '_Z',
    unitMeasure: 'FCTR',
    povertyLine: '_Z',
  },
  {
    id: 'D5_1_INC_DISP',
    label: 'Ratio P50/P10',
    unit: 'ratio',
    group: 'decile',
    groupLabel: 'Déciles',
    kind: 'scalar',
    concept: 'Ratio 5e / 1er décile (revenu disponible)',
    measure: 'D5_1_INC_DISP',
    statisticalOperation: '_Z',
    unitMeasure: 'FCTR',
    povertyLine: '_Z',
  },
  {
    id: 'D9_5_INC_DISP',
    label: 'Ratio P90/P50',
    unit: 'ratio',
    group: 'decile',
    groupLabel: 'Déciles',
    kind: 'scalar',
    concept: 'Ratio 9e / 5e décile (revenu disponible)',
    measure: 'D9_5_INC_DISP',
    statisticalOperation: '_Z',
    unitMeasure: 'FCTR',
    povertyLine: '_Z',
  },
  {
    id: 'QR_INC_DISP',
    label: 'Quintile share ratio',
    unit: 'ratio',
    group: 'ratio',
    groupLabel: 'Ratios',
    kind: 'scalar',
    concept: 'Part du quintile supérieur / quintile inférieur',
    measure: 'QR_INC_DISP',
    statisticalOperation: '_Z',
    unitMeasure: 'FCTR',
    povertyLine: '_Z',
  },
  {
    id: 'PAL_INC_DISP',
    label: 'Ratio de Palma',
    unit: 'ratio',
    group: 'ratio',
    groupLabel: 'Ratios',
    kind: 'scalar',
    concept: 'Part des 10 % les plus riches / 40 % les plus pauvres',
    measure: 'PAL_INC_DISP',
    statisticalOperation: '_Z',
    unitMeasure: 'FCTR',
    povertyLine: '_Z',
  },
  {
    id: 'INC_DISP_MEDIAN',
    label: 'Revenu disponible médian',
    unit: 'monnaie / ménage éq.',
    group: 'level',
    groupLabel: 'Niveaux',
    kind: 'scalar',
    concept: 'Monnaie nationale par ménage équivalisé',
    measure: 'INC_DISP',
    statisticalOperation: 'MEDIAN',
    unitMeasure: 'XDC_HH_EQ',
    povertyLine: '_Z',
  },
  {
    id: 'PR_INC_DISP_50',
    label: 'Taux pauvreté (50 % médian)',
    unit: '%',
    group: 'poverty',
    groupLabel: 'Pauvreté',
    kind: 'scalar',
    concept: 'Part de la population sous 50 % du revenu médian national',
    measure: 'PR_INC_DISP',
    statisticalOperation: '_Z',
    unitMeasure: 'PT_POP',
    povertyLine: 'PL_50',
  },
] as const

export const OECD_IDD_INDICATORS: readonly SourceIndicator[] = INDICATOR_DEFS

export function findOecdIndicator(id: string): OecdIddIndicatorDef | undefined {
  return INDICATOR_DEFS.find((item) => item.id === id)
}

/** SDMX key segment: REF_AREA.FREQ.MEASURE…POVERTY_LINE (trailing dot). */
export function buildOecdDataPath(indicator: OecdIddIndicatorDef, iso3Country: string): string {
  return [
    iso3Country.toUpperCase(),
    'A',
    indicator.measure,
    indicator.statisticalOperation,
    indicator.unitMeasure,
    '_T',
    'METH2012',
    'D_CUR',
    indicator.povertyLine,
  ].join('.') + '.'
}

export function buildOecdDataUrl(
  indicator: OecdIddIndicatorDef,
  iso3Country: string,
  yearFrom?: number,
  yearTo?: number,
): string {
  const path = buildOecdDataPath(indicator, iso3Country)
  const params = new URLSearchParams({ format: 'csvfilewithlabels' })
  if (yearFrom !== undefined) params.set('startPeriod', String(yearFrom))
  if (yearTo !== undefined) params.set('endPeriod', String(yearTo))
  return `https://sdmx.oecd.org/public/rest/data/${OECD_IDD_BASE}/${path}?${params.toString()}`
}
