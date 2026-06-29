import { PIP_DECILE_IDS } from '@domain/catalog/decileBundles'

export {
  isPipDecileBundleVariable,
  PIP_DECILE_BUNDLE_ID,
  PIP_DECILE_IDS,
  PIP_DECILE_OPTIONS,
  PIP_DECILE_PROFILE_HELP,
} from '@domain/catalog/decileBundles'

export type PipDecileId = (typeof PIP_DECILE_IDS)[number]

export function isPipDecileId(id: string): id is PipDecileId {
  return (PIP_DECILE_IDS as readonly string[]).includes(id)
}

/** Mid-rank (percent) for each decile bucket — used in synthetic PercentileProfile. */
export const PIP_DECILE_MID_RANKS: readonly number[] = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95]
