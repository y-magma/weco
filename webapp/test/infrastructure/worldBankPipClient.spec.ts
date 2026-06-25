import { describe, expect, it } from 'vitest'
import {
  extractPipTimeSeries,
  findPipRowForYear,
  parsePipCsv,
  pipProfileYears,
} from '@infrastructure/data-sources/worldbank/worldBankPipClient'

const PIP_SAMPLE_CSV = `region_name,region_code,country_name,country_code,reporting_year,reporting_level,survey_acronym,survey_coverage,survey_year,welfare_type,survey_comparability,comparable_spell,poverty_line,headcount,poverty_gap,poverty_severity,watts,mean,median,mld,gini,polarization,decile1,decile2,decile3,decile4,decile5,decile6,decile7,decile8,decile9,decile10,cpi,ppp,reporting_pop,reporting_gdp,reporting_pce,is_interpolated,distribution_type,estimation_type,spl,spr,pg,estimate_type
South Asia,SAS,India,IND,2021,national,NSS,national,2021,consumption,5,2021,3.65,0.12,0.04,0.01,0.02,3.5,3.0,0.11,0.35,0.22,0.04,0.05,0.06,0.07,0.08,0.09,0.10,0.11,0.12,0.23,1,19,1000000,500,400,FALSE,micro,survey,3,0.5,10,
Europe & Central Asia,ECS,France,FRA,2021,national,EU-SILC,national,2021,income,2,2003 - 2023,3.65,0.001,0.0004,0.0003,0.0008,65,57,0.17,0.315,0.25,0.029,0.047,0.060,0.071,0.081,0.092,0.105,0.120,0.145,0.248,1,0.76,67000000,38000,20000,FALSE,micro,survey,29,0.13,0.62,`

describe('parsePipCsv', () => {
  it('parses deciles, gini and welfare type', () => {
    const rows = parsePipCsv(PIP_SAMPLE_CSV)
    expect(rows).toHaveLength(2)

    const india = rows.find((row) => row.countryCode === 'IND')!
    expect(india.reportingYear).toBe(2021)
    expect(india.welfareType).toBe('consumption')
    expect(india.gini).toBeCloseTo(0.35)
    expect(india.deciles.decile1).toBeCloseTo(0.04)
    expect(india.deciles.decile10).toBeCloseTo(0.23)

    const france = rows.find((row) => row.countryCode === 'FRA')!
    expect(france.welfareType).toBe('income')
    expect(france.deciles.decile10).toBeCloseTo(0.248)
  })

  it('extracts time series for a pip field', () => {
    const rows = parsePipCsv(PIP_SAMPLE_CSV).filter((row) => row.countryCode === 'IND')
    expect(extractPipTimeSeries(rows, 'gini')).toEqual([{ year: 2021, value: 0.35 }])
    expect(extractPipTimeSeries(rows, 'decile3')).toEqual([{ year: 2021, value: 0.06 }])
  })

  it('finds row for year and lists profile years', () => {
    const rows = parsePipCsv(PIP_SAMPLE_CSV).filter((row) => row.countryCode === 'FRA')
    expect(findPipRowForYear(rows, 2021)?.gini).toBeCloseTo(0.315)
    expect(pipProfileYears(rows)).toEqual([2021])
  })
})
