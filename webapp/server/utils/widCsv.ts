import { createReadStream, existsSync, readdirSync } from 'node:fs'
import { isAbsolute, join, resolve } from 'node:path'
import { createInterface } from 'node:readline'

/**
 * Server-side reader for the local WID.world data dump.
 *
 * The dump is one semicolon-separated CSV per area, named `WID_data_<AREA>.csv`,
 * with columns: country;variable;percentile;year;value;age;pop
 * The `variable` column already encodes `<sixlet><pop><age>` (e.g. `ahwealj992`).
 *
 * These helpers stream the (large) files line by line and keep only the rows
 * the charts need, so we never load a whole country file into memory.
 */

export interface ProfilePoint {
  percentile: string
  rank: number
  value: number
}

export interface SeriesPoint {
  year: number
  value: number
}

/** Parse the lower bound (rank, in %) of a WID percentile code. */
export function parsePercentileRank(percentile: string): number {
  if (!percentile) return Number.NaN
  const match = percentile.trim().match(/^p(\d+(?:\.\d+)?)/i)
  if (!match) return Number.NaN
  return Number.parseFloat(match[1]!)
}

/**
 * Build the 127 standard WID g-percentiles, ordered by rank. Kept in sync with
 * `src/data-sources/wid/percentiles.ts#buildGPercentiles`.
 */
export function buildGPercentiles(): string[] {
  const codes: string[] = []
  const fmt = (n: number) => Number(n.toFixed(3)).toString()

  for (let i = 0; i < 99; i++) {
    codes.push(`p${i}p${i + 1}`)
  }
  for (let i = 0; i < 9; i++) {
    const lo = 99 + i * 0.1
    const hi = 99 + (i + 1) * 0.1
    codes.push(`p${fmt(lo)}p${fmt(hi)}`)
  }
  for (let i = 0; i < 9; i++) {
    const lo = 99.9 + i * 0.01
    const hi = 99.9 + (i + 1) * 0.01
    codes.push(`p${fmt(lo)}p${fmt(hi)}`)
  }
  for (let i = 0; i < 10; i++) {
    const lo = 99.99 + i * 0.001
    const hi = i === 9 ? 100 : 99.99 + (i + 1) * 0.001
    codes.push(`p${fmt(lo)}p${fmt(hi)}`)
  }

  return codes
}

const G127_SET = new Set(buildGPercentiles())

/** Resolve the directory holding the `WID_data_*.csv` dump. */
export function resolveWidDataDir(): string {
  const configured = (useRuntimeConfig().widDataDir as string | undefined)?.trim()
  if (configured) {
    return isAbsolute(configured) ? configured : resolve(process.cwd(), configured)
  }
  return resolve(process.cwd(), 'data/WID_DATA')
}

/** Full path of a country's data file, or null when it does not exist. */
function countryDataFile(country: string): string | null {
  const dir = resolveWidDataDir()
  const safe = country.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '')
  if (!safe) return null
  const file = join(dir, `WID_data_${safe}.csv`)
  return existsSync(file) ? file : null
}

/** The WID variable column = `<sixlet><pop><age>`. */
export function widVariableCode(sixlet: string, age: string, pop: string): string {
  return `${sixlet}${pop}${age}`
}

/**
 * Read one variable across the 127 g-percentiles for a fixed
 * country / age / pop / year. Returns rows sorted by rank.
 */
export async function readProfile(params: {
  country: string
  sixlet: string
  age: string
  pop: string
  year: number
}): Promise<ProfilePoint[]> {
  const file = countryDataFile(params.country)
  if (!file) return []

  const variable = widVariableCode(params.sixlet, params.age, params.pop)
  const yearStr = String(params.year)
  const byPercentile = new Map<string, ProfilePoint>()

  await streamRows(file, (cols) => {
    // cols: country;variable;percentile;year;value;age;pop
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

/**
 * Read a single (variable, percentile) time series for a country, optionally
 * bounded by [yearFrom, yearTo]. Returns rows sorted by year.
 */
export async function readSeries(params: {
  country: string
  sixlet: string
  age: string
  pop: string
  percentile: string
  yearFrom?: number
  yearTo?: number
}): Promise<SeriesPoint[]> {
  const file = countryDataFile(params.country)
  if (!file) return []

  const variable = widVariableCode(params.sixlet, params.age, params.pop)
  const points: SeriesPoint[] = []

  await streamRows(file, (cols) => {
    if (cols[1] !== variable) return
    if (cols[2] !== params.percentile) return
    const year = Number.parseInt(cols[3]!, 10)
    if (!Number.isFinite(year)) return
    if (params.yearFrom != null && year < params.yearFrom) return
    if (params.yearTo != null && year > params.yearTo) return
    const value = Number.parseFloat(cols[4]!)
    if (!Number.isFinite(value)) return
    points.push({ year, value })
  })

  return points.sort((a, b) => a.year - b.year)
}

/** List available areas (country codes) found in the dump directory. */
export function listAvailableCountries(): string[] {
  const dir = resolveWidDataDir()
  if (!existsSync(dir)) return []
  const codes: string[] = []
  for (const name of readdirSync(dir)) {
    const match = name.match(/^WID_data_(.+)\.csv$/)
    if (match) codes.push(match[1]!)
  }
  return codes.sort()
}

/** Stream a CSV file, invoking `onRow` with split columns for each data line. */
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
