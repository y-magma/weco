export const WID_NO_API_KEY_ERROR =
  'Clé API WID absente : définissez NUXT_PUBLIC_WID_API_KEY dans webapp/.env (clé hex du package R wid).'

export const WID_EMPTY_COUNTRIES_ERROR =
  "L'API WID n'a renvoyé aucun pays. Vérifiez NUXT_PUBLIC_WID_API_KEY et la connexion réseau."

export function widEmptyProfileError(params: {
  countryCode: string
  variable: string
  year: number
  age: string
  pop: string
}): string {
  return (
    `L'API WID n'a renvoyé aucune donnée pour le profil `
    + `${params.countryCode} · ${params.variable} (${params.year}, âge ${params.age}, pop ${params.pop}).`
  )
}

export function widEmptySeriesError(params: {
  countryCode: string
  indicatorId: string
  yearFrom?: number
  yearTo?: number
}): string {
  const years = params.yearFrom != null && params.yearTo != null
    ? ` (${params.yearFrom}–${params.yearTo})`
    : ''
  return (
    `L'API WID n'a renvoyé aucune série pour `
    + `${params.countryCode} · ${params.indicatorId}${years}.`
  )
}

export function widApiRequestError(cause: unknown): string {
  const detail = cause instanceof Error ? cause.message : 'erreur inconnue'
  return `Échec de la requête WID : ${detail}`
}
