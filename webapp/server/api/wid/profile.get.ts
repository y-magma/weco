import { readProfile } from '../../utils/widCsv'

/**
 * GET /api/wid/profile?country=FR&variable=ahweal&age=992&pop=j&year=2023
 * Returns the 127 g-percentile points read from the local WID dump.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const country = String(query.country ?? '').trim()
  const variable = String(query.variable ?? '').trim()
  const age = String(query.age ?? '').trim()
  const pop = String(query.pop ?? '').trim()
  const year = Number.parseInt(String(query.year ?? ''), 10)

  if (!country || !variable || !age || !pop || !Number.isFinite(year)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required query: country, variable, age, pop, year',
    })
  }

  const points = await readProfile({ country, sixlet: variable, age, pop, year })

  return {
    country,
    variable,
    age,
    pop,
    year,
    points,
  }
})
