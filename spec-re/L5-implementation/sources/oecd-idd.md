# L5 — Adaptateur OECD IDD

## Contexte

- **L1** : [Sources — OECD](../../L1-produit/sources-utilisateur.md#oecd-idd)
- **L3** : [Bundles — OECD ratios](../../L3-domaine/bundles-deciles.md)

## Fichiers

| Rôle | Chemin |
|------|--------|
| Source | `lib/infrastructure/data-sources/oecd-idd/oecdIddSource.ts` |
| Client | `lib/infrastructure/data-sources/oecd-idd/oecdIddClient.ts` |
| Catalogue | `lib/infrastructure/data-sources/oecd-idd/oecdIddCatalog.ts` |
| Déciles | `lib/infrastructure/data-sources/oecd-idd/oecdDeciles.ts` |
| Pays | `lib/infrastructure/data-sources/oecd-idd/oecdIddCountries.ts` |

## Identité

- `id`: `oecd-idd`
- `capabilities`: `{ percentileProfile: false, decileProfile: true, timeSeries: true, scatter: false }`

## Limitations

- `fetchPercentileProfile` → **throw** explicite.
- `listAvailableParams` → combos vides (pas age/pop WID).
- Pays : liste statique `listOecdCountries()`.

## Bundle décile

- Variable parent `INC_DISP_DECILE_RATIOS` (`OECD_DECILE_BUNDLE_ID`).
- Sous-ID ratio via param `percentile` : P90/P10, P50/P10, P90/P50.
- Erreur si bundle sans ratio sélectionné.

## Séries temporelles

- `fetchOecdTimeSeries` via client.
- Indicateurs : `OECD_IDD_INDICATORS`, `findOecdIndicator`.

## Tests

`oecdIddClient.spec.ts`

## À compléter

- [ ] URL API OECD exacte
- [ ] Format réponse JSON → `DataSeries`
- [ ] Liste complète indicateurs catalogue

## Notes de reconstruction

Brancher après WID. UI doit respecter `EXPLORATION_DISABLED_SOURCE_IDS` pour profil.
