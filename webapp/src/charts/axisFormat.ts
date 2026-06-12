/**
 * Compact axis tick labels (WID-style): 0, 1000, 10k, 100k, 1M, 10M, 1B…
 */
export function formatCompactAxisValue(value: number): string {
  if (!Number.isFinite(value)) return ''
  if (value === 0) return '0'

  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  if (abs < 10_000) {
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
