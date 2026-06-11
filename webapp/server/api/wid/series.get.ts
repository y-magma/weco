import { readSeries } from '../../utils/widCsv'

/**
 * GET /api/wid/series?country=FR&variable=ahweal&age=992&pop=j&percentile=p0p100
 *     [&yearFrom=1980&yearTo=2023]
 * Returns the year/value series for one (variable, percentile) from the dump.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const country = String(query.country ?? '').trim()
  const variable = String(query.variable ?? '').trim()
  const age = String(query.age ?? '').trim()
  const pop = String(query.pop ?? '').trim()
  const percentile = String(query.percentile ?? 'p0p100').trim()
  const yearFrom = query.yearFrom != null ? Number.parseInt(String(query.yearFrom), 10) : undefined
  const yearTo = query.yearTo != null ? Number.parseInt(String(query.yearTo), 10) : undefined

  if (!country || !variable || !age || !pop) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required query: country, variable, age, pop',
    })
  }

  const points = await readSeries({
    country,
    sixlet: variable,
    age,
    pop,
    percentile,
    yearFrom: Number.isFinite(yearFrom) ? yearFrom : undefined,
    yearTo: Number.isFinite(yearTo) ? yearTo : undefined,
  })

  return { country, variable, age, pop, percentile, points }
})
