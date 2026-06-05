# D1 — Analyses statistiques

*Quels outils mathématiques (statistiques, ML léger) pour interpréter les données [B](../B-clean-data/) et les graphiques [C](../C-visualizations/) ?*

Entrée : formats **unified** (B3) — **Série**, **Distribution**, **Tableau**. Sorties : indicateurs, tests, courbes ajustées **superposables** sur C ([C1](../C-visualizations/C1-graphiques-et-echelles.md), [C3](../C-visualizations/C3-interactions.md)).

---

## Par format de données (B)

| Analyse | Famille | Entrée B1 | Question | Sortie | Priorité |
|---------|---------|-----------|----------|--------|----------|
| **Corrélation de Pearson** | Stat. inférentielle | **Série** ou **Tableau** (2 variables alignées) | Liaison linéaire entre deux indicateurs ? | r, p-value, n | Phase 2 |
| **Corrélation de Spearman** | Stat. inférentielle | idem | Liaison monotone (non nécessairement linéaire) ? | ρ, p-value | Phase 2 |
| **Régression linéaire (OLS)** | Stat. inférentielle | **Série** (Y ~ X dans le temps) ou **Tableau** (nuage) | Tendance, pente, prédiction ? | Pente, intercept, R², erreur | Phase 2 |
| **Sélection auto de plage (régression)** | Stat. inférentielle | **Série**, **Distribution**, **Tableau** | Où la régression linéaire est la plus pertinente sur l’abscisse ? | Intervalle candidat, score (R², stabilité) | Phase 2 |
| **Régression p50–p90** | Stat. inférentielle | **Distribution** | Pente du haut de distribution (log tranche → valeur) ? | Droite, R², plage 50–90 % | **Priorité P2** |
| **Test de Mann-Kendall** | Séries temporelles | **Série** | Tendance monotone dans le temps ? | Stat, p-value | Phase 2 |
| **Détection de ruptures** | Séries temporelles | **Série** | Changement de régime (dates candidates) ? | Dates, amplitudes | P2 exploratoire |
| **Indice de Gini** | Inégalité | **Distribution** ou Lorenz (dérivé C) | Concentration globale ? | Gini ∈ [0, 1] | Phase 2 |
| **Adéquation à une loi** (KS, χ² sur bins) | Stat. descriptive / test | **Distribution**, histogramme | Empirique compatible avec Pareto, log-normale… ? | Stat de test, p-value | Phase 2 |
| **Ajustement de loi (MLE / moments)** | ML / inférence | **Distribution** | Paramètres d'une loi théorique ? | Paramètres, courbe PDF | Phase 2 |
| **Densité PDF paramétrable (UI)** | Stat. descriptive | **Distribution**, histogramme | Superposer Pareto, log-normale… avec **paramètres réglés par l’utilisateur** ? | Courbe PDF, paramètres courants | Phase 2 |
| **Comparaison de pentes** (bootstrap) | Stat. inférentielle | **Distribution** × pays/années | Pentes p50–p90 différentes ? | Intervalles, test | Phase 2 |
| **ACP (PCA)** | ML multivarié | **Tableau** (matrice pays × indicateurs) | Axes de variation du panel ? | Composantes, loadings | P2 exploratoire |
| **Regroupement (k-means)** | ML non supervisé | **Tableau** | Clusters de pays similaires ? | Labels, centroïdes | P2 exploratoire |

---

## Par type de graphique (C)

| Graphique C | Analyses associées |
|-------------|-------------------|
| **Courbe** (Série) | Mann-Kendall, ruptures ; corrélation / régression entre deux séries superposées |
| **Bâtons / histogramme** (Distribution) | Régression p50–p90 ; Gini ; adéquation et ajustement de loi |
| **Nuage** (Tableau) | Pearson, Spearman, régression OLS ; comparaison de pentes si sous-ensemble |
| **Courbe cumulative** (Lorenz) | Gini |
| **Régression superposée** | Résultat d'une OLS ou p50–p90 → tracé [C2b](../C-visualizations/C2-representation-graphique/implementation.md) |
| **Densité loi connue** | Résultat ajustement MLE / moments → courbe PDF superposée |
| **Heatmap** (Tableau) | ACP, clustering sur le même tableau |
| **Brush / zoom** ([C3](../C-visualizations/C3-interactions.md)) | Recalcul des analyses sur la **plage sélectionnée** (manuel) ou plage proposée par sélection auto |

---

## Régression : intervalle manuel ou automatique

| Mode | Entrée | Comportement |
|------|--------|--------------|
| **Manuel** | Plage d’abscisse (brush, [C3](../C-visualizations/C3-interactions.md)) | OLS ou p50–p90 sur la fenêtre choisie |
| **Automatique** | Série, distribution ou nuage complet | Algo parcourt des fenêtres candidates ; retient celle qui maximise un critère (ex. R², pente stable) — voir [D2](./D2-programmes-statistiques.md) `suggestRegressionRange` |

Dans les deux cas : droite superposable via [C2b](../C-visualizations/C2-representation-graphique/implementation.md) `buildRegressionOverlay`.

---

## Densité : paramètres utilisateur

| Mode | Comportement |
|------|--------------|
| **Ajustement auto** | MLE / moments → `fitDistribution` |
| **Manuel** | L’utilisateur choisit la loi (Pareto, log-normale, exponentielle…) et règle les paramètres (sliders ou champs) ; courbe recalculée en direct → `densityWithUserParams` ([D2](./D2-programmes-statistiques.md)) |

---

## Régression p50–p90 (détail)

| Paramètre | Choix |
|-----------|-------|
| Plage | Tranches 50 %–90 % de la population |
| Abscisse | Log(rang) ou log(milieu de tranche) — voir [C3](../C-visualizations/C3-interactions.md) |
| Ordonnée | Revenu ou patrimoine moyen par tranche |
| Modèle | Ordonnée ~ log(abscisse) |

---

## Programmes

Implémentation : [D2 — Programmes statistiques](./D2-programmes-statistiques.md). Hypothèses économiques testables : [D3](./D3-hypotheses.md).

---

[D2](./D2-programmes-statistiques.md) · [B3](../B-clean-data/B3-clean-vers-unified.md) · [C3](../C-visualizations/C3-interactions.md)
