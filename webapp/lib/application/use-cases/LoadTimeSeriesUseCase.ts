import type { DataSeries, FetchVariableTimeSeriesParams } from '@domain/entities'
import type { DataSourcePort } from '@domain/ports/DataSourcePort'

export interface LoadTimeSeriesRequest {
  countryCodes: string[]
  params: Omit<FetchVariableTimeSeriesParams, 'countryCode'>
  countryLabel: (code: string) => string
}

export interface LoadTimeSeriesResult {
  series: DataSeries[]
  failures: string[]
}

export class LoadTimeSeriesUseCase {
  constructor(private readonly getSource: () => DataSourcePort) {}

  async execute(request: LoadTimeSeriesRequest): Promise<LoadTimeSeriesResult> {
    const source = this.getSource()
    const codes = request.countryCodes.length > 0 ? request.countryCodes : ['FR']

    const results = await Promise.allSettled(
      codes.map((countryCode) =>
        source.fetchVariableTimeSeries({ ...request.params, countryCode }),
      ),
    )

    const series: DataSeries[] = []
    const failures: string[] = []

    results.forEach((result, index) => {
      const code = codes[index]!
      if (result.status === 'fulfilled') {
        series.push({ ...result.value, label: request.countryLabel(code) })
      } else {
        const message = result.reason instanceof Error
          ? result.reason.message
          : 'Échec du chargement'
        failures.push(`${request.countryLabel(code)} : ${message}`)
      }
    })

    return { series, failures }
  }
}
