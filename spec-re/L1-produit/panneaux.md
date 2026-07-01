# L1 — Types de panneau

## Contexte

- **L0** : [Vision](../L0-vision/intention.md)
- **L4** : [exploration/](../L4-fonctionnalites/exploration/), [serie-temporelle/](../L4-fonctionnalites/serie-temporelle/), [grille](../L4-fonctionnalites/grille.md)
- **L5** : [panneauTypes.ts](../L5-implementation/ui/composables.md#panneautypes)

## Catalogue

Trois types logiques (`PanneauType`), deux visibles dans le hub `/panneau` :


| ID              | Titre                                | Sous-titre                   | Route hub              | Grille | Hub explorateur                |
| --------------- | ------------------------------------ | ---------------------------- | ---------------------- | ------ | ------------------------------ |
| `temps`         | Série temporelle                     | Un pays, plusieurs tranches  | `/panneau/temps`       | Oui    | Oui                            |
| `temps-compare` | Comparaison multi-pays               | Une tranche, plusieurs pays  | `/panneau/temps`       | Oui    | Non (grille / temps seulement) |
| `exploration`   | Profil d'inégalité et approximations | Du plus modeste au plus aisé | `/panneau/exploration` | Oui    | Oui                            |


## Série temporelle (`temps`)

**Intentions utilisateur**

- Suivre un indicateur année après année pour **un pays**.
- Partitionner la population en tranches (distribution standard, pas 10/25, personnalisé).
- Visualiser valeurs absolues ou parts empilées selon type de mesure.

**Sources compatibles** : WID (profil centile requis pour certaines tranches), OECD IDD, World Bank (indicateurs + bundles déciles/quintiles).

→ L4 : [serie-temporelle/un-pays](../L4-fonctionnalites/serie-temporelle/un-pays.md)

## Comparaison multi-pays (`temps-compare`)

**Intentions utilisateur**

- Comparer la **même tranche** entre plusieurs pays sur une période.
- Même familles d’indicateurs que la série simple.

→ L4 : [serie-temporelle/comparaison-multi-pays](../L4-fonctionnalites/serie-temporelle/comparaison-multi-pays.md)

## Profil d'inégalité (`exploration`)

**Intentions utilisateur**

- Voir la distribution d’une variable sur les rangs de population.
- Changer de représentation : courbe, nuage, bâtons.
- Drill-down sur les g-percentiles.
- Approximer par trapèzes / rectangles (plusieurs méthodes).
- Analytics : densité population, PDF, Lorenz, lissage empirique.
- Échelles linéaire / logarithmique / symlog ; zoom sur axes valeur et rang.

**Sources compatibles** : WID (complet), World Bank (profils décile/quintile agrégés). **OECD IDD exclu** (pas de profil centile).

→ L4 : [exploration/](../L4-fonctionnalites/exploration/)

## Grille

Les trois types peuvent coexister. Voir [grille (L4)](../L4-fonctionnalites/grille.md).

## Composants UI associés (référence L5)


| Type             | Composant principal                                |
| ---------------- | -------------------------------------------------- |
| `exploration`    | `PanneauExploration.vue`                           |
| `temps`          | `PanneauSerieTemporelle.vue`                       |
| `temps-compare`  | `PanneauSerieTemporelleCompare.vue`                |
| Grille (cellule) | `PanneauGridCell.vue`, `PanneauGridCellScoped.vue` |


## À compléter

- [ ] Liste exhaustive des contrôles (filtres) par panneau avec libellés UI
- [ ] Matrice source × type de panneau (résumé — voir [sources-utilisateur](sources-utilisateur.md))
- [ ] Comportement par défaut à l’ouverture (pays, variable, année)

## Voir aussi

- [Parcours](parcours.md)
- [Sélection de source (L4)](../L4-fonctionnalites/interactions/selection-source.md)

