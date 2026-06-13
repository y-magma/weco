import type { CountryOption } from '@domain/entities'
import type { DataSourcePort } from '@domain/ports/DataSourcePort'

export class ListCountriesUseCase {
  constructor(private readonly getSource: () => DataSourcePort) {}

  async execute(): Promise<CountryOption[]> {
    return this.getSource().listCountries()
  }
}
