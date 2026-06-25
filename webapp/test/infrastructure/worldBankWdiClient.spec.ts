import { describe, expect, it } from 'vitest'
import { parseWdiResponse } from '@infrastructure/data-sources/worldbank/worldBankWdiClient'

describe('parseWdiResponse', () => {
  it('parses WDI JSON rows and filters null values', () => {
    const json = [
      { page: 1, pages: 1, total: 3 },
      [
        { date: '2020', value: 31.5 },
        { date: '2021', value: null },
        { date: '2022', value: '31.2' },
        { date: 'invalid', value: 10 },
      ],
    ] as const

    expect(parseWdiResponse(json as never)).toEqual([
      { year: 2020, value: 31.5 },
      { year: 2022, value: 31.2 },
    ])
  })

  it('returns empty array when no rows', () => {
    expect(parseWdiResponse([{ page: 1 }, null] as never)).toEqual([])
  })
})
