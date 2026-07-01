# L4 — Exploration : échelles & zoom

## Contexte

- **L5** : `axisScale.ts`, `symlogScale.ts`, `chartZoom.ts`, `axisFormat.ts`

## Statut

Implémenté — **À compléter**

## Comportement

### Échelles valeur

| Scale | Usage |
|-------|-------|
| Linéaire | Valeurs niveau, seuils grands |
| Log strict | Parts, queues distribution |
| Symlog | Valeurs signées / proche zéro |

Résolution : `resolveProfileValueScale`, `resolveProfileAxisScales`.

### Échelles rang

- Linéaire, log strict, **rank top-log** (`logRichScale` — échelle queue population, pas un zoom navigation).

### Zoom UI

- `buildProfileDataZoom` — sliders axe valeur + rang.
- `buildChartToolbox` — export image, restore.
- `CHART_ZOOM_GRID_BOTTOM` — layout constant.

### Format ticks

- `formatAxisValue`, `formatRankAxisLabel`, `formatSymlogTick`, `formatFractionAxisValue`.

## À compléter

- [ ] Toggles UI exacts (log valeur, log rang, symlog)
- [ ] Comportement dual-axis zoom combiné
- [ ] Mesure kind × échelle par défaut

## Voir aussi (L5)

Tests : `axisScale.spec.ts`, `symlogScale.spec.ts`, `chartZoom.spec.ts`, `axisFormat.spec.ts`
