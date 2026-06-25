import type { CountryOption } from '@domain/entities'
import { formatCountryLabel } from '@domain/catalog/countryLabels'

/** OECD member countries with ISO-3166 alpha-2 and alpha-3 codes. */
const OECD_COUNTRY_CODES: readonly { iso2: string; iso3: string }[] = [
  { iso2: 'AU', iso3: 'AUS' },
  { iso2: 'AT', iso3: 'AUT' },
  { iso2: 'BE', iso3: 'BEL' },
  { iso2: 'CA', iso3: 'CAN' },
  { iso2: 'CL', iso3: 'CHL' },
  { iso2: 'CO', iso3: 'COL' },
  { iso2: 'CR', iso3: 'CRI' },
  { iso2: 'CZ', iso3: 'CZE' },
  { iso2: 'DK', iso3: 'DNK' },
  { iso2: 'EE', iso3: 'EST' },
  { iso2: 'FI', iso3: 'FIN' },
  { iso2: 'FR', iso3: 'FRA' },
  { iso2: 'DE', iso3: 'DEU' },
  { iso2: 'GR', iso3: 'GRC' },
  { iso2: 'HU', iso3: 'HUN' },
  { iso2: 'IS', iso3: 'ISL' },
  { iso2: 'IE', iso3: 'IRL' },
  { iso2: 'IL', iso3: 'ISR' },
  { iso2: 'IT', iso3: 'ITA' },
  { iso2: 'JP', iso3: 'JPN' },
  { iso2: 'KR', iso3: 'KOR' },
  { iso2: 'LV', iso3: 'LVA' },
  { iso2: 'LT', iso3: 'LTU' },
  { iso2: 'LU', iso3: 'LUX' },
  { iso2: 'MX', iso3: 'MEX' },
  { iso2: 'NL', iso3: 'NLD' },
  { iso2: 'NZ', iso3: 'NZL' },
  { iso2: 'NO', iso3: 'NOR' },
  { iso2: 'PL', iso3: 'POL' },
  { iso2: 'PT', iso3: 'PRT' },
  { iso2: 'SK', iso3: 'SVK' },
  { iso2: 'SI', iso3: 'SVN' },
  { iso2: 'ES', iso3: 'ESP' },
  { iso2: 'SE', iso3: 'SWE' },
  { iso2: 'CH', iso3: 'CHE' },
  { iso2: 'TR', iso3: 'TUR' },
  { iso2: 'GB', iso3: 'GBR' },
  { iso2: 'US', iso3: 'USA' },
]

const ISO2_TO_ISO3 = new Map(OECD_COUNTRY_CODES.map((item) => [item.iso2, item.iso3]))

export function toIso3(iso2: string): string | undefined {
  return ISO2_TO_ISO3.get(iso2.trim().toUpperCase())
}

export function listOecdCountries(): CountryOption[] {
  return OECD_COUNTRY_CODES.map(({ iso2 }) => ({
    code: iso2,
    label: formatCountryLabel(iso2),
  }))
}
