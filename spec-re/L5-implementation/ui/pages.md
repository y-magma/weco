# L5 — Pages Nuxt

## Contexte

- **L1** : [Parcours](../../L1-produit/parcours.md)
- **L4** : features par page

## Template commun

```vue
<script setup lang="ts">
definePageMeta({ layout: 'default' })
</script>
```

## Détail par page

| Page | Fichier | Composants / composables clés | À documenter |
|------|---------|------------------------------|--------------|
| Accueil | `index.vue` | features cards, liens CTA | textes, structure v-row |
| Hub panneau | `panneau/index.vue` | `EXPLORER_PANNEAU_TYPES` | cartes types |
| Temps | `panneau/temps.vue` | provider source, `PanneauSerieTemporelle`, compare | tabs modes |
| Exploration | `panneau/exploration.vue` | `PanneauExploration` | — |
| Grille | `grille.vue` | panels state, `PanneauGridCell*` | sourceMode |
| Sources | `sources.vue` | `useDataSources`, `getStatus()` | chips statut |
| CSV | `csv.vue` | `CsvUploadCard`, `EChart` | — |
| Spec | `spec.vue` | `useSpec`, markdown | optionnel si spec-re |

## Prerender (statique)

Routes dans `nuxt.config.ts` `nitro.prerender.routes` — toutes les pages ci-dessus sauf redirects.

## À compléter

- [ ] Contenu exact `panneau/index.vue`, `panneau/temps.vue` (structure tabs)
- [ ] Query params / hash par page
- [ ] SEO meta par route

## Notes de reconstruction

Créer pages stub avec layout + titre avant composants panneau.
