import {
  SHARE_MAX_ENCODED_LENGTH,
  SHARE_QUERY_STATE_KEY,
  SHARE_QUERY_VERSION,
  type SharePageId,
  type ShareSnapshotV1,
} from '@application/share/shareSnapshot'
import { decodeFlatShareQuery, encodeFlatShareQuery } from '@application/share/shareFlatCodec'

function encodeBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decodeBase64Url(encoded: string): string {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isShareSnapshotV1(value: unknown): value is ShareSnapshotV1 {
  if (!isRecord(value)) return false
  if (value.v !== 1) return false
  if (typeof value.page !== 'string') return false
  if (!['exploration', 'temps', 'grille'].includes(value.page)) return false
  if (typeof value.sourceId !== 'string') return false
  return true
}

/** Legacy blob encoding — kept for backward compatibility with old links. */
export function encodeShareSnapshot(snapshot: ShareSnapshotV1): string {
  return encodeBase64Url(JSON.stringify(snapshot))
}

export function decodeShareSnapshot(encoded: string): ShareSnapshotV1 | null {
  try {
    const json = decodeBase64Url(encoded)
    const parsed: unknown = JSON.parse(json)
    return isShareSnapshotV1(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function encodeShareQuery(snapshot: ShareSnapshotV1): Record<string, string> {
  return encodeFlatShareQuery(snapshot)
}

export function decodeShareQuery(
  query: Record<string, string | string[] | null | undefined>,
  page: SharePageId,
): ShareSnapshotV1 | null {
  const normalized: Record<string, string | string[] | undefined> = {}
  for (const [key, value] of Object.entries(query)) {
    if (value == null) continue
    normalized[key] = value
  }

  const flat = decodeFlatShareQuery(normalized, page)
  if (flat) return flat

  const version = normalized.v
  if (version !== SHARE_QUERY_VERSION) return null

  const rawState = normalized[SHARE_QUERY_STATE_KEY]
  const encoded = Array.isArray(rawState) ? rawState[0] : rawState
  if (!encoded || typeof encoded !== 'string') return null

  const legacy = decodeShareSnapshot(encoded)
  if (!legacy || legacy.page !== page) return null
  return legacy
}

export function isShareUrlTooLong(queryString: string): boolean {
  return queryString.length > SHARE_MAX_ENCODED_LENGTH
}

export function buildShareUrl(
  path: string,
  snapshot: ShareSnapshotV1,
  baseURL = '/',
  origin?: string,
): string {
  const normalizedBase = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const query = encodeShareQuery(snapshot)
  const params = new URLSearchParams(query)
  const prefix = normalizedBase === '' || normalizedBase === '/' ? '' : normalizedBase
  const relative = `${prefix}${normalizedPath}?${params.toString()}`
  if (origin) {
    return `${origin.replace(/\/$/, '')}${relative}`
  }
  return relative
}
