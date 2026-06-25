import type { SeriesPoint } from '@domain/entities'
import { fetchJson } from '@infrastructure/http/fetchJson'

interface WdiIndicatorRow {
  indicator?: { id?: string }
  country?: { id?: string }
  countryiso3code?: string
  date?: string
  value?: string | number | null
}

type WdiResponse = [
  { page?: number; pages?: number; per_page?: number; total?: number },
  WdiIndicatorRow[] | null,
]

export function parseWdiResponse(json: WdiResponse): SeriesPoint[] {
  const rows = json[1]
  if (!rows?.length) return []

  const points: SeriesPoint[] = []

  for (const row of rows) {
    if (row.value === null || row.value === undefined || row.value === '') continue
    const year = Number.parseInt(String(row.date ?? ''), 10)
    const value = Number.parseFloat(String(row.value))
    if (!Number.isFinite(year) || !Number.isFinite(value)) continue
    points.push({ year, value })
  }

  return points.sort((a, b) => a.year - b.year)
}

export async function fetchWdiTimeSeries(
  iso2Country: string,
  indicatorId: string,
  yearFrom?: number,
  yearTo?: number,
): Promise<SeriesPoint[]> {
  const country = iso2Country.toUpperCase()
  const dateRange = yearFrom !== undefined || yearTo !== undefined
    ? `${yearFrom ?? ''}:${yearTo ?? ''}`
    : undefined

  const params = new URLSearchParams({
    format: 'json',
    per_page: '1000',
  })
  if (dateRange) params.set('date', dateRange)

  const url = `https://api.worldbank.org/v2/country/${country}/indicator/${indicatorId}?${params.toString()}`
  const response = await fetchJson<WdiResponse>(url, { timeoutMs: 20000 })
  const points = parseWdiResponse(response)

  if (points.length === 0) {
    throw new Error(
      `L'API World Bank (WDI) n'a renvoyé aucune série pour ${country} · ${indicatorId}.`,
    )
  }

  return points
}
