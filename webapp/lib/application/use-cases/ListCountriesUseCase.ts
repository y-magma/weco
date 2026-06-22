import type { CountryOption, ListCountriesParams } from '@domain/entities'
import type { DataSourcePort } from '@domain/ports/DataSourcePort'

export class ListCountriesUseCase {
  constructor(private readonly getSource: () => DataSourcePort) {}

  async execute(params?: ListCountriesParams): Promise<CountryOption[]> {
    return this.getSource().listCountries(params)
  }
}
