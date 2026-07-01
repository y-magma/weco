# C3 — Échelles, interactions et produit graphique

*Échelles, comportements interactifs et exigences d’interface sur les vues [C1](./C1-graphiques-et-echelles.md), via [ECharts](./C2-representation-graphique/bibliotheques.md) et [traceurs](./C2-representation-graphique/implementation.md). Zoom graphique : [C3-zoom](./C3-zoom.md).*

Entrée : [B3 unified](../B-clean-data/B3-clean-vers-unified.md) ou [B4 dérivées](../B-clean-data/B4-transformations-derivees.md).

---

## Échelles par défaut

Choix **au premier affichage** (avant action utilisateur). La bascule lin/log ne modifie que l’échelle d’affichage.

| Graphique | Abscisse | Ordonnée |
|-----------|----------|----------|
| Courbe (Série) | Années, **lin** | Valeur **lin** |
| Bâtons / histogramme (Distribution) | Tranches ou bins, **lin** | Valeur **lin** ; **log** si écart de ordres de grandeur |
| Nuage (Tableau) | Variable X **lin** | Variable Y **lin** |
| Courbe cumulative | Part population **lin** | Part cumulée **lin** |
| Heatmap | Catégories | Couleur = valeur (échelle continue) |
| Régression p50–p90 | Rang / tranche **log** | Valeur **lin** ([D1](../D-statistics/D1-analyses.md)) |

---

## Sélecteur d’axes X / Y

| Exigence | Comportement | Priorité |
|----------|--------------|----------|
| Abscisse et ordonnée **indépendantes** | L’utilisateur choisit quelle dimension / indicateur alimente chaque axe | Phase 2 |
| Source des variables | Champs **unified** ou **dérivés** (B4) : indicateurs, tranches, années, pays… | Phase 2 |
| Échelle temps | Année utilisable comme abscisse **ou** comme filtre | MVP (courbe) |
| Préréquis format | **Tableau** ou **Série** pour XY libres ; **Distribution** : abscisse = tranches (sauf dérivée B4) | — |

---

## Interactions

| Interaction | Graphiques | Comportement | Priorité | Support ECharts |
|-------------|------------|--------------|----------|-----------------|
| **Tooltip** | Tous | Valeur, tranche, pays au survol | MVP | `tooltip` |
| **Zoom graphique** | Tous (`<EChart />`) | `dataZoom` + toolbox (`dataZoom` rect., `dataView`, `magicType`, back, `restore`, `saveAsImage`) — identique sur tous les rendus | — | [C3-zoom](./C3-zoom.md) · `chartZoom.ts` |
| **Brush tranches → analyse** | Bâtons, histogramme | Plage d’abscisse → régression / analyse [D1](../D-statistics/D1-analyses.md) | Phase 2 | `brush` |
| **Drill-down sommet** | Distribution fine (profil) | 0–100 % → tranches 1 % → clic sur ]99 %, 100 %] → 0,1 % → 0,01 % → 0,001 % | **Existant** | `drilldown.ts`, `useExplorationPanel.ts` |
| **Tranches 10 % (courbe)** | Profil (`PanneauExploration`) | Sélecteur « Tranches de population (courbe) » : agrégation en intervalles de 10 % (]0, 10 %], …, ]90, 100 %]) | **Existant** | `populationPartition.ts`, `useExplorationPanel.ts` |
| **Tranche 50 % - 90 % - 99 % - 99,9 % - 100 %** | Profil (intervalles d'approximation), série temporelle WID | Preset WID : ]0, 50 %], ]50, 90 %], ]90, 99 %], ]99, 99,9 %], ]99,9, 100 %] — libellé « Tranche 50% - 90% - 99% - 99.9% - 100% » | **Existant** | `populationPartition.ts`, `timeSeriesPartition.ts` |
| **Bascule mode d'empilement** | Série temporelle WID (`PanneauSerieTemporelle`) | Toggle « Pondéré / Valeurs réelles » : `'weighted'` = moyenne × largeur de tranche (contribution à la moyenne nationale) ; `'raw'` = vraie moyenne WID par tranche sans transformation ; **`?`** (`ProfileHelpButton`, `timeSeriesHelp.ts`) + bandeau info en mode pondéré | **Existant** | `TrancheStackMode`, `buildStackedTimeSeriesOption`, `useTimeSeriesPanel.ts` |
| **Échelle log queue haute (rang)** | Profil trapèzes / original | Projection `rankTopLog` sur l’axe population (`logRichScale`) ; incompatible avec log X strict | **Existant** | `axisScale.ts` (`rankTopLogScale`), `trapezoidChart.ts`, `useExplorationPanel.ts` |
| **Bascule lin / log abscisse** | Courbe, nuage, distribution | Échelle X indépendante de Y | Phase 2 | `xAxis.type: 'log'` |
| **Bascule lin / log ordonnée** | Courbe, bâtons, nuage | Échelle Y indépendante de X | Phase 2 | `yAxis.type: 'log'` |
| **Légende cliquable** | Courbe multi-séries | Masquer / afficher une série | MVP | `legend` |
| **Export image** | Tous | PNG via `toolbox.saveAsImage` | — | [C3-zoom](./C3-zoom.md) |
| **Lien partageable** | Pages `/panneau/exploration`, `/panneau/temps`, `/grille` | Bouton global « Partager » (`ShareUrlButton.vue`) ; query lisible `?v=1&source=…&country=…` (legacy `s=` base64 accepté) ; sync live URL (`useShareableUrl.ts`, `lib/application/share/`) | MVP | **Existant** |
| **Aide transformations (`?`)** | Tous graphiques avec dérivée ou pondération | Icône `?` (`ProfileHelpButton.vue`) à côté du contrôle concerné ; textes centralisés (`profileHelp.ts`, `timeSeriesHelp.ts`) ; bandeau info si transformation active non évidente | **Existant** | règle `.cursor/rules/data-transformations-disclosure.mdc` |

---

## Layout multi-panneaux

| Exigence | Comportement | Priorité |
|----------|--------------|----------|
| **Plusieurs graphes en parallèle** | Dashboard : N panneaux (courbe + distribution + nuage) | MVP |
| Synchronisation optionnelle | Même pays / fenêtre temporelle entre panneaux | Phase 2 |
| **Source unique vs par graphique (`/grille`)** | Bascule « Source unique » / « Source par graphique » : sélecteur global (`PanneauDataSourceSection`) ou un sélecteur par panneau (`PanneauGridCell` + `PanneauGridCellScoped`) | **Existant** |
| **Réordonnancement des panneaux (`/grille`)** | Barre de contrôle par panneau : poignée glisser-déposer + boutons monter / descendre ; ordre reflété dans l’URL partageable | **Existant** |
| **Paramètres globaux (`/grille`)** | Section repliable « Paramètres globaux » (`GrilleGlobalParamsPanel.vue`) : pays, variable, année (profil seulement), âge et population (WID) dans « Paramètres avancés » ; bouton **Appliquer** pour propager le brouillon à tous les panneaux (`useGrilleGlobalParams.ts`, `useGrilleGlobalParamsApply.ts`) ; effacer un champ supprime la surcharge | **Existant** |
| **Source par contexte de panneau** | Profil (`/panneau/exploration`) : OECD IDD grisé (`EXPLORATION_DISABLED_SOURCE_IDS`) ; World Bank : sélecteur « Variable » limité aux parts PIP (10 déciles) et WDI (5 quintiles) | **Existant** |
| **Série temporelle WB (1er panneau)** | `PanneauSerieTemporelle` panel 0 : sélecteur limité aux parts PIP (10 déciles) et WDI (5 quintiles) ; graphique en aires empilées (`buildStackedShareTimeSeriesOption`) | **Existant** |
| Implémentation | `dashboard.vue`, `useDashboard.ts` — [C2b](./C2-representation-graphique/implementation.md) |

---

## Superposition de types de graphes

| Exigence | Comportement | Priorité |
|----------|--------------|----------|
| **Deux géométries sur un canvas** | Ex. histogramme + nuage, bâtons + courbe | Phase 2 |
| Overlays d’analyse | Régression, densité PDF — [C1](./C1-graphiques-et-echelles.md) · [D2](../D-statistics/D2-programmes-statistiques.md) | Phase 2 |
| Règle | Séries superposées : **mêmes axes** (ou axe secondaire documenté) | — |

---

## Études comparatives cross-source (page `/etudes`)

| Exigence | Comportement | Priorité |
|----------|--------------|----------|
| **Page dédiée** | Index `/etudes` + sous-pages `/etudes/[slug]` — presets WID / OCDE / WB | Phase 2 |
| **Mode parallèle** | 2–4 graphiques, **une source par slot**, chips concept visibles | Phase 2 |
| **Mode superposé** | Une courbe, séries multi-sources ; harmonisation explicite (Gini 0–1, ratios…) | Phase 2 |
| **Édition preset** | Params publics (pays, années) ; params avancés derrière icône crayon ; reset preset | Phase 2 |
| **Règle vs `/grille`** | Sur `/panneau` et `/grille` : pas de superposition cross-source. Sur `/etudes` uniquement : superposition **autorisée** avec caveats affichés (voir [A4](../A-raw-data/A4-caracterisation.md)) | Phase 2 |

Catalogue des cas et fiches UI : [etudes-comparatives/](./etudes-comparatives/) — [cas-comparaison.md](./etudes-comparatives/cas-comparaison.md) · [structure-etudes.md](./etudes-comparatives/structure-etudes.md).

---

## Extensibilité des types de graphes

- Nouveau type = `build*Option` ([C2b](./C2-representation-graphique/implementation.md)) + entrée [C1](./C1-graphiques-et-echelles.md) + module ECharts ([C2a](./C2-representation-graphique/bibliotheques.md)).
- Pas de modification du pipeline B3 pour ajouter un graphique.

---

## Règles

- Les interactions ne **modifient pas** les données unified : elles filtrent l’affichage ou déclenchent une analyse D sur la plage sélectionnée.
- Préférences lin/log **par axe** mémorisées par vue (phase 2).
- Accessibilité cible : titres, contraste, puis ARIA.

---

[C1](./C1-graphiques-et-echelles.md) · [C2](./C2-representation-graphique/) · [Études comparatives](./etudes-comparatives/) · [B4](../B-clean-data/B4-transformations-derivees.md)
