# Spécification reverse-engineering (`spec-re/`)

Spécification **multi-niveaux** du site web, produite à partir du code `webapp/`.
Objectif final : **reconstruire le site de zéro dans son intégralité** uniquement à partir de cette spec.

> Cette arborescence est indépendante de `spec/` (intention historique). Elle documente l’**état réel du code**.

---

## Niveaux de détail


| Niveau | Dossier                                      | Question                            | Statut rédaction             |
| ------ | -------------------------------------------- | ----------------------------------- | ---------------------------- |
| **L0** | `[L0-vision/](L0-vision/)`                   | Pourquoi ? Périmètre ?              | Squelette                    |
| **L1** | `[L1-produit/](L1-produit/)`                 | Que voit / fait l’utilisateur ?     | Squelette                    |
| **L2** | `[L2-architecture/](L2-architecture/)`       | Comment le système est découpé ?    | Squelette                    |
| **L3** | `[L3-domaine/](L3-domaine/)`                 | Quels objets et règles métier ?     | Squelette                    |
| **L4** | `[L4-fonctionnalites/](L4-fonctionnalites/)` | Comportement détaillé par feature ? | Squelette                    |
| **L5** | `[L5-implementation/](L5-implementation/)`   | Fichiers, fonctions, tests ?        | Squelette (+ pilote sources) |


**Règle de lecture** : un niveau ne duplique pas le détail du niveau inférieur — il y renvoie.

**Règle de rédaction** : produire **bottom-up** (L5 → L0). Chaque affirmation L4 doit être vérifiable en L5 (fichier + test).

---

## Index par thème

### Transverse


| Thème                      | L1                                 | L2                                                                                                                                | L3                               | L4  | L5                                                                                                             |
| -------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | --- | -------------------------------------------------------------------------------------------------------------- |
| Vision & périmètre         | —                                  | —                                                                                                                                 | —                                | —   | [L0 intention](L0-vision/intention.md)                                                                         |
| Stack, config, déploiement | [parcours](L1-produit/parcours.md) | [couches](L2-architecture/couches.md)                                                                                             | —                                | —   | [stack-et-config](L5-implementation/stack-et-config.md)                                                        |
| Architecture & flux        | —                                  | [couches](L2-architecture/couches.md), [flux](L2-architecture/flux-donnees.md), [extensibilité](L2-architecture/extensibilite.md) | [entités](L3-domaine/entites.md) | —   | [use-cases](L5-implementation/application/use-cases.md), [index-fichiers](L5-implementation/index-fichiers.md) |


### Données


| Thème               | L1                                                       | L3                                                                         | L5                                                                                                                                              |
| ------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Sources utilisateur | [sources-utilisateur](L1-produit/sources-utilisateur.md) | [entités](L3-domaine/entites.md), [bundles](L3-domaine/bundles-deciles.md) | [wid](L5-implementation/sources/wid.md), [oecd-idd](L5-implementation/sources/oecd-idd.md), [worldbank](L5-implementation/sources/worldbank.md) |
| Sémantique WID      | —                                                        | [semantique-wid](L3-domaine/semantique-wid.md)                             | [wid](L5-implementation/sources/wid.md)                                                                                                         |
| Transformations     | —                                                        | [transformations](L3-domaine/transformations.md)                           | [visualization/](L5-implementation/visualization/)                                                                                              |


### Interface


| Thème                    | L1                                 | L4                                                                                                                                                 | L5                                                                                       |
| ------------------------ | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Parcours & navigation    | [parcours](L1-produit/parcours.md) | [navigation-layout](L4-fonctionnalites/interactions/navigation-layout.md)                                                                          | [pages](L5-implementation/ui/pages.md), [composants](L5-implementation/ui/composants.md) |
| Panneaux                 | [panneaux](L1-produit/panneaux.md) | [exploration/](L4-fonctionnalites/exploration/), [serie-temporelle/](L4-fonctionnalites/serie-temporelle/), [grille](L4-fonctionnalites/grille.md) | [composables](L5-implementation/ui/composables.md)                                       |
| Interactions transverses | —                                  | [interactions/](L4-fonctionnalites/interactions/)                                                                                                  | [visualization/](L5-implementation/visualization/)                                       |
| CSV                      | —                                  | [csv-import](L4-fonctionnalites/csv-import.md)                                                                                                     | [stack-et-config](L5-implementation/stack-et-config.md)                                  |


---

## Pilote complet (exemple L0 → L5)

Le thème **« Sources de données pluggables »** sert de modèle pour les autres fiches :

1. [L0 — périmètre sources](L0-vision/intention.md#sources-de-données)
2. [L1 — ce que l’utilisateur choisit](L1-produit/sources-utilisateur.md)
3. [L2 — port `DataSourcePort](L2-architecture/extensibilite.md)`
4. [L3 — entités échangées](L3-domaine/entites.md)
5. [L4 — sélection de source dans les panneaux](L4-fonctionnalites/interactions/selection-source.md)
6. [L5 — adaptateurs WID / OECD / World Bank](L5-implementation/sources/)

Reproduire ce chaînage pour chaque feature avant de considérer la spec complète.

---

## Checklist « reconstruction from scratch »

Cocher chaque bloc lorsque la spec permet de le réimplémenter **sans lire le code existant**.

### Environnement & projet

- [ ] Stack exacte (Nuxt, Vue, Vuetify, ECharts, versions) — [L5/stack-et-config](L5-implementation/stack-et-config.md)
- [ ] Variables d’environnement et comportement sans clé API
- [ ] Alias TypeScript (`@application`, `@domain`, `@infrastructure`)
- [ ] Mode SPA, routes, redirections legacy, prerender
- [ ] Layout, navigation drawer, footer, composants globaux barre d’app

### Couches applicatives

- [ ] Entités domaine (`PercentileProfile`, `DataSeries`, …)
- [ ] Port `DataSourcePort` + capacités par source
- [ ] 5 use cases + container + plugin Nuxt
- [ ] Registry des sources + cache TTL

### Sources de données

- [ ] Adaptateur WID (client HTTP, parsing, erreurs, indicateurs)
- [ ] Adaptateur OECD IDD (séries, bundles déciles, limitations profil)
- [ ] Adaptateur World Bank (PIP déciles, WDI quintiles, WDI séries)
- [ ] Page `/sources` (statut live)

### Visualisations (ECharts)

- [ ] Wrapper `EChart.vue` + toolbox / dataZoom
- [ ] Profil : bar/scatter/line, Lorenz, PDF, bandes, zoom dual-axis
- [ ] Trapèzes : 4 méthodes, partition population, rendu superposé
- [ ] Drill-down g-percentiles
- [ ] Séries temporelles : simple, empilée, parts, multi-pays
- [ ] Échelles : lin, log strict, symlog, rank top-log
- [ ] Lissage empirique / PCHIP
- [ ] Scatter multi-profils
- [ ] Textes d’aide contextuels (`ProfileHelpButton`)

### Pages & panneaux

- [ ] `/` accueil
- [ ] `/panneau` hub
- [ ] `/panneau/exploration` + composable état complet
- [ ] `/panneau/temps` (un pays + comparaison multi-pays)
- [ ] `/grille` (source partagée / par panneau, tuile « + »)
- [ ] `/csv` import + preview
- [ ] `/spec` rendu Markdown (optionnel si spec-re remplace spec/)

### Qualité

- [ ] Suite de tests Vitest reproductible — [L5/tests](L5-implementation/tests.md)
- [ ] Déploiement statique GitHub Pages

---

## Gabarit de fiche (L4 / L5)

Copier en tête de chaque nouvelle fiche L4 :

```markdown
## Contexte
- **L1** : …
- **L2** : …
- **L3** : …

## Statut
Implémenté | Partiel | Bloqué | WIP

## Comportement
…

## Cas limites & messages
…

## Voir aussi (L5)
…
```

Copier en tête de chaque fiche L5 :

```markdown
## Contexte
- **L4** : …

## Fichiers
| Rôle | Chemin |
|------|--------|

## API publique
| Symbole | Signature / rôle |

## Tests
| Fichier test | Cas couverts |

## Notes de reconstruction
Ordre d’implémentation recommandé, dépendances, pièges.
```

---

## Ordre de rédaction recommandé

1. [L5/stack-et-config](L5-implementation/stack-et-config.md) + [L5/sources/](L5-implementation/sources/)
2. [L3/domaine](L3-domaine/)
3. [L5/visualization/](L5-implementation/visualization/) (module par module)
4. [L4/exploration](L4-fonctionnalites/exploration/) puis [L4/serie-temporelle](L4-fonctionnalites/serie-temporelle/)
5. [L4/grille](L4-fonctionnalites/grille.md) + [L5/ui](L5-implementation/ui/)
6. [L1-produit](L1-produit/) puis [L0-vision](L0-vision/intention.md) (synthèse finale)

