# Tests Vitest — `webapp/test/`

Organisés par couche d'architecture. **30 suites** — logique pure uniquement (pas de composants Vue).

## domain/

| Fichier | Cible |
|---------|-------|
| `percentiles.spec.ts` | `@domain/services/percentiles` |
| `widCodes.spec.ts` | `@domain/catalog/widCodes` |
| `countryLabels.spec.ts` | `@domain/catalog/countryLabels` |
| `widParamAvailability.spec.ts` | `@domain/services/widParamAvailability` |

## application/

| Fichier | Cible |
|---------|-------|
| `ListCountriesUseCase.spec.ts` | `@application/use-cases/ListCountriesUseCase` |
| `panelSnapshots.spec.ts` | `@application/share/panelSnapshots` |
| `shareCodec.spec.ts` | `@application/share/shareCodec` |

## infrastructure/

| Fichier | Cible |
|---------|-------|
| `widClient.spec.ts` | `@infrastructure/data-sources/wid/widClient` |
| `widApiKey.spec.ts` | `@infrastructure/data-sources/wid/widApiKey` |
| `dataSourceRegistry.spec.ts` | `@infrastructure/data-sources/registry` |
| `oecdIddClient.spec.ts` | `@infrastructure/data-sources/oecd-idd/*` |
| `paramMetadataStore.spec.ts` | `@domain/services/paramMetadataStore` |
| `worldBankSource.spec.ts` | `@infrastructure/data-sources/worldbank/worldBankSource` |
| `worldBankPipClient.spec.ts` | `@infrastructure/data-sources/worldbank/worldBankPipClient` |
| `worldBankQuintiles.spec.ts` | `@infrastructure/data-sources/worldbank/worldBankQuintiles` |
| `worldBankWdiClient.spec.ts` | `@infrastructure/data-sources/worldbank/worldBankWdiClient` |

## visualization/

| Fichier | Cible |
|---------|-------|
| `profileChart.spec.ts` | `~/visualization/profile` |
| `profileHelp.spec.ts` | `~/visualization/profileHelp` |
| `drilldown.spec.ts` | `~/visualization/drilldown` |
| `axisFormat.spec.ts` | `~/visualization/axisFormat` |
| `axisScale.spec.ts` | `~/visualization/axisScale` |
| `symlogScale.spec.ts` | `~/visualization/symlogScale` |
| `timeSeries.spec.ts` | `~/visualization/timeSeries` |
| `timeSeriesHelp.spec.ts` | `~/visualization/timeSeriesHelp` |
| `timeSeriesPartition.spec.ts` | `~/visualization/timeSeriesPartition` |
| `trapezoidChart.spec.ts` | `~/visualization/trapezoidChart` |
| `trapezoidApproximation.spec.ts` | `~/visualization/trapezoidApproximation` |
| `empiricalDistributionSmooth.spec.ts` | `~/visualization/empiricalDistributionSmooth` |
| `populationPartition.spec.ts` | `~/visualization/populationPartition` |
