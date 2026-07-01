# L4 — Grille de visualisations

## Contexte

- **L1** : [Panneaux](../L1-produit/panneaux.md), [Parcours](../L1-produit/parcours.md)
- **L5** : `webapp/app/pages/grille.vue`, `PanneauGridCell*.vue`

## Statut

Implémenté (évolution cellules scoped en cours)

## Comportement

### Composition

- Liste dynamique `GridPanelModel[]` : `{ id, type, sourceId? }`.
- Types autorisés : `temps`, `temps-compare`, `exploration`.
- Tuile « + » (`PanneauAddTile`) : dialogue choix type → `addPanel(type)`.
- Suppression par panneau.

### Mode source

| Mode | Comportement |
|------|--------------|
| `shared` | Un `sourceId` global (`usePanneauDataSourceProvider`) |
| `per-panel` | Chaque cellule a son `sourceId` ; changement mode copie source courante |

Toggle : boutons « Source unique » / « Source par graphique ».

### Restrictions source

Si mode **shared** + au moins un panneau **exploration** + aucun panneau temps :
→ OECD (`oecd-idd`) **désactivé** dans le sélecteur (`EXPLORATION_DISABLED_SOURCE_IDS`).

### Prefetch pays

- Mode shared : `useCountriesProvider({ enabled: shared })`.
- Mode per-panel : prefetch par cellule scoped.

### Rendu cellule

- `PanneauGridCell` — source partagée.
- `PanneauGridCellScoped` — source propre + provider countries local.

## Cas limites

- [ ] Documenter comportement grille vide
- [ ] Ordre panneaux / persistance (non persisté aujourd’hui)
- [ ] Responsive colonnes Vuetify

## Voir aussi (L5)

| Fichier | Rôle |
|---------|------|
| `grille.vue` | Page, état panels, sourceMode |
| `panneauTypes.ts` | Types autorisés |
| `usePanneauDataSource.ts` | Provider / inject |
| `PanneauGridCell.vue` | Cellule |
| `PanneauGridCellScoped.vue` | Cellule source isolée |

## Notes de reconstruction

1. Implémenter d’abord panneaux standalone (temps, exploration).
2. Extraire composables avec `panelIndex` option.
3. Ajouter grille comme conteneur injectant `sourceId` ou scoped wrapper.
