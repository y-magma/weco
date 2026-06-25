import type { CountryOption } from '@domain/entities'
import { fetchJson } from '@infrastructure/http/fetchJson'

interface WdiCountryRow {
  id: string
  iso2Code?: string
  name: string
  region?: { id?: string; value?: string }
  incomeLevel?: { id?: string; value?: string }
}

interface WdiCountryResponse {
  0?: { page: number; pages: number; total: number }
  1?: WdiCountryRow[]
}

const ISO2_TO_ISO3 = new Map<string, string>()
const ISO3_TO_ISO2 = new Map<string, string>()

/** Aggregates and non-country entities returned by WDI. */
const EXCLUDED_REGION_IDS = new Set([
  'AFR', 'AFE', 'AFW', 'ARB', 'CEB', 'CSS', 'EAP', 'EAR', 'EAS', 'ECA', 'ECS', 'EUU',
  'FCS', 'HIC', 'HPC', 'IBD', 'IBT', 'IDA', 'IDB', 'IDX', 'LAC', 'LCN', 'LDC', 'LMY',
  'LTE', 'MEA', 'MNA', 'NAC', 'OED', 'OSS', 'PRE', 'PSS', 'PST', 'SAS', 'SSA', 'SSF',
  'SST', 'TEA', 'TEC', 'TLA', 'TMN', 'TSA', 'TSS', 'UMC', 'WLD',
])

let cachedCountries: CountryOption[] | undefined
let cachedIsoMapsBuilt = false

function buildIsoMaps(rows: WdiCountryRow[]): void {
  if (cachedIsoMapsBuilt) return
  for (const row of rows) {
    const iso2 = (row.iso2Code ?? row.id)?.toUpperCase()
    const iso3 = row.id?.toUpperCase()
    if (!iso2 || !iso3 || iso2.length !== 2 || iso3.length !== 3) continue
    if (EXCLUDED_REGION_IDS.has(iso3)) continue
    ISO2_TO_ISO3.set(iso2, iso3)
    ISO3_TO_ISO2.set(iso3, iso2)
  }
  cachedIsoMapsBuilt = true
}

export async function ensureWorldBankIsoMaps(): Promise<void> {
  if (!cachedIsoMapsBuilt) {
    await fetchWorldBankCountries()
  }
}

export function toIso3(iso2: string): string | undefined {
  return ISO2_TO_ISO3.get(iso2.toUpperCase())
}

export function toIso2(iso3: string): string | undefined {
  return ISO3_TO_ISO2.get(iso3.toUpperCase())
}

export async function fetchWorldBankCountries(): Promise<CountryOption[]> {
  if (cachedCountries?.length) return cachedCountries

  const allRows: WdiCountryRow[] = []
  let page = 1
  let pages = 1

  while (page <= pages) {
    const url = `https://api.worldbank.org/v2/country?format=json&per_page=400&page=${page}`
    const response = await fetchJson<WdiCountryResponse | [unknown, WdiCountryRow[]]>(url, {
      timeoutMs: 20000,
    })

    const meta = Array.isArray(response) ? response[0] as { pages?: number } : response[0]
    const rows = Array.isArray(response) ? response[1] ?? [] : response[1] ?? []
    pages = meta?.pages ?? 1
    allRows.push(...rows)
    page += 1
  }

  buildIsoMaps(allRows)

  cachedCountries = allRows
    .filter((row) => {
      const iso3 = row.id?.toUpperCase()
      const iso2 = row.iso2Code?.toUpperCase()
      if (!iso3 || !iso2 || iso2.length !== 2 || iso3.length !== 3) return false
      return !EXCLUDED_REGION_IDS.has(iso3)
    })
    .map((row) => ({
      code: row.iso2Code!.toUpperCase(),
      label: row.name,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'fr'))

  return cachedCountries
}

/** Reset caches — for tests. */
export function resetWorldBankCountryCache(): void {
  cachedCountries = undefined
  cachedIsoMapsBuilt = false
  ISO2_TO_ISO3.clear()
  ISO3_TO_ISO2.clear()
}
