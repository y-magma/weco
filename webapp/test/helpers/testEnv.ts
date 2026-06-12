import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/** Load `webapp/.env` into `process.env` for integration tests (no secrets logged). */
export function loadWebappDotEnv(): void {
  const envPath = resolve(process.cwd(), '.env')
  if (!existsSync(envPath)) return
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim()
    if (!(key in process.env)) process.env[key] = value
  }
}

export function widApiKeyFromEnv(): string | undefined {
  const key = process.env.NUXT_PUBLIC_WID_API_KEY?.trim()
  return key || undefined
}
