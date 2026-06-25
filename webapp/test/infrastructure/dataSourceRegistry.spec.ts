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

    expect(listDataSources()).toHaveLength(3)
    expect(getDefaultDataSource().id).toBe('stub')
  })

  it('falls back to the first registered source when no default is set', () => {
    registerDataSource(createStubDataSource())
    registerDataSource(createWidDataSource({ apiKey: 'key' }))

    expect(getDefaultDataSource().id).toBe('stub')
  })

  it('registers WID and OECD after prod-like init with default wid', () => {
    initializeDataSources({
      defaultSourceId: 'wid',
      wid: { apiKey: 'test-key' },
    })

    const ids = listDataSources().map((source) => source.id)
    expect(ids).toContain('wid')
    expect(ids).toContain('oecd-idd')
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
