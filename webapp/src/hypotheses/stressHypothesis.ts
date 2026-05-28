import type { Hypothesis } from '@src/hypotheses/types'

export const stressHypothesis: Hypothesis = {
  id: 'stress-inequality-correlation',
  title: 'Inequality vs social stress',
  description:
    'Higher top-income shares are associated with higher social stress proxy values across countries and over time.',
  expectedRelationship: 'positive',
  variables: [
    {
      id: 'inequality',
      role: 'independent',
      label: 'Top 10% income share',
      indicatorId: 'sptinc',
    },
    {
      id: 'stress',
      role: 'dependent',
      label: 'Social stress proxy',
      indicatorId: 'stress_index',
    },
  ],
  defaultCountry: 'FR',
  defaultYearFrom: 1980,
  defaultYearTo: 2023,
  chartDefaults: {
    timeSeriesTitle: 'Inequality and stress over time',
    scatterTitle: 'Inequality vs stress (all countries)',
  },
}

export const hypotheses = [stressHypothesis]

export function getHypothesis(id: string): Hypothesis | undefined {
  return hypotheses.find((item) => item.id === id)
}
