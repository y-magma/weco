/**
 * Reference reader for the local WID.world CSV dump.
 *
 * Used **only** by conformance tests (golden reference). The running app
 * fetches live data from the WID API instead.
 */
import { createReadStream, existsSync, readdirSync } from 'node:fs'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInterface } from 'node:readline'
import { buildGPercentiles, parsePercentileRank } from '@domain/services/percentiles'

export interface ReferenceProfilePoint {
  percentile: string
  rank: number
  value: number
}

const G127_SET = new Set(buildGPercentiles())

const DEFAULT_REFERENCE_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../data/WID_DATA',
)

/** Directory of `WID_data_<AREA>.csv` files used as the golden reference. */
export function resolveWidReferenceDir(): string {
  const configured = (
    process.env.WID_REFERENCE_DATA_DIR
    || process.env.WID_DATA_DIR
    || ''
  ).trim()
  if (configured) {
    return isAbsolute(configured) ? configured : resolve(process.cwd(), configured)
  }
  return DEFAULT_REFERENCE_DIR
}

export function widReferenceDumpAvailable(): boolean {
  const dir = resolveWidReferenceDir()
  return existsSync(dir) && listReferenceCountries().length > 0
}

export function widVariableCode(sixlet: string, age: string, pop: string): string {
  return `${sixlet}${pop}${age}`
}

function countryDataFile(country: string): string | null {
  const dir = resolveWidReferenceDir()
  const safe = country.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '')
  if (!safe) return null
  const file = join(dir, `WID_data_${safe}.csv`)
  return existsSync(file) ? file : null
}

/** Read 127 g-percentiles from the reference dump for one profile request. */
export async function readReferenceProfile(params: {
  country: string
  /** Six-letter WID code (`ahweal`, `thweal`, …). Alias: `variable`. */
  sixlet?: string
  variable?: string
  age: string
  pop: string
  year: number
}): Promise<ReferenceProfilePoint[]> {
  const file = countryDataFile(params.country)
  if (!file) return []

  const sixlet = params.sixlet ?? params.variable ?? ''
  if (!sixlet) return []

  const variable = widVariableCode(sixlet, params.age, params.pop)
  const yearStr = String(params.year)
  const byPercentile = new Map<string, ReferenceProfilePoint>()

  await streamRows(file, (cols) => {
    if (cols[1] !== variable) return
    if (cols[3] !== yearStr) return
    const percentile = cols[2]!
    if (!G127_SET.has(percentile)) return
    const value = Number.parseFloat(cols[4]!)
    if (!Number.isFinite(value)) return
    byPercentile.set(percentile, {
      percentile,
      rank: parsePercentileRank(percentile),
      value,
    })
  })

  return [...byPercentile.values()].sort((a, b) => a.rank - b.rank)
}

export function listReferenceCountries(): string[] {
  const dir = resolveWidReferenceDir()
  if (!existsSync(dir)) return []
  const codes: string[] = []
  for (const name of readdirSync(dir)) {
    const match = name.match(/^WID_data_(.+)\.csv$/)
    if (match) codes.push(match[1]!)
  }
  return codes.sort()
}

function streamRows(file: string, onRow: (cols: string[]) => void): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    const stream = createReadStream(file, { encoding: 'utf8' })
    const rl = createInterface({ input: stream, crlfDelay: Infinity })
    let isHeader = true

    rl.on('line', (line) => {
      if (isHeader) {
        isHeader = false
        return
      }
      if (!line) return
      onRow(line.split(';'))
    })
    rl.on('close', () => resolvePromise())
    rl.on('error', reject)
    stream.on('error', reject)
  })
}
