import type { DataSourcePort } from '@domain/ports/DataSourcePort'
import {
  getDefaultDataSource,
  initializeDataSources,
  listDataSources,
} from '@infrastructure/data-sources/registry'
import { ListCountriesUseCase } from '@application/use-cases/ListCountriesUseCase'
import { ListAvailableParamsUseCase } from '@application/use-cases/ListAvailableParamsUseCase'
import { ListProfileYearsUseCase } from '@application/use-cases/ListProfileYearsUseCase'
import { LoadProfileUseCase } from '@application/use-cases/LoadProfileUseCase'
import { LoadScatterUseCase } from '@application/use-cases/LoadScatterUseCase'
import { LoadTimeSeriesUseCase } from '@application/use-cases/LoadTimeSeriesUseCase'

export interface ApplicationConfig {
  widApiKey?: string
  widApiBaseUrl?: string
}

export interface ApplicationContainer {
  listCountries: ListCountriesUseCase
  listAvailableParams: ListAvailableParamsUseCase
  listProfileYears: ListProfileYearsUseCase
  loadProfile: LoadProfileUseCase
  loadTimeSeries: LoadTimeSeriesUseCase
  loadScatter: LoadScatterUseCase
  getDefaultSource: () => DataSourcePort
  listDataSources: () => DataSourcePort[]
}

let container: ApplicationContainer | null = null

export function createApplicationContainer(config?: ApplicationConfig): ApplicationContainer {
  initializeDataSources({
    widApiKey: config?.widApiKey,
    widApiBaseUrl: config?.widApiBaseUrl,
  })

  const getSource = (): DataSourcePort => getDefaultDataSource()

  return {
    listCountries: new ListCountriesUseCase(getSource),
    listAvailableParams: new ListAvailableParamsUseCase(getSource),
    listProfileYears: new ListProfileYearsUseCase(getSource),
    loadProfile: new LoadProfileUseCase(getSource),
    loadTimeSeries: new LoadTimeSeriesUseCase(getSource),
    loadScatter: new LoadScatterUseCase(getSource),
    getDefaultSource: getSource,
    listDataSources,
  }
}

export function getApplicationContainer(config?: ApplicationConfig): ApplicationContainer {
  if (!container) {
    container = createApplicationContainer(config)
  }
  return container
}

export function resetApplicationContainer(): void {
  container = null
}
