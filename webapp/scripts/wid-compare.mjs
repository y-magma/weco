#!/usr/bin/env node
/**
 * Side-by-side comparison: WID CSV dump vs live API for 127 g-percentiles.
 *
 * Usage:
 *   npm run wid:compare
 *   npm run wid:compare -- --country FR --variable ahweal --age 992 --pop j --year 2021
 *   npm run wid:compare -- --json
 *   npm run wid:compare -- --diffs-only
 */
import { createReadStream, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function loadEnv() {
  const envPath = join(root, '.env')
  if (!existsSync(envPath)) return
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (!m) continue
    const key = m[1].trim()
    const value = m[2].trim()
    if (!(key in process.env)) process.env[key] = value
  }
}

function parseArgs(argv) {
  const opts = {
    country: 'FR',
    variable: 'ahweal',
    age: '992',
    pop: 'j',
    year: 2021,
    json: false,
    diffsOnly: false,
    out: '',
    help: false,
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--help' || arg === '-h') {
      opts.help = true
      continue
    }
    if (arg === '--json') {
      opts.json = true
      continue
    }
    if (arg === '--diffs-only') {
      opts.diffsOnly = true
      continue
    }
    if (arg === '--country') {
      opts.country = argv[++i]?.toUpperCase() ?? opts.country
      continue
    }
    if (arg === '--variable') {
      opts.variable = argv[++i] ?? opts.variable
      continue
    }
    if (arg === '--age') {
      opts.age = argv[++i] ?? opts.age
      continue
    }
    if (arg === '--pop') {
      opts.pop = argv[++i] ?? opts.pop
      continue
    }
    if (arg === '--year') {
      opts.year = Number(argv[++i]) || opts.year
      continue
    }
    if (arg === '--out') {
      opts.out = argv[++i] ?? ''
      continue
    }
  }

  return opts
}

function printHelp() {
  console.log(`Usage: npm run wid:compare -- [options]

Compare 127 g-percentiles: local CSV dump vs live WID API (strict !==).

Options:
  --country FR        Country code (default: FR)
  --variable ahweal   Six-letter WID code (default: ahweal)
  --age 992           Age group (default: 992)
  --pop j             Population unit (default: j)
  --year 2021         Year (default: 2021)
  --diffs-only        Print only rows where CSV !== API
  --json              JSON output (includes all rows + summary)
  --out <file>        Write JSON report to file
  -h, --help          Show this help
`)
}

function hexToB64(hex) {
  return Buffer.from(hex, 'hex').toString('base64')
}

function buildHeader(key) {
  if (key.startsWith('b64:')) return key.slice(4)
  if (/^[0-9a-fA-F]+$/.test(key) && key.length % 2 === 0) return hexToB64(key)
  return Buffer.from(key).toString('base64')
}

function buildG127() {
  const codes = []
  const fmt = (n) => Number(n.toFixed(3)).toString()
  for (let i = 0; i < 99; i++) codes.push(`p${i}p${i + 1}`)
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

const G127 = buildG127()
const G127_SET = new Set(G127)

function refDir() {
  const configured = (process.env.WID_REFERENCE_DATA_DIR || process.env.WID_DATA_DIR || '').trim()
  if (configured) return isAbsolute(configured) ? configured : resolve(root, configured)
  return resolve(root, 'data/WID_DATA')
}

function varCode(sixlet, age, pop) {
  return `${sixlet}${pop}${age}`
}

async function readCsvProfile(testCase) {
  const file = join(refDir(), `WID_data_${testCase.country}.csv`)
  if (!existsSync(file)) {
    throw new Error(`CSV not found: ${file}`)
  }

  const variable = varCode(testCase.variable, testCase.age, testCase.pop)
  const yearStr = String(testCase.year)
  const map = new Map()

  await new Promise((resolvePromise, reject) => {
    const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity })
    let header = true
    rl.on('line', (line) => {
      if (header) {
        header = false
        return
      }
      const cols = line.split(';')
      if (cols[1] !== variable || cols[3] !== yearStr) return
      const pct = cols[2]
      if (!G127_SET.has(pct)) return
      const value = Number.parseFloat(cols[4])
      if (!Number.isFinite(value)) return
      map.set(pct, value)
    })
    rl.on('close', () => resolvePromise())
    rl.on('error', reject)
  })

  return map
}

function parseApiChunk(json, year) {
  const map = new Map()
  for (const [fullCode, payload] of Object.entries(json)) {
    const pct = fullCode.split('_')[1]
    if (!pct) continue
    const entries = Array.isArray(payload) ? payload : [payload]
    for (const entry of entries) {
      for (const inner of Object.values(entry)) {
        for (const pair of inner.values ?? []) {
          const y = Array.isArray(pair) ? pair[0] : pair?.y
          const v = Array.isArray(pair) ? pair[1] : pair?.v
          if (Number(y) === year && Number.isFinite(Number(v))) {
            map.set(pct, Number(v))
          }
        }
      }
    }
  }
  return map
}

async function fetchApiProfile(testCase, baseUrl, header) {
  const codes = G127.map((p) => `${testCase.variable}_${p}_${testCase.age}_${testCase.pop}`)
  const map = new Map()

  const chunks = []
  for (let i = 0; i < codes.length; i += 20) {
    chunks.push(codes.slice(i, i + 20))
  }

  const responses = await Promise.all(
    chunks.map(async (group) => {
      const params = new URLSearchParams({
        countries: testCase.country,
        variables: group.join(','),
        years: String(testCase.year),
      })
      const res = await fetch(`${baseUrl}/countries-variables?${params}`, {
        headers: { Accept: 'application/json', 'x-api-key': header },
      })
      if (!res.ok) throw new Error(`API ${res.status} for chunk starting ${group[0]}`)
      return res.json()
    }),
  )

  for (const json of responses) {
    for (const [pct, value] of parseApiChunk(json, testCase.year)) {
      map.set(pct, value)
    }
  }

  return map
}

function compareStrict(csvMap, apiMap) {
  const rows = []
  let exactMatchCount = 0
  let strictDiffCount = 0
  let missingCsvCount = 0
  let missingApiCount = 0

  for (const percentile of G127) {
    const csv = csvMap.get(percentile)
    const api = apiMap.get(percentile)

    if (csv === undefined && api === undefined) continue

    if (csv === undefined) {
      missingCsvCount++
      rows.push({ percentile, csv: null, api, absDiff: null, status: 'missing_csv' })
      continue
    }
    if (api === undefined) {
      missingApiCount++
      rows.push({ percentile, csv, api: null, absDiff: null, status: 'missing_api' })
      continue
    }
    if (csv === api) {
      exactMatchCount++
      rows.push({ percentile, csv, api, absDiff: 0, status: 'equal' })
      continue
    }

    strictDiffCount++
    rows.push({
      percentile,
      csv,
      api,
      absDiff: Math.abs(csv - api),
      status: 'strict_diff',
    })
  }

  return {
    rows,
    gPercentileCount: G127.length,
    csvCount: csvMap.size,
    apiCount: apiMap.size,
    exactMatchCount,
    strictDiffCount,
    missingCsvCount,
    missingApiCount,
  }
}

function formatNum(n) {
  if (n == null || !Number.isFinite(n)) return '—'
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 4 })
}

function printTable(testCase, result, diffsOnly) {
  const label = `${testCase.country} · ${varCode(testCase.variable, testCase.age, testCase.pop)} · ${testCase.year}`
  console.log(`\nWID CSV vs API — ${label}`)
  console.log(`CSV: ${refDir()}/WID_data_${testCase.country}.csv`)
  console.log('')

  const header = [
    'percentile'.padEnd(16),
    'csv'.padStart(18),
    'api'.padStart(18),
    'Δ abs'.padStart(12),
    'statut'.padStart(14),
  ].join(' ')
  console.log(header)
  console.log('-'.repeat(header.length))

  const visible = diffsOnly
    ? result.rows.filter((r) => r.status !== 'equal')
    : result.rows

  for (const row of visible) {
    console.log([
      row.percentile.padEnd(16),
      formatNum(row.csv).padStart(18),
      formatNum(row.api).padStart(18),
      formatNum(row.absDiff).padStart(12),
      row.status.padStart(14),
    ].join(' '))
  }

  console.log('')
  console.log('── Résumé ──')
  console.log(`G-percentiles attendus : ${result.gPercentileCount}`)
  console.log(`Lignes CSV             : ${result.csvCount}`)
  console.log(`Lignes API             : ${result.apiCount}`)
  console.log(`Égalité stricte (===)  : ${result.exactMatchCount}`)
  console.log(`Écart strict (!==)     : ${result.strictDiffCount}`)
  if (result.missingCsvCount) console.log(`Manquant côté CSV      : ${result.missingCsvCount}`)
  if (result.missingApiCount) console.log(`Manquant côté API      : ${result.missingApiCount}`)
}

loadEnv()

const opts = parseArgs(process.argv.slice(2))
if (opts.help) {
  printHelp()
  process.exit(0)
}

const apiKey = process.env.NUXT_PUBLIC_WID_API_KEY?.trim()
if (!apiKey) {
  console.error('Missing NUXT_PUBLIC_WID_API_KEY in webapp/.env')
  process.exit(1)
}
if (!existsSync(refDir())) {
  console.error('Reference dump not found:', refDir())
  process.exit(1)
}

const testCase = {
  country: opts.country,
  variable: opts.variable,
  age: opts.age,
  pop: opts.pop,
  year: opts.year,
}

const baseUrl = process.env.NUXT_PUBLIC_WID_API_BASE_URL
  || 'https://rfap9nitz6.execute-api.eu-west-1.amazonaws.com/prod'
const header = buildHeader(apiKey)

const [csvMap, apiMap] = await Promise.all([
  readCsvProfile(testCase),
  fetchApiProfile(testCase, baseUrl, header),
])

const result = compareStrict(csvMap, apiMap)
const report = {
  query: {
    ...testCase,
    variableCode: varCode(testCase.variable, testCase.age, testCase.pop),
  },
  summary: {
    gPercentileCount: result.gPercentileCount,
    csvCount: result.csvCount,
    apiCount: result.apiCount,
    exactMatchCount: result.exactMatchCount,
    strictDiffCount: result.strictDiffCount,
    missingCsvCount: result.missingCsvCount,
    missingApiCount: result.missingApiCount,
  },
  rows: result.rows,
}

if (opts.out) {
  writeFileSync(opts.out, `${JSON.stringify(report, null, 2)}\n`)
  console.log(`Report written to ${opts.out}`)
}

if (opts.json) {
  console.log(JSON.stringify(report, null, 2))
} else {
  printTable(testCase, result, opts.diffsOnly)
}

process.exit(result.strictDiffCount > 0 || result.missingCsvCount > 0 || result.missingApiCount > 0 ? 1 : 0)
