# L1 — Sources de données (vue utilisateur)

## Contexte

- **L0** : [Vision — sources](../L0-vision/intention.md#sources-de-données)
- **L3** : [Entités](../L3-domaine/entites.md), [Bundles déciles](../L3-domaine/bundles-deciles.md)
- **L4** : [Sélection de source](../L4-fonctionnalites/interactions/selection-source.md)
- **L5** : [Adaptateurs](../L5-implementation/sources/)

## Vue d’ensemble

L’utilisateur choisit une **source** dans les panneaux (sélecteur commun ou par cellule en grille). Chaque source expose un catalogue d’**indicateurs** et des **capacités** différentes.

| Source | Libellé UI | Site | Profil fin (centile) | Profil décile/quintile | Série temporelle |
|--------|------------|------|----------------------|------------------------|------------------|
| `wid` | WID.world | wid.world | Oui (127 g-pct) | — | Oui |
| `oecd-idd` | OECD IDD | oecd.org | Non | Ratios déciles (bundle) | Oui |
| `worldbank` | World Bank | pip.worldbank.org | Non | PIP déciles, WDI quintiles | Oui |

## WID.world (défaut)

- Variable sixlet (ex. patrimoine net `ahweal`), paramètres `age`, `pop`, `year`.
- Profil complet 127 g-percentiles ; Gini = scalaire unique.
- Séries temporelles par tranche de population ou percentile.
- Nécessite clé API (`NUXT_PUBLIC_WID_API_KEY`) — sinon message d’erreur explicite.

## OECD IDD

- Indicateurs : Gini, ratios inter-déciles (P90/P10…), pauvreté, niveaux de revenu.
- Bundle `INC_DISP_DECILE_RATIOS` : choix du ratio dans l’UI série temporelle.
- **Non disponible** pour le panneau exploration (profil centile absent).
- Liste de pays statique (OCDE+).

## World Bank

- **PIP** : parts de revenu/consommation par décile (profil exploration agrégé 10 points).
- **WDI** : parts par quintile, Gini, indicateurs macro.
- Séries temporelles WDI + PIP ; profils décile/quintile pour exploration.
- Pays via API World Bank (ISO).

## Restrictions visibles en UI

- Grille en **source unique** avec uniquement des panneaux **exploration** : OECD masqué (`EXPLORATION_DISABLED_SOURCE_IDS`).
- World Bank : sous-ensemble d’indicateurs sur le premier panneau temps (panel index 0).

## Page `/sources`

Carte par source : ID, description, site, statut enabled/disabled, dernière requête, dernière erreur, indicateur clé API WID.

## À compléter

- [ ] Liste complète des groupes d’indicateurs affichés dans les v-select
- [ ] Textes d’aide (`*_PROFILE_HELP`) affichés à l’utilisateur
- [ ] Comportement quand une source échoue mid-session

## Voir aussi

- [L5 — WID](../L5-implementation/sources/wid.md)
- [L5 — OECD IDD](../L5-implementation/sources/oecd-idd.md)
- [L5 — World Bank](../L5-implementation/sources/worldbank.md)
