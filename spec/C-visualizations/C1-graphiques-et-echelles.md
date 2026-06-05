# C1 — Types de graphiques et données

*Quel type de graphique « lit » le mieux quel objet [B1](../B-clean-data/B1-formats-clean.md) / unified [B3](../B-clean-data/B3-clean-vers-unified.md) ?*

Entrée : formats **Série**, **Distribution**, **Tableau**, **Point**. Champs optionnels (source, unité, vintage, concept) affichés sous le graphique.

---

## Catalogue des graphiques

| Type de graphique | Données bien représentées | Format clean (B1) | Priorité |
|-------------------|---------------------------|-------------------|----------|
| **Courbe** (`line`) | Évolution dans le temps ; plusieurs séries comparables (pays, indicateurs) | **Série** | **MVP** |
| **Diagramme en bâtons** (`bar`) | Effectifs ou valeurs par **tranches** ordonnées (déciles, centiles, quintiles…) | **Distribution** | **MVP** |
| **Histogramme** (`bar` + regroupement) | Répartition d'une variable continue en **classes** ; effectifs par bin (micro agrégé, simulation) | **Distribution** (bins) | Phase 2 |
| **Nuage de points** (`scatter`) | Relation entre **deux variables** numériques, un point = une unité (pays, année…) | **Tableau** (2 colonnes) | **MVP** |
| **Courbe intégrale / cumulative** (`line`, cumul) | Part cumulée de la population vs part cumulée de l'indicateur (**Lorenz**, CDF empirique) — **intégrale graphique** d'une distribution donnée | **Distribution** (dérivé) | Phase 2 |
| **Carte de chaleur** (`heatmap`) | Matrice **pays × indicateurs** (ou pays × années) ; intensité = valeur | **Tableau** (grille) | Phase 2 |
| **Régression linéaire** (superposition) | Tendance sur un nuage (pays × indicateur) ou sur tranches 50–90 % ([D1](../D-statistics/D1-analyses.md)) ; droite **par-dessus** le graphique de base | **Tableau**, **Distribution** | Phase 2 |
| **Densité d'une loi connue** (superposition) | Courbe théorique (Pareto, log-normale, exponentielle…) comparée à l'**empirique** (bâtons ou histogramme) | **Distribution** | Phase 2 |

---

## Exigences d'affichage

- **Unité** et **source** (+ vintage si présent) visibles sur chaque vue.
- Concepts distincts (pré- / post-impôt, etc.) : libellés issus de la [A4 — Caractérisation](../A-raw-data/A4-caracterisation.md), jamais fusionnés sans avertissement.
- Export PNG (MVP) ; SVG (rapport, phase 2).

---

## Extensibilité

Nouveau type de graphique : ajouter une ligne au catalogue, un `build*Option` ([C2b](./C2-representation-graphique/implementation.md)) et le module ECharts ([C2a](./C2-representation-graphique/bibliotheques.md)). Superpositions et multi-panneaux : [C3](./C3-interactions.md).

---

[C2](./C2-representation-graphique/) · [C3](./C3-interactions.md) · [B](../B-clean-data/)
