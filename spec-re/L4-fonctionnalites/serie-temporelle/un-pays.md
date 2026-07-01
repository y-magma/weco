# L4 — Série temporelle : un pays

## Contexte

- **L1** : [Panneau temps](../../L1-produit/panneaux.md#série-temporelle-temps)
- **L5** : `useTimeSeriesPanel.ts`, `PanneauSerieTemporelle.vue`

## Statut

Implémenté — **À compléter**

## Comportement

### Paramètres

- Source, pays, variable (ou bundle), age/pop/year range (WID).
- Mode population : `TimeSeriesPopulationMode` — distribution, whole, step10, step25, custom.
- Breakpoints défaut distribution : `[50, 90, 99, 99.9, 100]`.

### Chargement

- Une requête `LoadTimeSeriesUseCase` par tranche / sous-indicateur bundle.
- Agrégation `buildTimeSeriesTranches`.

### Graphiques

- Ligne simple : `buildTimeSeriesOption`.
- Empilé : `buildStackedTimeSeriesOption`.
- Parts : `buildStackedShareTimeSeriesOption` (shares).

### Contraintes WID

`useWidParamConstraints` — même logique que exploration.

## À compléter

- [ ] Defaults par source au mount
- [ ] Couleurs tranches `TIME_SERIES_TRANCHE_COLORS`
- [ ] Labels tranches par mode

## Voir aussi (L5)

Tests : `timeSeries.spec.ts`, `timeSeriesPartition.spec.ts`
