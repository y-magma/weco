import type { DataSourcePort } from '@domain/ports/DataSourcePort'
import { ParamMetadataStore } from '@domain/services/paramMetadataStore'
import {
  getDefaultDataSource,
  initializeDataSources,
  listDataSources,
  type DataSourcesConfig,
} from '@infrastructure/data-sources/registry'
import { ListCountriesUseCase } from '@application/use-cases/ListCountriesUseCase'
import { ListAvailableParamsUseCase } from '@application/use-cases/ListAvailableParamsUseCase'
import { ListProfileYearsUseCase } from '@application/use-cases/ListProfileYearsUseCase'
import { LoadProfileUseCase } from '@application/use-cases/LoadProfileUseCase'
import { LoadTimeSeriesUseCase } from '@application/use-cases/LoadTimeSeriesUseCase'

export interface ApplicationContainer {
  listCountries: ListCountriesUseCase
  listAvailableParams: ListAvailableParamsUseCase
  listProfileYears: ListProfileYearsUseCase
  loadProfile: LoadProfileUseCase
  loadTimeSeries: LoadTimeSeriesUseCase
  getDefaultSource: () => DataSourcePort
  listDataSources: () => DataSourcePort[]
  paramMetadata: ParamMetadataStore
}

let container: ApplicationContainer | null = null

export function createApplicationContainer(config?: DataSourcesConfig): ApplicationContainer {
  initializeDataSources(config)

  const getSource = (): DataSourcePort => getDefaultDataSource()
  const paramMetadata = new ParamMetadataStore()

  return {
    listCountries: new ListCountriesUseCase(getSource),
    listAvailableParams: new ListAvailableParamsUseCase(getSource),
    listProfileYears: new ListProfileYearsUseCase(getSource),
    loadProfile: new LoadProfileUseCase(getSource),
    loadTimeSeries: new LoadTimeSeriesUseCase(getSource),
    getDefaultSource: getSource,
    listDataSources,
    paramMetadata,
  }
}

export function getApplicationContainer(config?: DataSourcesConfig): ApplicationContainer {
  if (!container) {
    container = createApplicationContainer(config)
  }
  return container
}

export function resetApplicationContainer(): void {
  container = null
}
