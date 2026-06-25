import type { SeriesPoint } from '@domain/entities'
import { fetchText } from '@infrastructure/http/fetchJson'
import {
  buildOecdDataUrl,
  findOecdIndicator,
} from '@infrastructure/data-sources/oecd-idd/oecdIddCatalog'
import { toIso3 } from '@infrastructure/data-sources/oecd-idd/oecdIddCountries'

export function parseOecdIddCsv(csv: string): SeriesPoint[] {
  const lines = csv.trim().split(/\r?\n/)
  if (lines.length < 2) return []

  const header = lines[0]!.split(',')
  const timeIdx = header.indexOf('TIME_PERIOD')
  const valueIdx = header.indexOf('OBS_VALUE')
  if (timeIdx === -1 || valueIdx === -1) return []

  const points: SeriesPoint[] = []

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i]!.split(',')
    if (row[0] === 'STRUCTURE') continue

    const yearStr = row[timeIdx]?.trim()
    const valueStr = row[valueIdx]?.trim()
    if (!yearStr || !valueStr) continue

    const year = Number.parseInt(yearStr, 10)
    const value = Number.parseFloat(valueStr)
    if (!Number.isFinite(year) || !Number.isFinite(value)) continue

    points.push({ year, value })
  }

  return points.sort((a, b) => a.year - b.year)
}

export async function fetchOecdTimeSeries(
  iso2Country: string,
  indicatorId: string,
  yearFrom?: number,
  yearTo?: number,
): Promise<SeriesPoint[]> {
  const indicator = findOecdIndicator(indicatorId)
  if (!indicator) {
    throw new Error(`Indicateur OECD inconnu : ${indicatorId}`)
  }

  const iso3 = toIso3(iso2Country)
  if (!iso3) {
    throw new Error(`Pays non couvert par OECD IDD : ${iso2Country}`)
  }

  const url = buildOecdDataUrl(indicator, iso3, yearFrom, yearTo)
  const csv = await fetchText(url)
  const points = parseOecdIddCsv(csv)

  if (points.length === 0) {
    throw new Error(
      `L'API OECD n'a renvoyé aucune série pour ${iso2Country} · ${indicator.label}.`,
    )
  }

  return points
}
