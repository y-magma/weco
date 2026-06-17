import { formatCompactAxisValue } from '~/visualization/axisFormat'

/** Sous-titre affiché quand l'échelle log ordonnée (richesse) utilise le symlog. */
export const SYMLOG_VALUE_AXIS_DESCRIPTION =
  'Échelle log (symlog) : f(x) = signe(x)·log₁₀(1+|x|) — graduations en valeurs réelles x'

/** Plot coordinate: f(x) = sign(x) * log10(1 + |x|). f(0) = 0. */
export function symlogToCoord(value: number): number | null {
  if (!Number.isFinite(value)) return null
  if (value === 0) return 0
  const sign = value < 0 ? -1 : 1
  return sign * Math.log10(1 + Math.abs(value))
}

/** Inverse of `symlogToCoord`. */
export function symlogFromCoord(coord: number): number {
  if (!Number.isFinite(coord) || coord === 0) return 0
  const sign = coord < 0 ? -1 : 1
  return sign * (10 ** Math.abs(coord) - 1)
}

/** Axis tick: display the real value x for plot coordinate c. */
export function formatSymlogTick(coord: number): string {
  if (!Number.isFinite(coord)) return ''
  return formatCompactAxisValue(symlogFromCoord(coord))
}
