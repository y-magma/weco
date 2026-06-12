import { WID_COUNTRY_NAMES } from '@src/data-sources/wid/widCountryNames'

const FRENCH_REGION_NAMES = new Intl.DisplayNames(['fr'], { type: 'region' })

/** WID historical / special codes with explicit French labels. */
const FRENCH_SPECIAL_COUNTRY_NAMES: Record<string, string> = {
  CS: 'Tchécoslovaquie',
  DD: 'République démocratique allemande',
  SU: 'URSS',
  YU: 'Yougoslavie',
  ZZ: 'Zanzibar',
}

/** Resolve a WID area code to a human-readable name (French when available). */
export function countryDisplayName(code: string): string {
  const key = code.trim().toUpperCase()
  if (!key) return ''

  if (FRENCH_SPECIAL_COUNTRY_NAMES[key]) {
    return FRENCH_SPECIAL_COUNTRY_NAMES[key]!
  }

  if (!key.includes('-')) {
    try {
      const french = FRENCH_REGION_NAMES.of(key)
      if (french && french !== key) return french
    } catch {
      // Intl may reject non-ISO codes — fall through to WID dictionary.
    }
  }

  return WID_COUNTRY_NAMES[key] ?? key
}

/** Format for selectors: « France (FR) ». */
export function formatCountryLabel(code: string): string {
  const key = code.trim().toUpperCase()
  const name = countryDisplayName(key)
  return name === key ? key : `${name} (${key})`
}
