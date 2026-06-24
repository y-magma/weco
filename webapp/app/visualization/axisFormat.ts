import type { MeasureKind } from '@domain/catalog/widCodes'

/**
 * Axis ticks for fractional quantities (WID shares s…, parts 0–1, Gini).
 * Unlike `formatCompactAxisValue`, preserves small magnitudes instead of rounding to 0.
 */
export function formatFractionAxisValue(value: number): string {
  if (!Number.isFinite(value)) return ''
  if (value === 0) return '0'

  const abs = Math.abs(value)
  if (abs >= 1) return value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
  if (abs >= 0.1) return value.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })
  if (abs >= 0.01) return value.toLocaleString('fr-FR', { maximumFractionDigits: 3 })
  if (abs >= 0.001) return value.toLocaleString('fr-FR', { maximumFractionDigits: 4 })
  if (abs >= 0.0001) return value.toLocaleString('fr-FR', { maximumFractionDigits: 5 })
  return value.toExponential(1)
}

/** Pick compact (wealth) or fractional tick formatting according to the WID measure kind. */
export function formatAxisValue(value: number, measureKind?: MeasureKind): string {
  if (measureKind === 'share' || measureKind === 'gini') {
    return formatFractionAxisValue(value)
  }
  return formatCompactAxisValue(value)
}

/**
 * Compact axis tick labels (WID-style): 0, 1000, 10k, 100k, 1M, 10M, 1B…
 */
export function formatCompactAxisValue(value: number): string {
  if (!Number.isFinite(value)) return ''
  if (value === 0) return '0'

  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  if (abs < 10_000) {
    if (abs < 1) return formatFractionAxisValue(value)
    return `${sign}${Math.round(abs)}`
  }

  const tiers: Array<{ threshold: number, suffix: string }> = [
    { threshold: 1e12, suffix: 'T' },
    { threshold: 1e9, suffix: 'B' },
    { threshold: 1e6, suffix: 'M' },
    { threshold: 1e3, suffix: 'k' },
  ]

  for (const { threshold, suffix } of tiers) {
    if (abs >= threshold) {
      const scaled = abs / threshold
      const rounded = Math.round(scaled * 10) / 10
      const text = Number.isInteger(rounded)
        ? String(rounded)
        : rounded.toFixed(1).replace(/\.0$/, '')
      return `${sign}${text}${suffix}`
    }
  }

  return `${sign}${Math.round(abs)}`
}
