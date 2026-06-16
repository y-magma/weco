import type { IndicatorMeta } from '@domain/entities'

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
