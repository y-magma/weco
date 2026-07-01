# C3 — Zoom graphique

*Complément de [C3-interactions](./C3-interactions.md). Recadrage **visuel** du canvas via les mécanismes **natifs** d’[ECharts](./C2-representation-graphique/bibliotheques.md) — sans modifier les données unified.*

---

## Objectif

Offrir un zoom **identique** sur tous les graphiques de l’application (courbe, barres, aires, nuage, séries custom, multi-grilles, toutes projections et fonctions de trace), en s’appuyant uniquement sur `dataZoom` et la `toolbox` ECharts. Aucun geste, bouton ou logique de zoom propre à l’application.

## Principe

```text
build*Option() → EChartsOption → <EChart /> (+ zoom ECharts) → canvas
```

- Le zoom est une **capacité du conteneur** `<EChart />`, pas des traceurs.
- Les `build*Option` ne déclarent **ni** `dataZoom` **ni** `toolbox` : axes et séries seulement ; la **toolbox** est injectée par `<EChart />` (`applyChartToolbox`).
- La même configuration zoom est **superposée** à toute option, quel que soit le rendu visuel produit en aval.

## Uniformité et comportement natif

Le zoom vise un comportement **identique** sur tous les rendus. Cette uniformité est obtenue par une **configuration commune** appliquée à chaque graphique — pas par les valeurs par défaut d’ECharts, qui varient selon le type d’axe et de série.

Règle de fond : **le zoom recadre la vue, il ne filtre jamais les données.** Seules les bornes d’axes changent ; toutes les séries restent tracées. C’est ce qui garantit un rendu correct sur échelles non linéaires (log, symlog, projections dérivées) et sur séries `custom` (trapèzes), où un filtrage de points casserait la géométrie.

## Capacités ECharts

### Navigation (`dataZoom`)


| Mécanisme             | Rôle                                                               |
| --------------------- | ------------------------------------------------------------------ |
| `inside`              | Molette / pinch : zoom ; glisser : déplacement de la fenêtre (pan) |
| `slider` (horizontal) | Fenêtre sur l’abscisse                                             |
| `slider` (vertical)   | Fenêtre sur l’ordonnée                                             |


Le pan par glisser est accepté tel quel ; il coexiste avec le clic (ex. drill-down sur le profil).

### Toolbox

Barre d’outils standard ECharts, identique sur tous les graphiques (injectée par `<EChart />` via `buildChartToolbox`) :


| Icône               | Feature           | Rôle                                                                                                                                                |
| ------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rectangle           | `dataZoom`        | Zoom par sélection rectangulaire (abscisse seule, `yAxisIndex: 'none'`)                                                                             |
| Table               | `dataView`        | Vue tabulaire des séries (`readOnly: false`)                                                                                                        |
| Line/Bar            | `magicType`       | Bascule ligne ↔ barres (`type: ['line', 'bar']`)                                                                                                    |
| logX                | `myLogX`          | Bascule lin ↔ log sur l’abscisse (`setOption`, axes `value`/`log` uniquement) ; icône MDI `math-log` ; état actif : bordure bleue, tooltip « logX » |
| logY                | `myLogY`          | Bascule lin ↔ log sur l’ordonnée (`setOption`, axes `value`/`log` uniquement) ; icône MDI `math-log` ; état actif : bordure bleue, tooltip « logY » |
| Flèche retour       | `dataZoom` (back) | Annule le dernier zoom                                                                                                                              |
| Flèches circulaires | `restore`         | Restaure l’état initial du graphique (ECharts)                                                                                                      |
| Téléchargement      | `saveAsImage`     | Export PNG de la vue affichée                                                                                                                       |


## Portée du zoom


| Règle                      | Énoncé                                                                              |
| -------------------------- | ----------------------------------------------------------------------------------- |
| Axes horizontaux           | Tous les `xAxis` d’un même graphique partagent le même zoom                         |
| Axes verticaux             | Tous les `yAxis` d’un même graphique partagent le même zoom                         |
| Multi-grilles (un canvas)  | Zoom **synchronisé** sur toutes les grilles du graphique (ex. série WID multi-pays) |
| Multi-panneaux (`/grille`) | Chaque `<EChart />` a son propre zoom, sans couplage entre cellules                 |


## Cycle de vie

Le viewport zoomé est porté par l’**instance ECharts** du graphique.

### Conservé

Un changement de **paramètre d’affichage** ne remet pas la vue complète : le **niveau de zoom est conservé** après le rebuild du traceur. Exemples : géométrie (courbe, barres, aires…), projection d’axes (lin, log, symlog, `rankTopLog`), fonction de trace (CDF, PDF, trapèzes, lissage), visibilité de calques, légende, mode d’empilement (pondéré / brut).

### Réinitialisé

Le zoom revient à la **vue complète** lorsque change l’**identité ou la granularité des données** tracées : source, pays, variable, année, drill-down, partition de population, tranche comparée, rechargement réseau.

`restore` (toolbox) et `dataZoom` back annulent le zoom **sans** modifier les paramètres du panneau.

Le zoom n’est **pas** inclus dans l’URL partageable.

## Ce que le zoom ne fait pas

- Ne modifie pas les données unified ni ne déclenche de requête.
- Ne remplace pas le drill-down, les bascules d’échelle ni les autres paramètres du panneau.
- Ne sélectionne pas de plage pour une analyse ([D1](../D-statistics/D1-analyses.md)) — futur rôle du brush (hors périmètre).

## Distinction avec les autres interactions


| Interaction                                        | Nature                                | Rapport au zoom                                                                                                                                     |
| -------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zoom graphique                                     | Recadrage du viewport (ECharts)       | —                                                                                                                                                   |
| Drill-down                                         | Changement de granularité des données | Indépendant ; un chang[http://localhost:3000/demo-regression.html](http://localhost:3000/demo-regression.html)ement de niveau remet la vue complète |
| Paramètres d’affichage (échelle, CDF, trapèzes, …) | Transformation ou calque de trace     | Indépendant ; le **niveau de zoom est conservé**                                                                                                    |
| Brush → D1                                         | Sélection sémantique                  | Futur ; hors périmètre                                                                                                                              |


## Hors périmètre

- Zoom par type de graphique ou par panneau (règles divergentes).
- Raccourcis clavier, boutons ou handlers applicatifs dédiés au zoom.
- Brush et analyses sur plage sélectionnée.
- Sérialisation du viewport dans l’URL.

## Aide utilisateur

Icône `**?`** à proximité du graphique : le zoom est un recadrage visuel ; il ne modifie pas les données source. Il est **conservé** quand on change l’affichage (échelle, type de trace, calques) et **réinitialisé** quand on change les données (pays, variable, année, drill-down…).

---

[C3-interactions](./C3-interactions.md) · [C2 — Représentation graphique](./C2-representation-graphique/)