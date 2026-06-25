import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import {
  getDefaultDataSource,
  initializeDataSources,
  listDataSources,
  registerDataSource,
  resetDataSourcesRegistry,
} from '@infrastructure/data-sources/registry'
import { createStubDataSource } from '@infrastructure/data-sources/stub/stubSource'
import { createOecdIddDataSource } from '@infrastructure/data-sources/oecd-idd/oecdIddSource'
import { createWorldBankDataSource } from '@infrastructure/data-sources/worldbank/worldBankSource'
import { PIP_DECILE_BUNDLE_ID } from '@infrastructure/data-sources/worldbank/worldBankDeciles'
import { resetWorldBankCountryCache } from '@infrastructure/data-sources/worldbank/worldBankCountries'
import { OECD_DECILE_BUNDLE_ID } from '@infrastructure/data-sources/oecd-idd/oecdDeciles'
import { createWidDataSource } from '@infrastructure/data-sources/wid/widSource'
import { resetApplicationContainer } from '@application/bootstrap/container'
import { ListCountriesUseCase } from '@application/use-cases/ListCountriesUseCase'
import { LoadTimeSeriesUseCase } from '@application/use-cases/LoadTimeSeriesUseCase'

describe('data source registry', () => {
  beforeEach(() => {
    resetDataSourcesRegistry()
    resetApplicationContainer()
  })

  it('registers multiple sources and resolves default by config', () => {
    initializeDataSources({
      defaultSourceId: 'stub',
      wid: { apiKey: 'test-key' },
    })
    registerDataSource(createStubDataSource())

    expect(listDataSources()).toHaveLength(4)
    expect(getDefaultDataSource().id).toBe('stub')
  })

  it('falls back to the first registered source when no default is set', () => {
    registerDataSource(createStubDataSource())
    registerDataSource(createWidDataSource({ apiKey: 'key' }))

    expect(getDefaultDataSource().id).toBe('stub')
  })

  it('registers WID, OECD and World Bank after prod-like init with default wid', () => {
    initializeDataSources({
      defaultSourceId: 'wid',
      wid: { apiKey: 'test-key' },
    })

    const ids = listDataSources().map((source) => source.id)
    expect(ids).toContain('wid')
    expect(ids).toContain('oecd-idd')
    expect(ids).toContain('worldbank')
    expect(getDefaultDataSource().id).toBe('wid')
  })
})

describe('use case source routing', () => {
  const stub = createStubDataSource()
  const wid = createWidDataSource({ apiKey: 'key' })

  it('routes listCountries to the selected source', async () => {
    const useCase = new ListCountriesUseCase(() => wid)
    const countries = await useCase.execute({ variable: 'gdp' }, { source: stub })
    expect(countries).toEqual([
      { code: 'FR', label: 'France' },
      { code: 'US', label: 'États-Unis' },
    ])
  })

  it('routes loadTimeSeries to the selected source', async () => {
    const useCase = new LoadTimeSeriesUseCase(() => wid)
    const result = await useCase.execute({
      countryCodes: ['FR'],
      params: { variable: 'gdp', age: '', pop: '' },
      countryLabel: (code) => code,
    }, { source: stub })

    expect(result.series).toHaveLength(1)
    expect(result.series[0]!.points).toHaveLength(3)
    expect(result.failures).toEqual([])
  })
})

describe('OECD source routing', () => {
  const wid = createWidDataSource({ apiKey: 'key' })

  const OECD_SAMPLE_CSV = `STRUCTURE,STRUCTURE_ID,STRUCTURE_NAME,ACTION,REF_AREA,Reference area,FREQ,Frequency of observation,MEASURE,Measure,STATISTICAL_OPERATION,Statistical operation,UNIT_MEASURE,Unit of measure,AGE,Age,METHODOLOGY,Methodology,DEFINITION,Definition,POVERTY_LINE,Poverty line,TIME_PERIOD,Time period,OBS_VALUE,Observation value,OBS_STATUS,Observation status
DATAFLOW,OECD.WISE.INE:DSD_WISE_IDD@DF_IDD(1.0),Income distribution database,I,FRA,France,A,Annual,INC_DISP_GINI,Gini,_Z,NA,0_TO_1,scale,_T,Total,METH2012,def,D_CUR,def,_Z,NA,2022,,0.297,,A,Normal value`

  beforeEach(() => {
    resetDataSourcesRegistry()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => OECD_SAMPLE_CSV,
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('routes listCountries to OECD static country list', async () => {
    const oecd = createOecdIddDataSource()
    const useCase = new ListCountriesUseCase(() => wid)
    const countries = await useCase.execute({ variable: 'INC_DISP_GINI' }, { source: oecd })
    expect(countries.some((item) => item.code === 'FR')).toBe(true)
    expect(countries.every((item) => item.code.length === 2)).toBe(true)
  })

  it('routes loadTimeSeries to OECD adapter', async () => {
    const oecd = createOecdIddDataSource()
    const useCase = new LoadTimeSeriesUseCase(() => wid)
    const result = await useCase.execute({
      countryCodes: ['FR'],
      params: { variable: 'INC_DISP_GINI', age: '', pop: '' },
      countryLabel: (code) => code,
    }, { source: oecd })

    expect(result.series).toHaveLength(1)
    expect(result.series[0]!.points).toEqual([{ year: 2022, value: 0.297 }])
    expect(result.series[0]!.metadata?.source).toBe('oecd-idd')
    expect(result.failures).toEqual([])
  })

  it('routes decile bundle load through ratio percentile param', async () => {
    const oecd = createOecdIddDataSource()
    const useCase = new LoadTimeSeriesUseCase(() => wid)
    const result = await useCase.execute({
      countryCodes: ['FR'],
      params: {
        variable: OECD_DECILE_BUNDLE_ID,
        age: '',
        pop: '',
        percentile: 'D9_1_INC_DISP',
      },
      countryLabel: (code) => code,
    }, { source: oecd })

    expect(result.series).toHaveLength(1)
    expect(result.series[0]!.points).toEqual([{ year: 2022, value: 0.297 }])
    expect(result.series[0]!.metadata?.decileRatio).toBe('D9_1_INC_DISP')
  })
})

describe('World Bank source routing', () => {
  const wid = createWidDataSource({ apiKey: 'key' })

  const PIP_SAMPLE_CSV = `region_name,region_code,country_name,country_code,reporting_year,reporting_level,survey_acronym,survey_coverage,survey_year,welfare_type,survey_comparability,comparable_spell,poverty_line,headcount,poverty_gap,poverty_severity,watts,mean,median,mld,gini,polarization,decile1,decile2,decile3,decile4,decile5,decile6,decile7,decile8,decile9,decile10,cpi,ppp,reporting_pop,reporting_gdp,reporting_pce,is_interpolated,distribution_type,estimation_type,spl,spr,pg,estimate_type
Europe & Central Asia,ECS,France,FRA,2020,national,EU-SILC,national,2020,income,2,2003 - 2023,3.65,0.001,0.0004,0.0003,0.0008,65,57,0.17,0.306,0.25,0.031,0.048,0.061,0.072,0.082,0.093,0.105,0.120,0.143,0.245,1,0.76,67000000,38000,20000,FALSE,micro,survey,29,0.13,0.62,
Europe & Central Asia,ECS,France,FRA,2021,national,EU-SILC,national,2021,income,2,2003 - 2023,3.65,0.001,0.0004,0.0003,0.0008,65,57,0.17,0.315,0.25,0.029,0.047,0.060,0.071,0.081,0.092,0.105,0.120,0.145,0.248,1,0.76,67000000,38000,20000,FALSE,micro,survey,29,0.13,0.62,`

  beforeEach(() => {
    resetDataSourcesRegistry()
    resetWorldBankCountryCache()
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('/pip/v1/pip')) {
        return { ok: true, text: async () => PIP_SAMPLE_CSV }
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

  it('routes PIP decile bundle through percentile param', async () => {
    const wb = createWorldBankDataSource()
    const useCase = new LoadTimeSeriesUseCase(() => wid)
    const result = await useCase.execute({
      countryCodes: ['FR'],
      params: {
        variable: PIP_DECILE_BUNDLE_ID,
        age: '',
        pop: '',
        percentile: 'decile5',
      },
      countryLabel: (code) => code,
    }, { source: wb })

    expect(result.series).toHaveLength(1)
    expect(result.series[0]!.points).toEqual([
      { year: 2020, value: 0.082 },
      { year: 2021, value: 0.081 },
    ])
    expect(result.series[0]!.metadata?.decileRatio).toBe('decile5')
  })
})
