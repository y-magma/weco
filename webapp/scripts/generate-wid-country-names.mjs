/**
 * Regenerate lib/domain/catalog/widCountryNames.ts from data/WID_DATA/WID_countries.csv
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const csvPath = resolve(root, 'data/WID_DATA/WID_countries.csv')
const outPath = resolve(root, 'lib/domain/catalog/widCountryNames.ts')

const lines = readFileSync(csvPath, 'utf8').split(/\r?\n/)
const entries = []

for (let i = 1; i < lines.length; i += 1) {
  const line = lines[i]
  if (!line) continue
  const [alpha2, , shortname] = line.split(';')
  if (!alpha2 || !shortname) continue
  entries.push([alpha2.trim(), shortname.trim()])
}

entries.sort(([a], [b]) => a.localeCompare(b))

const body = entries
  .map(([code, name]) => `  ${JSON.stringify(code)}: ${JSON.stringify(name)},`)
  .join('\n')

const output = `/** Generated from data/WID_DATA/WID_countries.csv — do not edit by hand. */
export const WID_COUNTRY_NAMES: Record<string, string> = {
${body}
}
`

writeFileSync(outPath, output, 'utf8')
console.log(`Wrote ${entries.length} country names to ${outPath}`)
