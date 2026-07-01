# L1 — Parcours utilisateur & navigation

## Contexte

- **L0** : [Vision](../L0-vision/intention.md)
- **L5** : [Pages](../L5-implementation/ui/pages.md), [Layout](../L5-implementation/ui/composants.md#layout)

## Carte des routes

| Route | Titre UI | Rôle | Statut |
|-------|----------|------|--------|
| `/` | Accueil | Présentation, liens vers explorateur et spec | Implémenté |
| `/panneau` | Exploration des données | Hub — choix du type de panneau | Implémenté |
| `/panneau/temps` | Série temporelle | Un pays ou comparaison multi-pays | Implémenté |
| `/panneau/exploration` | Profil d'inégalité | Profil + trapèzes + analytics | Implémenté |
| `/grille` | Grille de visualisations | Multi-panneaux parallèles | Implémenté |
| `/sources` | Data Sources | Statut des adaptateurs | Implémenté |
| `/csv` | CSV Import | Upload local → graphique | Implémenté |
| `/spec` | Spécifications | Rendu Markdown spec historique | Implémenté |

### Redirections legacy (compatibilité URLs)

| Ancienne route | Cible |
|----------------|-------|
| `/profil` | `/panneau/exploration` |
| `/panneau/trapeze` | `/panneau/exploration` |
| `/panneau-visualisation` | `/panneau` |
| `/nuage` | `/panneau` |
| `/grille-visus`, `/grille-visualisations` | `/grille` |

→ Détail L5 : `webapp/nuxt.config.ts` (`routeRules`, `nitro.prerender.routes`).

## Navigation (layout default)

Drawer permanent (toggle barre d’app) :

**Navigation principale**

| Libellé | Route | Icône |
|---------|-------|-------|
| Home | `/` | mdi-home |
| Exploration des données | `/panneau` | mdi-chart-bar |
| Grille de visualisations | `/grille` | mdi-view-grid-plus |

**Documentation** (groupe repliable)

| Libellé | Route |
|---------|-------|
| Spécifications | `/spec` |
| Data Sources | `/sources` |
| CSV Import | `/csv` |

**Barre d’application (append)**

- `ShareUrlButton` — copie URL courante.
- `DataSourceLinksMenu` — liens externes vers sites des sources.

**Footer** : « Visualisation des données WID.world — panneaux et grilles de graphiques ».

## Parcours type 1 — Explorer un profil WID

1. Accueil → « Ouvrir l’explorateur » → `/panneau`
2. Choisir « Profil d'inégalité et approximations » → `/panneau/exploration`
3. Sélectionner source WID, pays, variable, année, age, pop
4. Ajuster vue (courbe / trapèzes / densités / Lorenz), échelles, zoom

→ L4 : [exploration/](../L4-fonctionnalites/exploration/)

## Parcours type 2 — Série temporelle

1. `/panneau` → « Série temporelle » → `/panneau/temps`
2. Pays + indicateur + tranches population
3. Option comparaison multi-pays (même tranche)

→ L4 : [serie-temporelle/](../L4-fonctionnalites/serie-temporelle/)

## Parcours type 3 — Grille multi-panneaux

1. `/grille`
2. Mode source unique ou source par graphique
3. Ajouter panneaux via tuile « + »
4. Filtrer / configurer chaque cellule indépendamment

→ L4 : [grille](../L4-fonctionnalites/grille.md)

## Parcours type 4 — CSV local

1. `/csv`
2. Upload fichier, mapping colonnes
3. Aperçu graphique série temporelle

→ L4 : [csv-import](../L4-fonctionnalites/csv-import.md)

## À compléter

- [ ] Paramètres URL / état partageable (query params) — documenter depuis composables
- [ ] Comportement mobile (drawer, grilles responsives)
- [ ] Messages d’erreur globaux vs par panneau

## Voir aussi

- [Panneaux](panneaux.md)
- [Sources utilisateur](sources-utilisateur.md)
- [Navigation & layout (L4)](../L4-fonctionnalites/interactions/navigation-layout.md)
