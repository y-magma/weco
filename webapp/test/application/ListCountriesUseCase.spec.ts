import { describe, expect, it, vi } from 'vitest'
import { ListCountriesUseCase } from '@application/use-cases/ListCountriesUseCase'
import type { DataSourcePort } from '@domain/ports/DataSourcePort'

describe('ListCountriesUseCase', () => {
  it('delegates to the data source port', async () => {
    const mockSource: Pick<DataSourcePort, 'listCountries'> = {
      listCountries: vi.fn().mockResolvedValue([{ code: 'FR', label: 'France' }]),
    }
    const useCase = new ListCountriesUseCase(() => mockSource as DataSourcePort)

    const result = await useCase.execute()

    expect(mockSource.listCountries).toHaveBeenCalledOnce()
    expect(result).toEqual([{ code: 'FR', label: 'France' }])
  })
})
