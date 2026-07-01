# L3 — Bundles déciles & quintiles

## Contexte

- **L1** : [Sources utilisateur](../L1-produit/sources-utilisateur.md)
- **L5** : `webapp/lib/domain/catalog/decileBundles.ts`, adaptateurs sources

## Problème adressé

OECD et World Bank ne fournissent pas 127 g-percentiles. L’UI réutilise le **même panneau exploration** via des **bundles** : une variable « parent » déclenche le choix d’un sous-indicateur (ratio, part décile, quintile).

## Bundles définis

| ID bundle | Source | Sous-éléments | Usage exploration | Usage série temps |
|-----------|--------|---------------|-------------------|-------------------|
| `PIP_DECILE_SHARES` | World Bank PIP | 10 parts décile | Profil 10 points | Séries par décile |
| `INC_DISP_DECILE_RATIOS` | OECD IDD | P90/P10, P50/P10, P90/P50 | — (OECD exclu exploration) | Ratio sélectionné via `percentile` |
| `WDI_QUINTILE_BUNDLE` | World Bank WDI | 5 parts quintile | Profil 5 points | Séries quintile |

## Helpers domaine

| Fonction | Rôle |
|----------|------|
| `isPipDecileBundleVariable` | Detect bundle PIP |
| `isOecdDecileBundleVariable` | Detect bundle OECD |
| `isWdiQuintileBundleVariable` | Detect bundle WDI |
| `isWorldBankExplorationProfileBundle` | Profil agrégé WB en exploration |
| `getDecileBundleConfig` | Options UI pour sous-sélection |
| `decileBundleSubIdsForLoad` | IDs à charger pour série temps |
| `labelForDecileBundleSub` | Libellé affiché |

## Textes d’aide

- `PIP_DECILE_PROFILE_HELP`
- `OECD_DECILE_PROFILE_HELP`
- `WDI_QUINTILE_PROFILE_HELP`

Affichés via `ProfileHelpButton` / composants panneau.

## Mid-ranks profil agrégé

PIP et WDI mappent chaque décile/quintile à un **rang médian** pour placement sur axe population (≠ vraie distribution fine).

→ L5 : `worldBankDeciles.ts`, `worldBankQuintiles.ts`, `oecdDeciles.ts`

## À compléter

- [ ] Table ID sous-indicateur → code API externe
- [ ] Règles agrégation `aggregatePointValue` pour bundles
- [ ] Années disponibles profil PIP vs WDI

## Voir aussi

- [Entités](entites.md)
- [L4 — exploration profil-base](../L4-fonctionnalites/exploration/profil-base.md)
