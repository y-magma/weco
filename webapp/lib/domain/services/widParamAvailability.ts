import {
  findWidVariable,
  WID_GROUP_DEFAULTS,
  type WidParamCombo,
} from '@domain/catalog/widCodes'

export type { WidParamCombo }

export interface WidParamAvailability {
  combos: WidParamCombo[]
  ages: string[]
  pops: string[]
}

export type WidParamResolveMode = 'variableChange' | 'clamp'

export interface WidParamState {
  countryCode: string
  age: string
  pop: string
  year?: number
}

export interface WidParamResolveInput {
  current: WidParamState
  availability: WidParamAvailability
  availableYears?: number[]
  availableCountries?: string[]
  sixlet: string
  mode: WidParamResolveMode
}

/** Preferred age/pop combos for a variable (from catalogue group). */
export function preferredDefaultsForVariable(sixlet: string): WidParamCombo[] {
  const meta = findWidVariable(sixlet)
  if (!meta) return [{ age: '992', pop: 'j' }]
  return WID_GROUP_DEFAULTS[meta.group]
}

function comboKey(combo: WidParamCombo): string {
  return `${combo.age}:${combo.pop}`
}

function isComboAvailable(combo: WidParamCombo, availability: WidParamAvailability): boolean {
  return availability.combos.some(
    (item) => item.age === combo.age && item.pop === combo.pop,
  )
}

function pickCombo(
  preferred: WidParamCombo[],
  availability: WidParamAvailability,
  current: WidParamCombo,
  mode: WidParamResolveMode,
): WidParamCombo {
  if (mode === 'clamp' && isComboAvailable(current, availability)) {
    return current
  }

  for (const combo of preferred) {
    if (isComboAvailable(combo, availability)) return combo
  }

  return availability.combos[0] ?? current
}

function resolveCountry(
  countryCode: string,
  availableCountries: string[] | undefined,
): string {
  if (!availableCountries?.length) return countryCode
  if (availableCountries.includes(countryCode)) return countryCode
  if (availableCountries.includes('FR')) return 'FR'
  return availableCountries[0]!
}

function resolveYear(
  year: number | undefined,
  availableYears: number[] | undefined,
): number | undefined {
  if (!availableYears?.length) return year
  if (year != null && availableYears.includes(year)) return year
  return availableYears[0]
}

export type ParamAdjustmentField = 'year' | 'age' | 'pop'

export type ParamAdjustmentHints = Partial<Record<ParamAdjustmentField, string>>

/** User-facing message when the year was clamped to the latest available value. */
export function describeYearAdjustment(
  previousYear: number | undefined,
  newYear: number | undefined,
  availableYears: number[],
): string | null {
  if (previousYear == null || newYear == null || previousYear === newYear) return null
  const range = availableYears.length > 0
    ? (() => {
        const min = availableYears[availableYears.length - 1]!
        const max = availableYears[0]!
        return min === max ? `${max}` : `${min}–${max}`
      })()
    : ''
  const rangeHint = range ? ` (plage disponible : ${range})` : ''
  return `L'année ${previousYear} n'est pas disponible pour cette sélection${rangeHint} — bascule vers ${newYear}.`
}

/** User-facing message when age or pop was auto-adjusted. */
export function describeCodeAdjustment(
  fieldLabel: string,
  previousCode: string,
  newCode: string,
  newLabel: string,
): string | null {
  if (!previousCode || !newCode || previousCode === newCode) return null
  return `${fieldLabel} ajusté (${previousCode} → ${newLabel}).`
}

/** Build unique age/pop lists from combo rows. */
export function buildParamAvailability(combos: WidParamCombo[]): WidParamAvailability {
  const seen = new Set<string>()
  const unique: WidParamCombo[] = []
  for (const combo of combos) {
    const key = comboKey(combo)
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(combo)
  }
  const ages = [...new Set(unique.map((item) => item.age))]
  const pops = [...new Set(unique.map((item) => item.pop))]
  return { combos: unique, ages, pops }
}

/** Intersect age/pop combos from multiple availability sets. */
export function intersectParamAvailability(
  ...sets: WidParamAvailability[]
): WidParamAvailability {
  if (sets.length === 0) return { combos: [], ages: [], pops: [] }
  const [first, ...rest] = sets
  let combos = first!.combos
  for (const set of rest) {
    const allowed = new Set(set.combos.map(comboKey))
    combos = combos.filter((combo) => allowed.has(comboKey(combo)))
  }
  return buildParamAvailability(combos)
}

/** Intersect year lists (most recent first). */
export function intersectYears(...lists: number[][]): number[] {
  if (lists.length === 0) return []
  const [first, ...rest] = lists
  let years = new Set(first)
  for (const list of rest) {
    const allowed = new Set(list)
    years = new Set([...years].filter((year) => allowed.has(year)))
  }
  return [...years].sort((a, b) => b - a)
}

export function resolveWidParams(input: WidParamResolveInput): WidParamState {
  const preferred = preferredDefaultsForVariable(input.sixlet)
  const currentCombo = { age: input.current.age, pop: input.current.pop }
  const combo = pickCombo(
    preferred,
    input.availability,
    currentCombo,
    input.mode,
  )

  return {
    countryCode: resolveCountry(input.current.countryCode, input.availableCountries),
    age: combo.age,
    pop: combo.pop,
    year: resolveYear(input.current.year, input.availableYears),
  }
}
