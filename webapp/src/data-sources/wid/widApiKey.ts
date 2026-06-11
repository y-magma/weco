function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

function bytesToBase64(bytes: Uint8Array): string {
  const g = globalThis as unknown as {
    Buffer?: { from(input: Uint8Array): { toString(enc: string): string } }
  }
  if (g.Buffer) return g.Buffer.from(bytes).toString('base64')
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  if (typeof btoa === 'function') return btoa(binary)
  return binary
}

function base64EncodeAscii(input: string): string {
  if (typeof btoa === 'function') return btoa(input)
  const g = globalThis as unknown as {
    Buffer?: { from(s: string): { toString(enc: string): string } }
  }
  if (g.Buffer) return g.Buffer.from(input).toString('base64')
  return input
}

/**
 * Build the `x-api-key` header value expected by the WID webservice.
 *
 * Formats accepted in `NUXT_PUBLIC_WID_API_KEY`:
 * - Hex string (60 chars) — raw bytes from the official R package `sysdata.rda`
 * - `b64:<value>` — pre-encoded header (sent as-is, no double encoding)
 * - Plain ASCII — base64-encoded as a legacy fallback
 */
export function buildWidApiKeyHeader(apiKey: string | undefined): string | undefined {
  const trimmed = apiKey?.trim()
  if (!trimmed) return undefined

  if (trimmed.startsWith('b64:')) {
    return trimmed.slice(4)
  }

  if (/^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length % 2 === 0) {
    return bytesToBase64(hexToBytes(trimmed))
  }

  return base64EncodeAscii(trimmed)
}
