# C2b — Traceurs projet

*Fonctions et composants qui produisent les `EChartsOption` à partir des données [B3 unified](../../B-clean-data/B3-clean-vers-unified.md). Modules ECharts : [C2a](./bibliotheques.md).*

---

## Fonctions `build*Option`

| Graphique (C1) | Fonction | Fichier | Statut |
|----------------|----------|---------|--------|
| Courbe | `buildTimeSeriesOption` | `webapp/src/charts/timeSeries.ts` | **Existant** |
| Diagramme en bâtons | `buildDistributionOption` | `webapp/src/charts/distribution.ts` | **Existant** |
| Nuage de points | `buildScatterOption` | `webapp/src/charts/scatter.ts` | **Existant** |
| Histogramme | `buildHistogramOption` | `webapp/src/charts/` | Phase 2 |
| Courbe cumulative | `buildCumulativeOption` | `webapp/src/charts/` | Phase 2 |
| Carte de chaleur | `buildHeatmapOption` | `webapp/src/charts/` | Phase 2 |
| Régression linéaire | `buildRegressionOverlay` | `webapp/src/charts/` | Phase 2 |
| Densité loi connue | `buildDensityOverlay` | `webapp/src/charts/` | Phase 2 |

---

## Composants et pages

| Rôle | Fichier |
|------|---------|
| Wrapper chart | `webapp/app/components/charts/EChart.vue` |
| Orchestration dashboard | `webapp/app/composables/useDashboard.ts` |
| Vues | `webapp/app/pages/dashboard.vue`, `csv.vue` |

---

## Chaîne

```text
unified (B3) → build*Option() → EChartsOption → <EChart /> → canvas
```

Entrées des builders : types domaine (`DataSeries`, `DistributionSeries`, `ScatterPoint`…) alignés sur B1 — pas le brut A2.

---

[C2a](./bibliotheques.md) · [C1](../C1-graphiques-et-echelles.md) · [C3](../C3-interactions.md)
