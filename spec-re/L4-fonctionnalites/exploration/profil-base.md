# L4 — Exploration : profil de base

## Contexte

- **L1** : [Panneau exploration](../../L1-produit/panneaux.md#profil-dinégalité-exploration)
- **L3** : [Entités](../../L3-domaine/entites.md), [Sémantique WID](../../L3-domaine/semantique-wid.md)
- **L5** : `useExplorationPanel.ts`, `profile.ts`, `PanneauExploration.vue`

## Statut

Implémenté — **À compléter** (liste exhaustive contrôles UI)

## Comportement

### Chargement

- Paramètres : source, pays, variable, année, age, pop (WID) ou bundle WB.
- `LoadProfileUseCase` → `PercentileProfile`.
- Indicateur complétude : `expectedProfilePointCount(variable)`.

### Représentations (`ProfileChartLayer`)

Combinaisons : courbe (`line`), nuage (`scatter`), bâtons (`bar`) — résolu par `resolveProfileChartType`.

### Couches affichables

Options `TRAPEZOID_ORIGINAL_VIEW_OPTIONS` et modes trapèze (voir [trapezes](trapezes.md)).

### Filtres valeur / rang

- Zoom plage valeurs (`ValueRangeZoom`).
- Zoom intervalle rangs (`applyRankExtentZoom`, `applyDualAxisZoom`).

## Cas limites

- Profil incomplet (points manquants) — affichage trous.
- Variable Gini — un point, pas de drill PDF.
- World Bank bundle — 5 ou 10 points seulement.

## À compléter

- [ ] Table de tous les v-select / toggles avec default
- [ ] Matrice variable kind × modes analytics disponibles
- [ ] Overlay scatter-bar / line-bar

## Voir aussi (L5)

| Module | Symboles clés |
|--------|---------------|
| `profile.ts` | `buildProfileOption`, `computeLorenzPoints`, `computePdfBins` |
| `useExplorationPanel.ts` | état réactif principal |
| `PanneauExploration.vue` | template filtres + chart |

## Notes de reconstruction

Implémenter `buildProfileOption` + tests `profileChart.spec.ts` avant composable Vue.
