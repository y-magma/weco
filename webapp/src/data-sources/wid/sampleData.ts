import type { DataSeries, DistributionSeries, SeriesPoint } from '@src/domain/types'

function generateTrend(
  base: number,
  slope: number,
  yearFrom: number,
  yearTo: number,
  noise = 0.4,
): SeriesPoint[] {
  const points: SeriesPoint[] = []
  for (let year = yearFrom; year <= yearTo; year++) {
    const wave = Math.sin((year - yearFrom) / 6) * noise
    points.push({
      year,
      value: Number((base + (year - yearFrom) * slope + wave).toFixed(2)),
    })
  }
  return points
}

const SAMPLE_SERIES: Record<string, Record<string, SeriesPoint[]>> = {
  FR: {
    sptinc: generateTrend(28, 0.18, 1980, 2023),
    sptop1: generateTrend(8.5, 0.08, 1980, 2023),
    ghini: generateTrend(0.28, 0.0015, 1980, 2023, 0.01),
    stress_index: generateTrend(42, 0.35, 1980, 2023, 1.2),
  },
  US: {
    sptinc: generateTrend(32, 0.22, 1980, 2023),
    sptop1: generateTrend(10, 0.12, 1980, 2023),
    ghini: generateTrend(0.34, 0.002, 1980, 2023, 0.01),
    stress_index: generateTrend(48, 0.42, 1980, 2023, 1.5),
  },
  GB: {
    sptinc: generateTrend(29, 0.2, 1980, 2023),
    sptop1: generateTrend(9, 0.1, 1980, 2023),
    ghini: generateTrend(0.31, 0.0018, 1980, 2023, 0.01),
    stress_index: generateTrend(45, 0.38, 1980, 2023, 1.3),
  },
}

const DEFAULT_COUNTRY = 'FR'

export function getSampleSeries(
  countryCode: string,
  indicatorId: string,
  yearFrom = 1980,
  yearTo = 2023,
): DataSeries {
  const countryData = SAMPLE_SERIES[countryCode] ?? SAMPLE_SERIES[DEFAULT_COUNTRY]
  const points = (countryData?.[indicatorId] ?? generateTrend(30, 0.1, yearFrom, yearTo))
    .filter((p) => p.year >= yearFrom && p.year <= yearTo)

  return {
    id: `${countryCode}-${indicatorId}`,
    label: `${countryCode} · ${indicatorId}`,
    points,
    metadata: { sample: true },
  }
}

export function getSampleDistribution(
  countryCode: string,
  indicatorId: string,
  year = 2020,
): DistributionSeries {
  const percentiles = ['p10', 'p20', 'p30', 'p40', 'p50', 'p60', 'p70', 'p80', 'p90', 'p99']
  const base = countryCode === 'US' ? 1.4 : 1.1

  return {
    id: `${countryCode}-${indicatorId}-dist-${year}`,
    label: `${countryCode} distribution (${year})`,
    year,
    points: percentiles.map((percentile, index) => ({
      percentile,
      value: Number((base * (index + 1) * 8 + (indicatorId === 'sptinc' ? 5 : 0)).toFixed(2)),
    })),
  }
}

export function getSampleScatter(
  indicatorId: string,
  stressIndicatorId: string,
  yearFrom = 1980,
  yearTo = 2023,
) {
  return Object.keys(SAMPLE_SERIES).flatMap((countryCode) => {
    const inequality = getSampleSeries(countryCode, indicatorId, yearFrom, yearTo)
    const stress = getSampleSeries(countryCode, stressIndicatorId, yearFrom, yearTo)

    return inequality.points.map((point) => {
      const stressPoint = stress.points.find((s) => s.year === point.year)
      return {
        x: point.value,
        y: stressPoint?.value ?? 0,
        label: countryCode,
        year: point.year,
      }
    })
  })
}
