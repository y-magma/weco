import { describe, expect, it } from 'vitest'
import {
  compareProfiles,
  CONFORMANCE_CASES,
} from '@infrastructure/data-sources/wid/conformance'
import { WidClient } from '@infrastructure/data-sources/wid/widClient'
import {
  readReferenceProfile,
  widReferenceDumpAvailable,
} from '@infrastructure/data-sources/wid/widLocalCsv'
import { loadWebappDotEnv, widApiKeyFromEnv } from '../helpers/testEnv'

loadWebappDotEnv()

const apiKey = widApiKeyFromEnv()
const hasReference = widReferenceDumpAvailable()
const runLive = Boolean(apiKey && hasReference)

const client = apiKey
  ? new WidClient({
      baseUrl:
        process.env.NUXT_PUBLIC_WID_API_BASE_URL
        || 'https://rfap9nitz6.execute-api.eu-west-1.amazonaws.com/prod',
      apiKey,
    })
  : null

describe.skipIf(!runLive)('WID API vs local CSV reference (conformance)', () => {
  for (const testCase of CONFORMANCE_CASES) {
    it(
      testCase.label ?? `${testCase.country} ${testCase.variable} ${testCase.year}`,
      async () => {
        // Read reference CSV before API calls — parallel stream+fetch can starve
        // the line reader in Vitest's thread pool.
        const reference = await readReferenceProfile(testCase)
        const api = await client!.fetchProfileData({
          area: testCase.country,
          sixlet: testCase.variable,
          age: testCase.age,
          pop: testCase.pop,
          year: testCase.year,
        })

        expect(reference.length).toBeGreaterThan(0)
        expect(api.length).toBeGreaterThan(0)

        const result = compareProfiles(reference, api)
        const missing = result.mismatches.filter((m) => m.kind !== 'value_diff')
        const valueDiffs = result.mismatches.filter((m) => m.kind === 'value_diff')
        const matchRate = result.matched / result.referenceCount

        expect(missing, `missing percentiles: ${missing.map((m) => m.percentile).join(', ')}`).toHaveLength(0)
        expect(matchRate).toBeGreaterThanOrEqual(0.95)
        expect(result.apiCount).toBeGreaterThanOrEqual(Math.floor(result.referenceCount * 0.95))

        if (valueDiffs.length > 0) {
          const worst = valueDiffs.reduce((a, b) => ((a.absDiff ?? 0) > (b.absDiff ?? 0) ? a : b))
          console.warn(
            `${testCase.label}: ${valueDiffs.length} value drift(s), `
            + `match ${(matchRate * 100).toFixed(1)}%, worst ${worst.percentile} Δ=${worst.absDiff}`,
          )
        }
      },
      120_000,
    )
  }
})

describe.skipIf(!apiKey)('WID API connectivity', () => {
  it('lists countries from countries-available-variables', async () => {
    const countries = await client!.listCountries()
    expect(countries.length).toBeGreaterThan(100)
    expect(countries.some((c) => c.code === 'FR')).toBe(true)
  }, 30_000)
})

describe.skipIf(hasReference)('WID reference dump', () => {
  it('warns when the golden CSV dump is missing', () => {
    expect.fail(
      'Set WID_REFERENCE_DATA_DIR (or WID_DATA_DIR) to the local WID dump for conformance tests.',
    )
  })
})

describe.skipIf(apiKey)('WID API key', () => {
  it('warns when NUXT_PUBLIC_WID_API_KEY is missing', () => {
    expect.fail(
      'Set NUXT_PUBLIC_WID_API_KEY in webapp/.env (hex key from the R package wid).',
    )
  })
})
