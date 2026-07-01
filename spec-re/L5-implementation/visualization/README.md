# L5 — Modules visualization (ECharts)

## Contexte

- **L3** : [Transformations](../../L3-domaine/transformations.md)
- **L4** : [exploration/](../../L4-fonctionnalites/exploration/), [serie-temporelle/](../../L4-fonctionnalites/serie-temporelle/)

Chaque module est **pur TypeScript** (pas de Vue) : entrée entités domaine + options → `EChartsOption`.

## Index modules

| Fichier | Export principal | L4 | Test |
|---------|------------------|-----|------|
| `profile.ts` | `buildProfileOption`, Lorenz, PDF, zoom | profil-base, densites-lorenz | profileChart.spec.ts |
| `trapezoidApproximation.ts` | `buildMeanPreservingNodes`, `TrapezoidMethod` | trapezes | trapezoidApproximation.spec.ts |
| `trapezoidChart.ts` | `buildTrapezoidProfileOption` | trapezes | trapezoidChart.spec.ts |
| `populationPartition.ts` | `buildPartitionPoints`, modes custom | trapezes, série temps | populationPartition.spec.ts |
| `drilldown.ts` | `buildDrilldownPoints`, `DRILL_LEVELS` | drilldown | drilldown.spec.ts |
| `empiricalDistributionSmooth.ts` | PCHIP, CDF/PDF smooth | densites-lorenz | empiricalDistributionSmooth.spec.ts |
| `axisScale.ts` | `resolveProfileAxisScales`, dual zoom | echelles-et-zoom | axisScale.spec.ts |
| `symlogScale.ts` | symlog transform/format | echelles-et-zoom | symlogScale.spec.ts |
| `axisFormat.ts` | tick formatters | echelles-et-zoom | axisFormat.spec.ts |
| `chartZoom.ts` | `buildChartAxisDataZoom`, toolbox | echelles-et-zoom | chartZoom.spec.ts |
| `timeSeriesPartition.ts` | tranches, breakpoints | serie-temporelle | timeSeriesPartition.spec.ts |
| `timeSeries.ts` | `buildTimeSeriesOption`, stacked | serie-temporelle | timeSeries.spec.ts |
| `scatterProfiles.ts` | `buildProfileScatterOption` | profil-base | scatterProfiles.spec.ts |
| `profileHelp.ts` | textes aide | exploration | profileHelp.spec.ts |

## Wrapper UI

`app/components/charts/EChart.vue` — props `option`, `height` ; import tree-shaken echarts.

## Gabarit fiche module (à dupliquer)

Créer `L5-implementation/visualization/<nom>.md` pour chaque module :

```markdown
# L5 — visualization/<nom>.ts
## Exports publics
## Types entrée/sortie
## Algorithme (étapes)
## Dépendances autres modules
## Cas tests obligatoires
## Notes reconstruction
```

## Ordre implémentation

1. `axisFormat`, `axisScale`, `symlogScale`
2. `populationPartition`, `drilldown`
3. `profile` (+ tests)
4. `trapezoidApproximation`, `trapezoidChart`
5. `empiricalDistributionSmooth`
6. `chartZoom`
7. `timeSeriesPartition`, `timeSeries`
8. `scatterProfiles`, `profileHelp`

## À compléter

- [ ] 14 fiches détaillées (une par module)
- [ ] Liste imports ECharts (charts, components) par builder
- [ ] Constantes layout (`PROFILE_CHART_LAYOUT`, etc.)

## Notes reconstruction

Reproduire tests Vitest **avant** brancher composables Vue — ils définissent le contrat visuel.
