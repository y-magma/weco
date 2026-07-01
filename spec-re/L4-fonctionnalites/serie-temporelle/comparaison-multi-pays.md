# L4 — Série temporelle : comparaison multi-pays

## Contexte

- **L1** : [Comparaison multi-pays](../../L1-produit/panneaux.md#comparaison-multi-pays-temps-compare)
- **L5** : `useTimeSeriesComparePanel.ts`, `PanneauSerieTemporelleCompare.vue`

## Statut

Implémenté — **À compléter**

## Comportement

- Plusieurs pays sélectionnés, **une tranche** commune.
- `CountryTrancheSeries[]` → série par pays.
- Options population compare : `TIME_SERIES_COMPARE_POPULATION_OPTIONS` + custom sentinel.

## À compléter

- [ ] Limite nombre pays UI
- [ ] Légende / couleurs par pays
- [ ] Alignement années (intersection)

## Voir aussi (L5)

| Fichier | Rôle |
|---------|------|
| `useTimeSeriesComparePanel.ts` | État |
| `timeSeries.ts` | `buildTimeSeriesOption` multi-série |

## Notes de reconstruction

Réutiliser `createTimeSeriesPanelState` patterns ; extraire chargement parallèle pays.
