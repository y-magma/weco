export type HypothesisRelationship = 'positive' | 'negative' | 'neutral'

export interface HypothesisVariable {
  id: string
  role: 'independent' | 'dependent' | 'control'
  label: string
  indicatorId: string
}

export interface Hypothesis {
  id: string
  title: string
  description: string
  expectedRelationship: HypothesisRelationship
  variables: HypothesisVariable[]
  defaultCountry: string
  defaultYearFrom: number
  defaultYearTo: number
  chartDefaults: {
    timeSeriesTitle: string
    scatterTitle: string
  }
}
