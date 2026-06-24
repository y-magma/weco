import type { ListAvailableParamsParams, ParamAvailabilityEntity } from '@domain/entities'
import type { DataSourcePort } from '@domain/ports/DataSourcePort'
import type { UseCaseSourceOptions } from '@application/use-cases/ListCountriesUseCase'

export class ListAvailableParamsUseCase {
  constructor(private readonly getSource: () => DataSourcePort) {}

  async execute(
    params: ListAvailableParamsParams,
    options?: UseCaseSourceOptions,
  ): Promise<ParamAvailabilityEntity> {
    const source = options?.source ?? this.getSource()
    return source.listAvailableParams(params)
  }
}
