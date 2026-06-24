import { describe, expect, it, beforeEach } from 'vitest'
import {
  getDefaultDataSource,
  initializeDataSources,
  listDataSources,
  registerDataSource,
  resetDataSourcesRegistry,
} from '@infrastructure/data-sources/registry'
import { createStubDataSource } from '@infrastructure/data-sources/stub/stubSource'
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

    expect(listDataSources()).toHaveLength(2)
    expect(getDefaultDataSource().id).toBe('stub')
  })

  it('falls back to the first registered source when no default is set', () => {
    registerDataSource(createStubDataSource())
    registerDataSource(createWidDataSource({ apiKey: 'key' }))

    expect(getDefaultDataSource().id).toBe('stub')
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
