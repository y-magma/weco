import { describe, expect, it } from 'vitest'
import { buildWidApiKeyHeader } from '@src/data-sources/wid/widApiKey'

/** 30-byte fixture matching the shape of the official R package key. */
const HEX_KEY = 'ad8141c8e0748a868f013c07b6594c23bd732ce6522b421ce6f790a2724f'

describe('buildWidApiKeyHeader', () => {
  it('returns undefined for empty input', () => {
    expect(buildWidApiKeyHeader(undefined)).toBeUndefined()
    expect(buildWidApiKeyHeader('   ')).toBeUndefined()
  })

  it('base64-encodes hex bytes from the R package format', () => {
    const header = buildWidApiKeyHeader(HEX_KEY)
    expect(header).toBe('rYFByOB0ioaPATwHtllMI71zLOZSK0Ic5veQonJP')
  })

  it('passes through a pre-encoded header with the b64: prefix', () => {
    expect(buildWidApiKeyHeader('b64:already-encoded')).toBe('already-encoded')
  })

  it('base64-encodes plain ASCII keys as a legacy fallback', () => {
    expect(buildWidApiKeyHeader('hello')).toBe('aGVsbG8=')
  })
})
