#!/usr/bin/env node
/**
 * WID API vs local CSV conformance report.
 * Prefer `npm run test:conformance` (Vitest) for CI; this script is a standalone CLI.
 */
import { createReadStream, existsSync, readFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const CASES = [
  { country: 'FR', variable: 'ahweal', age: '992', pop: 'j', year: 2021, label: 'FR patrimoine moyen 2021' },
  { country: 'FR', variable: 'ahweal', age: '992', pop: 'j', year: 2023, label: 'FR patrimoine moyen 2023' },
  { country: 'FR', variable: 'thweal', age: '992', pop: 'j', year: 2023, label: 'FR patrimoine seuil 2023' },
  { country: 'FR', variable: 'aptinc', age: '992', pop: 'j', year: 2021, label: 'FR revenu moyen 2021' },
  { country: 'FR', variable: 'aptinc', age: '992', pop: 'j', year: 2023, label: 'FR revenu moyen 2023' },
  { country: 'US', variable: 'ahweal', age: '992', pop: 'j', year: 2020, label: 'US patrimoine moyen 2020' },
  { country: 'DE', variable: 'ahweal', age: '992', pop: 'j', year: 2022, label: 'DE patrimoine moyen 2022' },
]

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

function hexToB64(hex) {
  const bytes = Buffer.from(hex, 'hex')
  return bytes.toString('base64')
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

const G127 = new Set(buildG127())

function refDir() {
  const configured = (process.env.WID_REFERENCE_DATA_DIR || process.env.WID_DATA_DIR || '').trim()
  if (configured) return isAbsolute(configured) ? configured : resolve(root, configured)
  return resolve(root, 'data/WID_DATA')
}

function varCode(sixlet, age, pop) {
  return `${sixlet}${pop}${age}`
}

async function readRef(testCase) {
  const file = join(refDir(), `WID_data_${testCase.country}.csv`)
  if (!existsSync(file)) return []
  const variable = varCode(testCase.variable, testCase.age, testCase.pop)
  const yearStr = String(testCase.year)
  const map = new Map()

  await new Promise((resolvePromise, reject) => {
    const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity })
    let header = true
    rl.on('line', (line) => {
      if (header) { header = false; return }
      const cols = line.split(';')
      if (cols[1] !== variable || cols[3] !== yearStr) return
      const pct = cols[2]
      if (!G127.has(pct)) return
      map.set(pct, Number.parseFloat(cols[4]))
    })
    rl.on('close', () => resolvePromise())
    rl.on('error', reject)
  })

  return [...map.entries()].map(([percentile, value]) => ({ percentile, value }))
}

function parseApi(json, year) {
  const rows = []
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
            rows.push({ percentile: pct, value: Number(v) })
          }
        }
      }
    }
  }
  return rows
}

async function fetchApi(testCase, baseUrl, header) {
  const codes = buildG127().map((p) => `${testCase.variable}_${p}_${testCase.age}_${testCase.pop}`)
  const rows = []
  for (let i = 0; i < codes.length; i += 20) {
    const group = codes.slice(i, i + 20)
    const params = new URLSearchParams({
      countries: testCase.country,
      variables: group.join(','),
      years: String(testCase.year),
    })
    const res = await fetch(`${baseUrl}/countries-variables?${params}`, {
      headers: { Accept: 'application/json', 'x-api-key': header },
    })
    if (!res.ok) throw new Error(`API ${res.status}`)
    rows.push(...parseApi(await res.json(), testCase.year))
  }
  return rows
}

function compare(ref, api) {
  const refMap = new Map(ref.map((r) => [r.percentile, r.value]))
  const apiMap = new Map(api.map((r) => [r.percentile, r.value]))
  let matched = 0
  let missing = 0
  let drift = 0
  for (const [pct, rv] of refMap) {
    if (!apiMap.has(pct)) { missing++; continue }
    const av = apiMap.get(pct)
    const diff = Math.abs(rv - av)
    const ok = diff <= 5 || diff / Math.max(Math.abs(rv), Math.abs(av), 1) <= 1e-3
    if (ok) matched++
    else drift++
  }
  return { matched, missing, drift, total: refMap.size }
}

loadEnv()
const apiKey = process.env.NUXT_PUBLIC_WID_API_KEY?.trim()
if (!apiKey) {
  console.error('Missing NUXT_PUBLIC_WID_API_KEY in webapp/.env')
  process.exit(1)
}
if (!existsSync(refDir())) {
  console.error('Reference dump not found:', refDir())
  process.exit(1)
}

const baseUrl = process.env.NUXT_PUBLIC_WID_API_BASE_URL
  || 'https://rfap9nitz6.execute-api.eu-west-1.amazonaws.com/prod'
const header = buildHeader(apiKey)

console.log('Reference:', refDir())
console.log('Cases:', CASES.length)
console.log('---')

let failed = 0
for (const testCase of CASES) {
  const reference = await readRef(testCase)
  const api = await fetchApi(testCase, baseUrl, header)
  const { matched, missing, drift, total } = compare(reference, api)
  const rate = matched / total
  const ok = missing === 0 && rate >= 0.95
  if (!ok) failed++
  console.log(
    `${ok ? 'OK' : 'FAIL'}  ${testCase.label}  `
    + `${matched}/${total} (${(rate * 100).toFixed(1)}%)  missing=${missing} drift=${drift}`,
  )
}

console.log('---')
process.exit(failed ? 1 : 0)
