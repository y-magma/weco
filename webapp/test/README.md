# Tests Vitest — `webapp/test/`

Organisés par couche d'architecture.

## domain/

| Fichier | Cible |
|---------|-------|
| `percentiles.spec.ts` | `@domain/services/percentiles` |
| `widCodes.spec.ts` | `@domain/catalog/widCodes` |
| `joinProfiles.spec.ts` | `@domain/services/joinProfiles` |
| `countryLabels.spec.ts` | `@domain/catalog/countryLabels` |

## application/

| Fichier | Cible |
|---------|-------|
| `ListCountriesUseCase.spec.ts` | `@application/use-cases/ListCountriesUseCase` |

## infrastructure/

| Fichier | Cible |
|---------|-------|
| `widClient.spec.ts` | `@infrastructure/data-sources/wid/widClient` |
| `widApiKey.spec.ts` | `@infrastructure/data-sources/wid/widApiKey` |

## visualization/

| Fichier | Cible |
|---------|-------|
| `profileChart.spec.ts` | `~/visualization/profile` |
| `profileHelp.spec.ts` | `~/visualization/profileHelp` |
| `drilldown.spec.ts` | `~/visualization/drilldown` |
| `axisFormat.spec.ts` | `~/visualization/axisFormat` |
| `timeSeries.spec.ts` | `~/visualization/timeSeries` |
| `scatterProfiles.spec.ts` | `~/visualization/scatterProfiles` |
