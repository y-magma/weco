# L4 — Exploration : drill-down g-percentiles

## Contexte

- **L3** : [Sémantique WID — percentiles](../../L3-domaine/semantique-wid.md)
- **L5** : `drilldown.ts`, `profileHelp.ts`

## Statut

Implémenté — **À compléter**

## Comportement

- Niveaux `DRILL_LEVELS` (0 = vue complète → zooms successifs).
- `buildDrilldownPoints(profile, level)` filtre/agrège points.
- Clic graphique : `nextDrillLevel`, `drillableCode`.
- Labels : `drillLevelLabel`, aide `buildDrillDownHelp`.

## Cas limites

- Niveau max `MAX_DRILL_LEVEL`.
- Variables non drillables (Gini, bundles WB).

## À compléter

- [ ] Table niveau → agrégation exacte
- [ ] Interaction ECharts (event handlers dans composable)
- [ ] Bouton remontée niveau

## Voir aussi (L5)

Test : `drilldown.spec.ts`
