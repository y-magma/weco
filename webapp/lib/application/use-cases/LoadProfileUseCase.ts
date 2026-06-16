import type { FetchProfileParams, PercentileProfile } from '@domain/entities'
import type { DataSourcePort } from '@domain/ports/DataSourcePort'

export class LoadProfileUseCase {
  constructor(private readonly getSource: () => DataSourcePort) {}

  async execute(params: FetchProfileParams): Promise<PercentileProfile> {
    return this.getSource().fetchPercentileProfile(params)
  }
}
