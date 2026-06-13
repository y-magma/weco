import type { FetchProfileParams } from '@domain/entities'
import { joinProfilesByPercentile, type ProfileScatterPoint } from '@domain/services/joinProfiles'
import type { DataSourcePort } from '@domain/ports/DataSourcePort'

export interface LoadScatterRequest {
  params: FetchProfileParams
  variableX: string
  variableY: string
}

export class LoadScatterUseCase {
  constructor(private readonly getSource: () => DataSourcePort) {}

  async execute(request: LoadScatterRequest): Promise<ProfileScatterPoint[]> {
    const source = this.getSource()
    const { variableX, variableY, params } = request

    const [xProfile, yProfile] = await Promise.all([
      source.fetchPercentileProfile({ ...params, variable: variableX }),
      source.fetchPercentileProfile({ ...params, variable: variableY }),
    ])

    return joinProfilesByPercentile(xProfile, yProfile)
  }
}
