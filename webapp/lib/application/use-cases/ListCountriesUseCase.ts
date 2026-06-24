import type { CountryOption, ListCountriesParams } from '@domain/entities'
import type { DataSourcePort } from '@domain/ports/DataSourcePort'

export interface UseCaseSourceOptions {
  source?: DataSourcePort
}

export class ListCountriesUseCase {
  constructor(private readonly getSource: () => DataSourcePort) {}

  async execute(
    params?: ListCountriesParams,
    options?: UseCaseSourceOptions,
  ): Promise<CountryOption[]> {
    const source = options?.source ?? this.getSource()
    return source.listCountries(params)
  }
}
