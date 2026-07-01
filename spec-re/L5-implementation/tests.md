# L5 — Suite de tests Vitest

## Contexte

- Objectif reconstruction : **réimplémenter tests en parallèle du code** — ils formalisent le contrat.

## Commandes

```bash
cd webapp && npm test
npm run test:watch
```

## Couverture par couche

### domain/ (7 specs)

| Spec | Module cible |
|------|--------------|
| `percentiles.spec.ts` | `@domain/services/percentiles` |
| `widCodes.spec.ts` | `@domain/catalog/widCodes` |
| `joinProfiles.spec.ts` | `@domain/services/joinProfiles` |
| `countryLabels.spec.ts` | `@domain/catalog/countryLabels` |
| `widParamAvailability.spec.ts` | `@domain/services/widParamAvailability` |

### application/ (1 spec)

| Spec | Module |
|------|--------|
| `ListCountriesUseCase.spec.ts` | use case |

### infrastructure/ (9 specs)

| Spec | Module |
|------|--------|
| `widClient.spec.ts` | WID client + parsing |
| `widApiKey.spec.ts` | API key header |
| `oecdIddClient.spec.ts` | OECD client |
| `worldBankPipClient.spec.ts` | PIP |
| `worldBankWdiClient.spec.ts` | WDI |
| `worldBankSource.spec.ts` | Source WB |
| `worldBankQuintiles.spec.ts` | Quintiles |
| `dataSourceRegistry.spec.ts` | Registry |
| `paramMetadataStore.spec.ts` | Metadata cache |

### visualization/ (15 specs)

| Spec | Module |
|------|--------|
| `profileChart.spec.ts` | profile.ts |
| `trapezoidApproximation.spec.ts` | trapezoidApproximation.ts |
| `trapezoidChart.spec.ts` | trapezoidChart.ts |
| `populationPartition.spec.ts` | populationPartition.ts |
| `drilldown.spec.ts` | drilldown.ts |
| `empiricalDistributionSmooth.spec.ts` | empiricalDistributionSmooth.ts |
| `axisScale.spec.ts` | axisScale.ts |
| `symlogScale.spec.ts` | symlogScale.ts |
| `axisFormat.spec.ts` | axisFormat.ts |
| `chartZoom.spec.ts` | chartZoom.ts |
| `timeSeries.spec.ts` | timeSeries.ts |
| `timeSeriesPartition.spec.ts` | timeSeriesPartition.ts |
| `scatterProfiles.spec.ts` | scatterProfiles.ts |
| `profileHelp.spec.ts` | profileHelp.ts |

## Helpers

`test/helpers/testEnv.ts` — setup commun.

## Stratégie reconstruction

1. Copier structure `test/` en premier sprint.
2. Chaque spec doit passer **sans réseau ni DOM**.
3. Fixtures JSON WID/OECD/WB à extraire des specs existantes → annexes L5 sources.
4. Pas de tests composants Vue actuellement — E2E hors scope sauf ajout futur documenté.

## À compléter

- [ ] Aligner `test/README.md` webapp avec liste réelle (29 specs)
- [ ] Documenter fixtures inline par spec
- [ ] Seuil couverture cible

## Voir aussi

- [visualization/README](../visualization/README.md)
