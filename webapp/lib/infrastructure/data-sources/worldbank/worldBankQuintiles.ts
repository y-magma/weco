import type { SeriesPoint } from '@domain/entities'
import { WDI_QUINTILE_IDS } from '@domain/catalog/decileBundles'

export {
  isWdiQuintileBundleVariable,
  WDI_QUINTILE_BUNDLE_ID,
  WDI_QUINTILE_IDS,
  WDI_QUINTILE_OPTIONS,
} from '@domain/catalog/decileBundles'

export type WdiQuintileId = (typeof WDI_QUINTILE_IDS)[number]

export function isWdiQuintileId(id: string): id is WdiQuintileId {
  return (WDI_QUINTILE_IDS as readonly string[]).includes(id)
}

/** Mid-rank (percent) for each quintile bucket — used in synthetic PercentileProfile. */
export const WDI_QUINTILE_MID_RANKS: readonly number[] = [10, 30, 50, 70, 90]

export function wdiQuintileProfileYears(seriesList: readonly SeriesPoint[][]): number[] {
  if (seriesList.length === 0) return []
  const yearSets = seriesList.map((series) => new Set(series.map((point) => point.year)))
  if (yearSets.some((set) => set.size === 0)) return []

  let years = [...yearSets[0]!]
  for (let index = 1; index < yearSets.length; index += 1) {
    const set = yearSets[index]!
    years = years.filter((year) => set.has(year))
  }

  return years.sort((a, b) => b - a)
}
