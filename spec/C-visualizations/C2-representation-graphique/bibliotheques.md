# C2a — Bibliothèques

*Stack et modules ECharts pour les graphiques de [C1](../C1-graphiques-et-echelles.md).*

**Stack retenue :** Nuxt + Vue 3 · **ECharts 6** · **vue-echarts** · paquets `webapp/package.json`.

---

## Graphique (C1) → module ECharts

| Graphique | Module à enregistrer | `series.type` | Composants utiles |
|-----------|---------------------|---------------|-------------------|
| Courbe | `LineChart` | `line` | `Tooltip`, `Legend`, `DataZoom`, `Toolbox` |
| Diagramme en bâtons | `BarChart` | `bar` | `Tooltip`, `Grid` |
| Histogramme | `BarChart` | `bar` (bins en amont) | idem bâtons |
| Nuage de points | `ScatterChart` | `scatter` | `Tooltip`, `Grid` |
| Courbe cumulative | `LineChart` | `line` (cumul) | idem courbe |
| Carte de chaleur | `HeatmapChart` | `heatmap` | `VisualMap`, `Grid` |
| Régression linéaire | `LineChart` ou `markLine` | `line` / annotation | calcul [D2](../../D-statistics/D2-programmes-statistiques.md) |
| Densité loi connue | `LineChart` (superposition) | `line` | deux séries sur même axes |

Enregistrement minimal actuel dans `EChart.vue` : `LineChart`, `BarChart`, `ScatterChart`. Phase 2 : ajouter `HeatmapChart`, `VisualMapComponent`.

---

## Rendu

| Couche | Rôle |
|--------|------|
| `echarts/core` + `CanvasRenderer` | Moteur canvas |
| `vue-echarts` (`VChart`) | Binding Vue |
| `EChartsOption` | Configuration déclarative passée au composant |

---

[C2b](./implementation.md) · [C1](../C1-graphiques-et-echelles.md) · [C3](../C3-interactions.md)
