# L5 — Adaptateur World Bank

## Contexte

- **L1** : [Sources — World Bank](../../L1-produit/sources-utilisateur.md#world-bank)
- **L3** : [Bundles PIP / WDI](../../L3-domaine/bundles-deciles.md)

## Fichiers

| Rôle | Chemin |
|------|--------|
| Source | `lib/infrastructure/data-sources/worldbank/worldBankSource.ts` |
| PIP client | `lib/infrastructure/data-sources/worldbank/worldBankPipClient.ts` |
| WDI client | `lib/infrastructure/data-sources/worldbank/worldBankWdiClient.ts` |
| Catalogue | `lib/infrastructure/data-sources/worldbank/worldBankCatalog.ts` |
| Déciles PIP | `lib/infrastructure/data-sources/worldbank/worldBankDeciles.ts` |
| Quintiles WDI | `lib/infrastructure/data-sources/worldbank/worldBankQuintiles.ts` |
| Pays ISO | `lib/infrastructure/data-sources/worldbank/worldBankCountries.ts` |
| Labels bundles | `lib/infrastructure/data-sources/decileBundles.ts` |

## Identité

- `id`: `worldbank`
- `capabilities`: `{ percentileProfile: false, decileProfile: true, timeSeries: true, scatter: false }`

## Profil exploration

- Variables bundle : `PIP_DECILE_SHARES`, `WDI_QUINTILE_BUNDLE`.
- Construction profil agrégé : mid-ranks `PIP_DECILE_MID_RANKS`, `WDI_QUINTILE_MID_RANKS`.
- `fetchPipRows`, `findPipRowForYear`, `pipProfileYears`.

## Séries temporelles

- PIP : `fetchPipTimeSeries`
- WDI : `fetchWdiTimeSeries`
- Indicateurs scalaires WDI via catalogue.

## UI spécifique

- `worldBankPrimaryTimeSeriesIndicators` — sous-ensemble panel index 0.

## Tests

| Fichier | Couverture |
|---------|------------|
| `worldBankPipClient.spec.ts` | PIP parsing |
| `worldBankWdiClient.spec.ts` | WDI |
| `worldBankSource.spec.ts` | Source intégration |
| `worldBankQuintiles.spec.ts` | Quintiles |

## À compléter

- [ ] Endpoints API PIP / WDI
- [ ] Mapping ISO2/ISO3 `toIso3`, `ensureWorldBankIsoMaps`
- [ ] Construction `PercentileProfile` depuis row PIP année fixe

## Notes de reconstruction

Implémenter clients PIP/WDI avec fixtures avant profil décile UI.
