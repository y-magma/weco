export interface DataSourceWebsiteLink {
  id: string
  label: string
  href: string
}

/** Sites officiels des sources enregistrées dans l'application. */
export const DATA_SOURCE_WEBSITE_LINKS: readonly DataSourceWebsiteLink[] = [
  {
    id: 'wid',
    label: 'WID.world',
    href: 'https://wid.world/',
  },
  {
    id: 'oecd-idd',
    label: 'OECD IDD',
    href: 'https://www.oecd.org/social/income-distribution-database.htm',
  },
  {
    id: 'worldbank',
    label: 'World Bank — PIP',
    href: 'https://pip.worldbank.org/',
  },
]
