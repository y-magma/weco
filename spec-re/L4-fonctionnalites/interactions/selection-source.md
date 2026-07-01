# L4 — Sélection de source de données

## Contexte

- **L1** : [Sources utilisateur](../../L1-produit/sources-utilisateur.md)
- **L2** : [Extensibilité](../../L2-architecture/extensibilite.md)
- **L5** : `usePanneauDataSource.ts`, `PanneauDataSourceSection.vue`

## Statut

Implémenté (pilote L0→L5)

## Comportement

### Sélecteur

- Composant `PanneauDataSourceSection` dans filtres panneau.
- Liste dérivée de `listDataSources()` registry.
- Masquage si une seule source (`onlyOneSource`).

### Partage d’état

- Pages standalone temps/exploration : `usePanneauDataSourceProvider()` au mount.
- Composables enfants : `usePanneauDataSource()` lit `inject` ou fallback local.
- Grille mode per-panel : pas d’inject global ; `sourceId` sur `GridPanelModel`.

### Changement de source

- Reset indicateurs / variables par défaut (logique dans composables — **à documenter**).
- Re-fetch pays via `useCountriesProvider`.
- Capabilities : masque modes exploration si `percentileProfile` false.

### Sources désactivées

`disabledSourceIds` prop (grille) : filtre `oecd-idd` en exploration-only shared.

## Cas limites

| Situation | Comportement attendu |
|-----------|---------------------|
| WID sans clé API | Erreur chargement, statut `/sources` |
| OECD + exploration | Source absente du sélecteur ou erreur si forcée |
| Bundle décile + mauvais sub | Message explicite (OECD ratio requis) |

## Voir aussi (L5)

| Symbole / fichier | Rôle |
|-------------------|------|
| `usePanneauDataSourceProvider` | provide `sourceId` |
| `usePanneauDataSource` | inject + computed `selectedSource` |
| `EXPLORATION_DISABLED_SOURCE_IDS` | `['oecd-idd']` |
| `registry.ts` | Liste sources |
| `pages/sources.vue` | Page statut |

## Notes de reconstruction

1. Registry + port avant UI.
2. Provider/inject pattern identique pour toute page multi-composant.
3. Tester changement source avec capabilities différentes.
