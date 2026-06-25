import type {
  CountryOption,
  DataSeries,
  FetchProfileParams,
  FetchVariableTimeSeriesParams,
  ListAvailableParamsParams,
  ListCountriesParams,
  ListProfileYearsParams,
  ParamAvailabilityEntity,
  PercentileProfile,
} from '@domain/entities'
import type { DataSourcePort, DataSourceStatus } from '@domain/ports/DataSourcePort'
import {
  labelForDecileBundleSub,
} from '@infrastructure/data-sources/decileBundles'
import {
  CACHE_TTL_METADATA_MS,
  CACHE_TTL_YEARS_MS,
  dataSourceCache,
} from '@infrastructure/cache/cache'
import {
  findWorldBankIndicator,
  isWorldBankProfileVariable,
  WORLD_BANK_INDICATORS,
} from '@infrastructure/data-sources/worldbank/worldBankCatalog'
import {
  ensureWorldBankIsoMaps,
  fetchWorldBankCountries,
  toIso3,
} from '@infrastructure/data-sources/worldbank/worldBankCountries'
import {
  isPipDecileBundleVariable,
  isPipDecileId,
  PIP_DECILE_BUNDLE_ID,
  PIP_DECILE_IDS,
  PIP_DECILE_MID_RANKS,
} from '@infrastructure/data-sources/worldbank/worldBankDeciles'
import {
  fetchPipRows,
  fetchPipTimeSeries,
  findPipRowForYear,
  pipProfileYears,
} from '@infrastructure/data-sources/worldbank/worldBankPipClient'
import { fetchWdiTimeSeries } from '@infrastructure/data-sources/worldbank/worldBankWdiClient'
import {
  isWdiQuintileBundleVariable,
  isWdiQuintileId,
  WDI_QUINTILE_BUNDLE_ID,
} from '@infrastructure/data-sources/worldbank/worldBankQuintiles'

export class WorldBankDataSource implements DataSourcePort {
  readonly id = 'worldbank'
  readonly label = 'World Bank'
  readonly description =
    'World Bank WDI + PIP — Gini, parts par décile/quintile, pauvreté internationale (enquêtes ménages).'
  readonly website = 'https://pip.worldbank.org/'
  readonly capabilities = {
    percentileProfile: false,
    decileProfile: true,
    timeSeries: true,
    scatter: false,
  } as const

  readonly indicators = WORLD_BANK_INDICATORS

  private lastFetchAt?: string
  private lastError?: string

  async listCountries(_params?: ListCountriesParams): Promise<CountryOption[]> {
    const cacheKey = dataSourceCache.buildKey(this.id, 'countries', {})
    const cached = dataSourceCache.get<CountryOption[]>(cacheKey)
    if (cached?.length) return cached

    try {
      const countries = await fetchWorldBankCountries()
      this.lastFetchAt = new Date().toISOString()
      this.lastError = undefined
      dataSourceCache.set(cacheKey, countries, CACHE_TTL_METADATA_MS)
      return countries
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Échec du chargement des pays WB'
      throw new Error(this.lastError)
    }
  }

  async listAvailableParams(_params: ListAvailableParamsParams): Promise<ParamAvailabilityEntity> {
    return { combos: [], ages: [], pops: [] }
  }

  async fetchPercentileProfile(params: FetchProfileParams): Promise<PercentileProfile> {
    if (!isWorldBankProfileVariable(params.variable)) {
      throw new Error(`World Bank ne fournit pas de profil pour ${params.variable}.`)
    }

    const cacheKey = dataSourceCache.buildKey(this.id, 'percentile-profile', params)
    const cached = dataSourceCache.get<PercentileProfile>(cacheKey)
    if (cached) return cached

    if (params.variable === PIP_DECILE_BUNDLE_ID) {
      const profile = await this.buildPipDecileProfile(params)
      dataSourceCache.set(cacheKey, profile)
      return profile
    }

    throw new Error(`Profil World Bank non implémenté pour ${params.variable}.`)
  }

  private async buildPipDecileProfile(params: FetchProfileParams): Promise<PercentileProfile> {
    await ensureWorldBankIsoMaps()
    const iso3 = toIso3(params.countryCode)
    if (!iso3) {
      throw new Error(`Pays non couvert par World Bank PIP : ${params.countryCode}`)
    }

    const rows = await fetchPipRows(iso3)
    const countryRows = rows.filter((row) => row.countryCode === iso3)
    const row = findPipRowForYear(countryRows, params.year)

    if (!row) {
      throw new Error(
        `Aucune enquête PIP pour ${params.countryCode} en ${params.year}.`,
      )
    }

    const points = PIP_DECILE_IDS.map((decileId, index) => ({
      percentile: decileId,
      rank: PIP_DECILE_MID_RANKS[index]!,
      value: row.deciles[decileId] ?? null,
    }))

    if (points.every((point) => point.value === null)) {
      throw new Error(`Déciles PIP indisponibles pour ${params.countryCode} · ${params.year}.`)
    }

    const profile: PercentileProfile = {
      id: `${params.countryCode}-${params.variable}-${params.year}`,
      country: params.countryCode,
      variable: params.variable,
      year: params.year,
      age: '',
      pop: '',
      label: `Parts par décile — ${params.countryCode} (${params.year})`,
      unit: 'part (0–1)',
      kind: 'share',
      points,
      sample: false,
    }

    this.lastFetchAt = new Date().toISOString()
    this.lastError = undefined
    return profile
  }

  async fetchVariableTimeSeries(params: FetchVariableTimeSeriesParams): Promise<DataSeries> {
    const cacheKey = dataSourceCache.buildKey(this.id, 'variable-series', params)
    const cached = dataSourceCache.get<DataSeries>(cacheKey)
    if (cached) return cached

    let fetchVariableId = params.variable
    let bundleSubId: string | undefined

    if (isPipDecileBundleVariable(params.variable)) {
      if (!params.percentile || !isPipDecileId(params.percentile)) {
        const message = 'Sélectionnez un décile PIP (D1–D10).'
        this.lastError = message
        throw new Error(message)
      }
      bundleSubId = params.percentile
      fetchVariableId = params.percentile
    } else if (isWdiQuintileBundleVariable(params.variable)) {
      if (!params.percentile || !isWdiQuintileId(params.percentile)) {
        const message = 'Sélectionnez un quintile WDI (Q1–Q5).'
        this.lastError = message
        throw new Error(message)
      }
      bundleSubId = params.percentile
      fetchVariableId = params.percentile
    }

    const indicator = findWorldBankIndicator(
      isPipDecileBundleVariable(params.variable) || isWdiQuintileBundleVariable(params.variable)
        ? params.variable
        : fetchVariableId,
    )

    if (!indicator && !isPipDecileId(fetchVariableId) && !isWdiQuintileId(fetchVariableId)) {
      const message = `Indicateur World Bank inconnu : ${params.variable}`
      this.lastError = message
      throw new Error(message)
    }

    const resolvedIndicator = indicator ?? findWorldBankIndicator(params.variable)

    try {
      let series: DataSeries

      if (isPipDecileBundleVariable(params.variable) || resolvedIndicator?.api === 'pip') {
        await ensureWorldBankIsoMaps()
        const iso3 = toIso3(params.countryCode)
        if (!iso3) {
          throw new Error(`Pays non couvert par World Bank : ${params.countryCode}`)
        }

        const field = bundleSubId ?? resolvedIndicator!.field
        const { points, metadata } = await fetchPipTimeSeries(
          iso3,
          field,
          params.yearFrom,
          params.yearTo,
        )

        const subLabel = bundleSubId
          ? labelForDecileBundleSub(params.variable, bundleSubId)
          : undefined

        series = {
          id: `${params.countryCode}-${params.variable}-${field}`,
          label: subLabel ?? `${params.countryCode} · ${resolvedIndicator?.label ?? field}`,
          unit: resolvedIndicator?.unit,
          points,
          metadata: {
            source: this.id,
            concept: resolvedIndicator?.concept ?? '',
            decileRatio: bundleSubId ?? '',
            ...metadata,
          },
        }
      } else {
        const wdiField = bundleSubId ?? resolvedIndicator!.field
        const points = await fetchWdiTimeSeries(
          params.countryCode,
          wdiField,
          params.yearFrom,
          params.yearTo,
        )

        const subLabel = bundleSubId
          ? labelForDecileBundleSub(params.variable, bundleSubId)
          : undefined

        series = {
          id: `${params.countryCode}-${params.variable}-${wdiField}`,
          label: subLabel ?? `${params.countryCode} · ${resolvedIndicator!.label}`,
          unit: resolvedIndicator!.unit,
          points,
          metadata: {
            source: this.id,
            concept: resolvedIndicator!.concept ?? '',
            decileRatio: bundleSubId ?? '',
          },
        }
      }

      this.lastFetchAt = new Date().toISOString()
      this.lastError = undefined
      dataSourceCache.set(cacheKey, series)
      return series
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Échec de la requête World Bank'
      throw new Error(this.lastError)
    }
  }

  async listProfileYears(params: ListProfileYearsParams): Promise<number[]> {
    const cacheKey = dataSourceCache.buildKey(this.id, 'profile-years', params)
    const cached = dataSourceCache.get<number[]>(cacheKey)
    if (cached?.length) return cached

    if (params.variable !== PIP_DECILE_BUNDLE_ID) {
      return []
    }

    await ensureWorldBankIsoMaps()
    const iso3 = toIso3(params.countryCode)
    if (!iso3) return []

    try {
      const rows = await fetchPipRows(iso3)
      const years = pipProfileYears(rows.filter((row) => row.countryCode === iso3))

      if (years.length > 0) {
        this.lastFetchAt = new Date().toISOString()
        this.lastError = undefined
        dataSourceCache.set(cacheKey, years, CACHE_TTL_YEARS_MS)
      }

      return years
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Échec de la requête World Bank'
      throw new Error(this.lastError)
    }
  }

  getStatus(): DataSourceStatus {
    return {
      id: this.id,
      label: this.label,
      description: this.description,
      website: this.website,
      enabled: true,
      lastFetchAt: this.lastFetchAt,
      lastError: this.lastError,
    }
  }
}

export function createWorldBankDataSource(): WorldBankDataSource {
  return new WorldBankDataSource()
}
