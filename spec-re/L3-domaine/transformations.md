# L3 — Transformations & algorithmes métier

## Contexte

- **L4** : features utilisant ces transformations
- **L5** : `webapp/lib/domain/services/`, `webapp/app/visualization/`

## Domaine pur (`lib/domain/services/`)

| Module | Responsabilité |
|--------|----------------|
| `percentiles.ts` | Parse codes percentile, tri, grille g-pct |
| `joinProfiles.ts` | Jointure multi-profils → scatter |
| `widParamAvailability.ts` | Combos age/pop, résolution, hints ajustement |
| `paramMetadataStore.ts` | Cache client combos / années |

## Visualization (`app/visualization/`)

| Module | Responsabilité | L4 lié |
|--------|----------------|--------|
| `populationPartition.ts` | Découpage population all/step/custom | exploration, série temps |
| `trapezoidApproximation.ts` | Nœuds trapèze, moyennes par intervalle, méthodes | [trapezes](../L4-fonctionnalites/exploration/trapezes.md) |
| `trapezoidChart.ts` | Options ECharts trapèze + original | trapezes |
| `profile.ts` | Profil, Lorenz, PDF, bandes, zoom | [profil-base](../L4-fonctionnalites/exploration/profil-base.md), [densites-lorenz](../L4-fonctionnalites/exploration/densites-lorenz.md) |
| `drilldown.ts` | Niveaux drill g-percentiles | [drilldown](../L4-fonctionnalites/exploration/drilldown.md) |
| `empiricalDistributionSmooth.ts` | CDF empirique, spline PCHIP | densites-lorenz |
| `axisScale.ts` | Échelles lin/log/symlog, rank | [echelles-et-zoom](../L4-fonctionnalites/exploration/echelles-et-zoom.md) |
| `symlogScale.ts` | Transform symlog | echelles-et-zoom |
| `axisFormat.ts` | Format ticks axes | echelles-et-zoom |
| `chartZoom.ts` | Toolbox, dataZoom sliders | echelles-et-zoom |
| `timeSeriesPartition.ts` | Tranches série temps | [serie-temporelle](../L4-fonctionnalites/serie-temporelle/) |
| `timeSeries.ts` | Options ECharts séries | serie-temporelle |
| `scatterProfiles.ts` | Nuage multi-profils | exploration |
| `profileHelp.ts` | Textes aide calcul | exploration |

## Principes transverses

- **Pas d’interpolation silencieuse** sur `value: null`.
- **Conservation moyenne** (trapèzes) : méthodes documentées par `TrapezoidMethod`.
- **Monotonicité** CDF : spline PCHIP monotone.
- **Échelles** : choix dépend de `MeasureKind` (parts → fraction scale).

## À compléter

Pour chaque module L5 visualization : signature publique, entrées/sorties, complexité, références tests.

## Voir aussi

- [L5 — visualization/README](../L5-implementation/visualization/README.md)
- [L5 — tests](../L5-implementation/tests.md)
