import { describe, expect, it } from 'vitest'
import {
  buildShareUrl,
  decodeShareQuery,
  decodeShareSnapshot,
  encodeShareQuery,
  encodeShareSnapshot,
  isShareUrlTooLong,
} from '@application/share/shareCodec'
import type { ShareSnapshotV1 } from '@application/share/shareSnapshot'

const sampleSnapshot: ShareSnapshotV1 = {
  v: 1,
  page: 'exploration',
  sourceId: 'wid',
  exploration: {
    countryCode: 'FR',
    variable: 'aptinc',
    year: 2021,
    age: '992',
    pop: 'j',
    customBreakpoints: [85],
  },
}

describe('shareCodec', () => {
  it('encodes exploration state as readable query params', () => {
    const query = encodeShareQuery(sampleSnapshot)
    expect(query.v).toBe('1')
    expect(query.source).toBe('wid')
    expect(query.country).toBe('FR')
    expect(query.var).toBe('aptinc')
    expect(query.breakpoints).toBe('85')
    expect(query.s).toBeUndefined()
  })

  it('round-trips readable query params', () => {
    const query = encodeShareQuery(sampleSnapshot)
    expect(decodeShareQuery(query, 'exploration')).toEqual(sampleSnapshot)
  })

  it('round-trips a legacy base64 snapshot', () => {
    const encoded = encodeShareSnapshot(sampleSnapshot)
    const legacyQuery = { v: '1', s: encoded }
    expect(decodeShareQuery(legacyQuery, 'exploration')).toEqual(sampleSnapshot)
  })

  it('returns null for invalid query payloads', () => {
    expect(decodeShareQuery({ v: '2', source: 'wid' }, 'exploration')).toBeNull()
    expect(decodeShareQuery({ v: '1' }, 'exploration')).toBeNull()
    expect(decodeShareSnapshot('not-valid-base64!!!')).toBeNull()
  })

  it('builds an absolute share URL with base path', () => {
    const url = buildShareUrl(
      '/panneau/exploration',
      sampleSnapshot,
      '/samuel-gscop-26/',
      'https://example.github.io',
    )
    expect(url).toBe(
      'https://example.github.io/samuel-gscop-26/panneau/exploration?v=1&source=wid&country=FR&var=aptinc&year=2021&age=992&pop=j&breakpoints=85',
    )
  })

  it('flags URLs that exceed the recommended length', () => {
    expect(isShareUrlTooLong('x'.repeat(1801))).toBe(true)
    expect(isShareUrlTooLong('x'.repeat(100))).toBe(false)
  })
})
