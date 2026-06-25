import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { createWorldBankDataSource } from '@infrastructure/data-sources/worldbank/worldBankSource'
import { PIP_DECILE_BUNDLE_ID } from '@infrastructure/data-sources/worldbank/worldBankDeciles'
import { resetWorldBankCountryCache } from '@infrastructure/data-sources/worldbank/worldBankCountries'

const PIP_SAMPLE_CSV = `region_name,region_code,country_name,country_code,reporting_year,reporting_level,survey_acronym,survey_coverage,survey_year,welfare_type,survey_comparability,comparable_spell,poverty_line,headcount,poverty_gap,poverty_severity,watts,mean,median,mld,gini,polarization,decile1,decile2,decile3,decile4,decile5,decile6,decile7,decile8,decile9,decile10,cpi,ppp,reporting_pop,reporting_gdp,reporting_pce,is_interpolated,distribution_type,estimation_type,spl,spr,pg,estimate_type
Europe & Central Asia,ECS,France,FRA,2021,national,EU-SILC,national,2021,income,2,2003 - 2023,3.65,0.001,0.0004,0.0003,0.0008,65,57,0.17,0.315,0.25,0.029,0.047,0.060,0.071,0.081,0.092,0.105,0.120,0.145,0.248,1,0.76,67000000,38000,20000,FALSE,micro,survey,29,0.13,0.62,`

const WDI_GINI_JSON = [
  { page: 1, pages: 1, total: 1 },
  [{ date: '2021', value: 31.5 }],
]

describe('WorldBankDataSource', () => {
  beforeEach(() => {
    resetWorldBankCountryCache()
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('/pip/v1/pip')) {
        return { ok: true, text: async () => PIP_SAMPLE_CSV }
      }
      if (url.includes('/indicator/SI.POV.GINI')) {
        return { ok: true, json: async () => WDI_GINI_JSON }
      }
      if (url.includes('/v2/country?')) {
        return {
          ok: true,
          json: async () => [
            { page: 1, pages: 1 },
            [{ id: 'FRA', iso2Code: 'FR', name: 'France', region: { id: 'ECS' } }],
          ],
        }
      }
      return { ok: false, status: 404, statusText: 'Not Found' }
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('builds percentile profile from PIP deciles', async () => {
    const source = createWorldBankDataSource()
    const profile = await source.fetchPercentileProfile({
      countryCode: 'FR',
      variable: PIP_DECILE_BUNDLE_ID,
      year: 2021,
      age: '',
      pop: '',
    })

    expect(profile.points).toHaveLength(10)
    expect(profile.points[0]).toMatchObject({ percentile: 'decile1', rank: 5, value: 0.029 })
    expect(profile.points[9]).toMatchObject({ percentile: 'decile10', rank: 95, value: 0.248 })
    expect(profile.kind).toBe('share')
  })

  it('lists profile years from PIP', async () => {
    const source = createWorldBankDataSource()
    const years = await source.listProfileYears({
      countryCode: 'FR',
      variable: PIP_DECILE_BUNDLE_ID,
      age: '',
      pop: '',
    })
    expect(years).toEqual([2021])
  })

  it('fetches WDI scalar time series', async () => {
    const source = createWorldBankDataSource()
    const series = await source.fetchVariableTimeSeries({
      countryCode: 'FR',
      variable: 'SI.POV.GINI',
      age: '',
      pop: '',
    })
    expect(series.points).toEqual([{ year: 2021, value: 31.5 }])
    expect(series.metadata?.source).toBe('worldbank')
  })
})
