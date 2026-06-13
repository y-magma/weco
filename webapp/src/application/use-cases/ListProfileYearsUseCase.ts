import type { ListProfileYearsParams } from '@domain/entities'
import type { DataSourcePort } from '@domain/ports/DataSourcePort'

export class ListProfileYearsUseCase {
  constructor(private readonly getSource: () => DataSourcePort) {}

  async execute(params: ListProfileYearsParams): Promise<number[]> {
    return this.getSource().listProfileYears(params)
  }
}
