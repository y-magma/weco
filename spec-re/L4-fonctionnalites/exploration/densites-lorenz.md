# L4 — Exploration : densités, Lorenz, lissage

## Contexte

- **L3** : [Transformations](../../L3-domaine/transformations.md)
- **L5** : `profile.ts`, `empiricalDistributionSmooth.ts`

## Statut

Implémenté — **À compléter**

## Comportement

### Lorenz

- `computeLorenzPoints` depuis profil average/threshold eligible.
- Courbe dans option profil ou couche dédiée.

### PDF / densité

- `computePdfBins`, `buildPdfBandItems` — histogramme / bandes.
- Modes smooth : `SmoothDistributionMode` = `empirical` | `smooth` | `both`.
- Spline : `buildMonotonePchipSpline`, `sampleSmoothPdfSeries`.

### Bandes population

- `buildRankBandItems`, `createRenderRankBand`, `createRenderPopulationBand`.

### Éligibilité

`supportsDistributionAnalytics(variable)` — false → masquer modes.

## À compléter

- [ ] Formules PDF discrète vs lissée
- [ ] Placement seuil lower-bound
- [ ] Opacité watermark bandes (`PROFILE_BAND_WATERMARK_OPACITY`)

## Voir aussi (L5)

Tests : `profileChart.spec.ts`, `empiricalDistributionSmooth.spec.ts`
