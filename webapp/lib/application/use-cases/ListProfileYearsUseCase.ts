import type { ListProfileYearsParams } from '@domain/entities'
import type { DataSourcePort } from '@domain/ports/DataSourcePort'
import type { UseCaseSourceOptions } from '@application/use-cases/ListCountriesUseCase'

export class ListProfileYearsUseCase {
  constructor(private readonly getSource: () => DataSourcePort) {}

  async execute(
    params: ListProfileYearsParams,
    options?: UseCaseSourceOptions,
  ): Promise<number[]> {
    const source = options?.source ?? this.getSource()
    return source.listProfileYears(params)
  }
}
