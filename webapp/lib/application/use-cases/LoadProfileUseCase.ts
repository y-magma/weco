import type { FetchProfileParams, PercentileProfile } from '@domain/entities'
import type { DataSourcePort } from '@domain/ports/DataSourcePort'
import type { UseCaseSourceOptions } from '@application/use-cases/ListCountriesUseCase'

export class LoadProfileUseCase {
  constructor(private readonly getSource: () => DataSourcePort) {}

  async execute(
    params: FetchProfileParams,
    options?: UseCaseSourceOptions,
  ): Promise<PercentileProfile> {
    const source = options?.source ?? this.getSource()
    return source.fetchPercentileProfile(params)
  }
}
