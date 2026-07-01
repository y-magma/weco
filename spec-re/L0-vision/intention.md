# L0 — Vision & périmètre

> Niveau le plus abstrait. Rédiger **en dernier**, une fois L1–L5 stabilisés.

## Mission

Boîte à outils web pour **explorer visuellement les distributions d’inégalités économiques** en s'appuyant sur plusieurs bases de données d'inégalités.

## Principes directeurs


| Principe                | Implication                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| Données live            | Pas de jeu de données synthétique de repli ; erreurs explicites si clé API absente ou requête vide |
| Distribution fine (WID) | Profils sur 127 g-percentiles ; analytics CDF/PDF/Lorenz sur variables moyenne/seuil               |
| Sources pluggables      | Contrat unique `DataSourcePort` ; capacités déclarées par source                                   |
| Séparation UI / logique | Composables minces → use cases → port ; mappers ECharts testables sans navigateur                  |
| SPA statique            | Nuxt en `ssr: false`, déployable en site statique (GitHub Pages)                                   |


## Périmètre fonctionnel (in)

- Accueil et navigation responsive (Vuetify).
- Hub panneaux : série temporelle, profil d’inégalité & approximations.
- Grille composable de panneaux hétérogènes.
- Sélection de source de données.
- Import CSV utilisateur → série temporelle.
- Page statut des sources (`/sources`).
- Partage d’URL (barre d’application).
- Suite de tests unitaires Vitest sur domaine, infra, visualisation.

## Hors périmètre (out)

- Backend applicatif dédié (tout passe par APIs externes ou CSV local).
- Authentification utilisateur.
- Persistance serveur des grilles / favoris.
- Profil centile complet OECD IDD (non implémenté — séries et ratios déciles seulement).
- Source OECD WDD (fichier stub présent, non branché).

## Sources de données

Voir détail L1 : [sources utilisateur](../L1-produit/sources-utilisateur.md).

Résumé :

- **WID.world** — source principale ; profils centile, séries, scatter.
- **OECD IDD** — Gini, ratios déciles, pauvreté ; séries temporelles.
- **World Bank** — PIP (parts décile), WDI (quintiles, Gini) ; profils décile/quintile agrégés.

## Critère de complétude spec

La spec est **suffisante pour une reconstruction** lorsque la [checklist README](../README.md#checklist-reconstruction-from-scratch) est entièrement cochée avec références L5 pour chaque item.

## Voir aussi

- [L1 — Parcours](../L1-produit/parcours.md)
- [L2 — Architecture](../L2-architecture/couches.md)
- [L5 — Stack](../L5-implementation/stack-et-config.md)

