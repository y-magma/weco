import type { IndicatorMeta } from '@src/domain/types'

export const WID_COUNTRIES: { code: string; label: string }[] = [
  { code: 'FR', label: 'France' },
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'DE', label: 'Germany' },
  { code: 'BR', label: 'Brazil' },
  { code: 'IN', label: 'India' },
  { code: 'ZA', label: 'South Africa' },
  { code: 'CN', label: 'China' },
]

export const WID_INDICATORS: IndicatorMeta[] = [
  {
    id: 'sptinc',
    label: 'Top 10% income share',
    description: 'Share of total pre-tax national income held by the top 10%.',
    unit: '%',
    sourceId: 'wid',
  },
  {
    id: 'sptop1',
    label: 'Top 1% income share',
    description: 'Share of total pre-tax national income held by the top 1%.',
    unit: '%',
    sourceId: 'wid',
  },
  {
    id: 'ghini',
    label: 'Gini coefficient',
    description: 'Pre-tax national income Gini coefficient.',
    unit: 'index',
    sourceId: 'wid',
  },
  {
    id: 'ahwbus',
    label: 'Average household wealth',
    description: 'Average net household wealth (PPP euros).',
    unit: 'EUR',
    sourceId: 'wid',
  },
]

export const WID_STRESS_PROXY_INDICATORS: IndicatorMeta[] = [
  {
    id: 'stress_index',
    label: 'Social stress proxy (sample)',
    description:
      'Placeholder composite index for hypothesis testing until external stress data is connected.',
    unit: 'index',
    sourceId: 'wid',
  },
]
