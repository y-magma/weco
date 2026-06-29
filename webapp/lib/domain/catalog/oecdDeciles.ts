import { OECD_DECILE_RATIO_IDS } from '@domain/catalog/decileBundles'

export {
  isOecdDecileBundleVariable,
  OECD_DECILE_BUNDLE_ID,
  OECD_DECILE_RATIO_IDS,
  OECD_DECILE_RATIO_OPTIONS,
} from '@domain/catalog/decileBundles'

export type OecdDecileRatioId = (typeof OECD_DECILE_RATIO_IDS)[number]

export function isOecdDecileRatioId(id: string): id is OecdDecileRatioId {
  return (OECD_DECILE_RATIO_IDS as readonly string[]).includes(id)
}

export const OECD_DECILE_PROFILE_HELP =
  'L\'API OECD publie les ratios inter-déciles (P90/P10, P50/P10, P90/P50), pas les 127 centiles WID ni les seuils D1–D9 individuels.'
