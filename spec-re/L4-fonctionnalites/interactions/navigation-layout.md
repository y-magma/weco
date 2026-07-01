# L4 — Navigation & layout

## Contexte

- **L1** : [Parcours](../../L1-produit/parcours.md)
- **L5** : `layouts/default.vue`, composants barre d’app

## Statut

Implémenté — **À compléter**

## Comportement

- Layout Vuetify `v-app` : drawer, bar, main container fluid, footer.
- Drawer toggle toutes tailles d’écran.
- `ShareUrlButton` — copie URL.
- `DataSourceLinksMenu` — liens WID, OECD, World Bank.
- Styles : `assets/main.scss`, `page-container`.

## À compléter

- [ ] Thème Vuetify (couleurs, dark mode si absent)
- [ ] Comportement `ShareUrlButton` (query params ?)
- [ ] Meta head par page

## Voir aussi (L5)

| Fichier | Rôle |
|---------|------|
| `layouts/default.vue` | Shell |
| `components/ShareUrlButton.vue` | Partage |
| `components/DataSourceLinksMenu.vue` | Liens externes |
| `plugins/vuetify.client.ts` | Config Vuetify |
| `nuxt.config.ts` | title, description, baseURL |

## Notes de reconstruction

Reproduire layout avant pages métier. Vérifier `baseURL` GitHub Pages via `NUXT_APP_BASE_URL`.
