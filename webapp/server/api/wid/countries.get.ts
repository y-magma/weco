import { listAvailableCountries } from '../../utils/widCsv'

/** Human-readable labels for the most common WID areas (fallback: the code). */
const COUNTRY_LABELS: Record<string, string> = {
  FR: 'France',
  US: 'United States',
  GB: 'United Kingdom',
  DE: 'Germany',
  IT: 'Italy',
  ES: 'Spain',
  BR: 'Brazil',
  IN: 'India',
  ZA: 'South Africa',
  CN: 'China',
  JP: 'Japan',
  RU: 'Russia',
  CA: 'Canada',
  AU: 'Australia',
}

/**
 * GET /api/wid/countries
 * Lists the areas available in the local dump, with a friendly label.
 */
export default defineEventHandler(() => {
  const codes = listAvailableCountries()
  const countries = codes.map((code) => ({
    code,
    label: COUNTRY_LABELS[code] ?? code,
  }))
  return { countries }
})
