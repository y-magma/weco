# L5 — Composants Vue

## Contexte

- **L4** : UI features
- **Index** : [index-fichiers](../index-fichiers.md#appcomponents)

## Layout {#layout}

`layouts/default.vue` — voir [navigation L4](../../L4-fonctionnalites/interactions/navigation-layout.md).

## Charts

### `EChart.vue`

- Wrapper `vue-echarts`.
- Props : `option: EChartsOption | null`, `height: string`.
- Gère resize, option nullable.

### `ProfileHelpButton.vue`

- Dialog aide ; consomme `profileHelp.ts` via contexte exploration.

## Panneau — structure filtres

```
PanneauFiltersShell (repliable)
├── PanneauDataSourceSection
├── … contrôles spécifiques (pays, variable, …)
├── ParamAdjustmentHint / WidParamAdjustmentToast
└── PanneauExplorationExtendedParams (exploration)
```

## Panneau — corps

| Composant | Props / events clés |
|-----------|---------------------|
| `PanneauExploration.vue` | branche `useExplorationPanel` |
| `PanneauSerieTemporelle.vue` | `useTimeSeriesPanel` |
| `PanneauSerieTemporelleCompare.vue` | compare composable |
| `PanneauGridCell.vue` | `panel: GridPanelModel` |
| `PanneauGridCellScoped.vue` | + provider local source/countries |
| `PanneauAddTile.vue` | `@add="type"` |
| `PanneauBackLink.vue` | lien `/panneau` |

## CSV

`CsvUploadCard.vue` — emit `@series-built` avec `EChartsOption`.

## Global bar

| Composant | Rôle |
|-----------|------|
| `ShareUrlButton.vue` | Copie clipboard URL |
| `DataSourceLinksMenu.vue` | Menu liens externes |

## À compléter

- [ ] Props/events exhaustifs par composant
- [ ] Slots et v-model
- [ ] Classes CSS / Vuetify density

## Notes de reconstruction

1. `EChart.vue` + fixture option minimale.
2. `PanneauFiltersShell` + un select pays mock.
3. Assembler panneau complet.

Composants sans logique métier lourde — garder calculs dans composables/visualization.
