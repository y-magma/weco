import type { ListAvailableParamsParams, WidParamAvailabilityEntity } from '@domain/entities'
import type { DataSourcePort } from '@domain/ports/DataSourcePort'

export class ListAvailableParamsUseCase {
  constructor(private readonly getSource: () => DataSourcePort) {}

  async execute(params: ListAvailableParamsParams): Promise<WidParamAvailabilityEntity> {
    return this.getSource().listAvailableParams(params)
  }
}
