import type { SeriesPoint } from '@domain/entities'
import { fetchText } from '@infrastructure/http/fetchJson'
import { WORLD_BANK_DEFAULT_POVLINE } from '@infrastructure/data-sources/worldbank/worldBankCatalog'

export interface PipRow {
  countryCode: string
  reportingYear: number
  welfareType: string
  surveyAcronym: string
  surveyYear: number
  gini: number | null
  headcount: number | null
  povertyGap: number | null
  deciles: Record<string, number | null>
}

const PIP_BASE = 'https://api.worldbank.org/pip/v1/pip'

function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!
    if (ch === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (ch === ',' && !inQuotes) {
      fields.push(current)
      current = ''
      continue
    }
    current += ch
  }
  fields.push(current)
  return fields
}

function parseNumeric(value: string | undefined): number | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  const num = Number.parseFloat(trimmed)
  return Number.isFinite(num) ? num : null
}

export function parsePipCsv(csv: string): PipRow[] {
  const lines = csv.trim().split(/\r?\n/)
  if (lines.length < 2) return []

  const header = parseCsvLine(lines[0]!)
  const indexOf = (name: string) => header.indexOf(name)

  const countryIdx = indexOf('country_code')
  const yearIdx = indexOf('reporting_year')
  const welfareIdx = indexOf('welfare_type')
  const surveyIdx = indexOf('survey_acronym')
  const surveyYearIdx = indexOf('survey_year')
  const giniIdx = indexOf('gini')
  const headcountIdx = indexOf('headcount')
  const gapIdx = indexOf('poverty_gap')

  if (countryIdx === -1 || yearIdx === -1) return []

  const decileIndices: Record<string, number> = {}
  for (let d = 1; d <= 10; d++) {
    const key = `decile${d}`
    const idx = indexOf(key)
    if (idx !== -1) decileIndices[key] = idx
  }

  const rows: PipRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]?.trim()
    if (!line) continue
    const cols = parseCsvLine(line)

    const reportingYear = Number.parseInt(cols[yearIdx]?.trim() ?? '', 10)
    if (!Number.isFinite(reportingYear)) continue

    const deciles: Record<string, number | null> = {}
    for (const [key, idx] of Object.entries(decileIndices)) {
      deciles[key] = parseNumeric(cols[idx])
    }

    rows.push({
      countryCode: cols[countryIdx]?.trim().toUpperCase() ?? '',
      reportingYear,
      welfareType: cols[welfareIdx]?.trim() ?? '',
      surveyAcronym: cols[surveyIdx]?.trim() ?? '',
      surveyYear: parseNumeric(cols[surveyYearIdx]?.trim()) ?? reportingYear,
      gini: parseNumeric(cols[giniIdx]?.trim()),
      headcount: parseNumeric(cols[headcountIdx]?.trim()),
      povertyGap: parseNumeric(cols[gapIdx]?.trim()),
      deciles,
    })
  }

  return rows
}

export function extractPipTimeSeries(
  rows: PipRow[],
  field: string,
  yearFrom?: number,
  yearTo?: number,
): SeriesPoint[] {
  const points: SeriesPoint[] = []

  for (const row of rows) {
    if (yearFrom !== undefined && row.reportingYear < yearFrom) continue
    if (yearTo !== undefined && row.reportingYear > yearTo) continue

    let value: number | null = null
    if (field.startsWith('decile')) {
      value = row.deciles[field] ?? null
    } else if (field === 'gini') {
      value = row.gini
    } else if (field === 'headcount') {
      value = row.headcount
    } else if (field === 'poverty_gap') {
      value = row.povertyGap
    }

    if (value === null) continue
    points.push({ year: row.reportingYear, value })
  }

  return points.sort((a, b) => a.year - b.year)
}

export function findPipRowForYear(rows: PipRow[], year: number): PipRow | undefined {
  const exact = rows.find((row) => row.reportingYear === year)
  if (exact) return exact

  let closest: PipRow | undefined
  let minDiff = Infinity
  for (const row of rows) {
    const diff = Math.abs(row.reportingYear - year)
    if (diff < minDiff) {
      minDiff = diff
      closest = row
    }
  }
  return minDiff <= 2 ? closest : undefined
}

export function pipProfileYears(rows: PipRow[]): number[] {
  return [...new Set(rows.map((row) => row.reportingYear))].sort((a, b) => b - a)
}

export async function fetchPipRows(
  iso3Country: string,
  povline: number = WORLD_BANK_DEFAULT_POVLINE,
): Promise<PipRow[]> {
  const params = new URLSearchParams({
    country: iso3Country.toUpperCase(),
    format: 'csv',
    povline: String(povline),
    year: 'all',
    fill_gaps: 'false',
  })

  const url = `${PIP_BASE}?${params.toString()}`
  const csv = await fetchText(url, { timeoutMs: 30000 })
  return parsePipCsv(csv)
}

export async function fetchPipTimeSeries(
  iso3Country: string,
  field: string,
  yearFrom?: number,
  yearTo?: number,
  povline?: number,
): Promise<{ points: SeriesPoint[]; metadata: Record<string, string | number | boolean> }> {
  const rows = await fetchPipRows(iso3Country, povline)
  const countryRows = rows.filter((row) => row.countryCode === iso3Country.toUpperCase())

  if (countryRows.length === 0) {
    throw new Error(
      `L'API World Bank (PIP) n'a renvoyé aucune donnée pour ${iso3Country}.`,
    )
  }

  const points = extractPipTimeSeries(countryRows, field, yearFrom, yearTo)
  if (points.length === 0) {
    throw new Error(
      `L'API World Bank (PIP) n'a renvoyé aucune série pour ${iso3Country} · ${field}.`,
    )
  }

  const latest = countryRows[countryRows.length - 1]!
  return {
    points,
    metadata: {
      welfareType: latest.welfareType,
      surveyAcronym: latest.surveyAcronym,
      surveyYear: latest.surveyYear,
      povline: povline ?? WORLD_BANK_DEFAULT_POVLINE,
    },
  }
}
