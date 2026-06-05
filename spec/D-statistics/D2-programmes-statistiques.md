# D2 — Programmes statistiques

*Quels programmes calculent les analyses de [D1](./D1-analyses.md) ?*

Entrée : données **unified** (B3). Sortie : indicateurs JSON + séries pour superposition graphique (C).

---

## Correspondance analyse → programme


| Analyse (D1)                       | Fonction                     | Fichier                             | Librairie                             | Statut          |
| ---------------------------------- | ---------------------------- | ----------------------------------- | ------------------------------------- | --------------- |
| Corrélation Pearson                | `pearsonCorrelation`         | `webapp/src/stats/correlation.ts`   | `simple-statistics` *(à ajouter)*     | Phase 2         |
| Corrélation Spearman               | `spearmanCorrelation`        | idem                                | `simple-statistics`                   | Phase 2         |
| Régression OLS (série / nuage)     | `linearRegression`           | `webapp/src/stats/regression.ts`    | `simple-statistics`                   | Phase 2         |
| Sélection auto de plage régression | `suggestRegressionRange`     | `webapp/src/stats/regression.ts`    | fenêtres glissantes + critère R²      | Phase 2         |
| **Régression p50–p90**             | `regressionP50P90`           | `webapp/src/stats/regression.ts`    | calcul maison + `simple-statistics`   | **Priorité P2** |
| Mann-Kendall                       | `mannKendallTest`            | `webapp/src/stats/trends.ts`        | calcul maison ou `mann-kendall-tau`   | Phase 2         |
| Détection de ruptures              | `detectChangePoints`         | `webapp/src/stats/trends.ts`        | à définir (CUSUM, PELT…)              | P2 exploratoire |
| Indice de Gini                     | `giniCoefficient`            | `webapp/src/stats/inequality.ts`    | calcul maison                         | Phase 2         |
| Adéquation loi (KS, χ²)            | `goodnessOfFit`              | `webapp/src/stats/distributions.ts` | `simple-statistics` / `@stdlib/stats` | Phase 2         |
| Ajustement loi (MLE)               | `fitDistribution`            | idem                                | `@stdlib/stats` ou Python offline     | Phase 2         |
| Densité PDF paramètres utilisateur | `densityWithUserParams`      | `webapp/src/stats/distributions.ts` | formules lois connues                 | Phase 2         |
| Comparaison de pentes              | `compareSlopesBootstrap`     | `webapp/src/stats/regression.ts`    | bootstrap maison                      | Phase 2         |
| ACP                                | `principalComponentAnalysis` | `webapp/src/stats/multivariate.ts`  | `ml-pca` *(à ajouter)*                | P2 exploratoire |
| k-means                            | `kMeansCluster`              | idem                                | `ml-kmeans` *(à ajouter)*             | P2 exploratoire |


---

## Glue vers les graphiques (C)


| Rôle                             | Fonction / composant               | Fichier                                                                                                         | Note                                                           |
| -------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Overlay régression               | `buildRegressionOverlay`           | `webapp/src/charts/` *(à créer, voir [C2b](../C-visualizations/C2-representation-graphique/implementation.md))* | Consomme sortie `linearRegression` / `regressionP50P90`        |
| Overlay densité PDF              | `buildDensityOverlay`              | idem                                                                                                            | Consomme sortie `fitDistribution`                              |
| Analyse sur plage brush (manuel) | `runAnalysisOnRange`               | `webapp/src/stats/` *(à créer)*                                                                                 | Plage C3 + unified                                             |
| Proposition plage + régression   | `runAnalysisWithSuggestedRange`    | idem                                                                                                            | Appelle `suggestRegressionRange` puis `linearRegression`       |
| Overlay densité paramétrable     | `buildDensityOverlay` + binding UI | `webapp/src/charts/`                                                                                            | Paramètres depuis `densityWithUserParams` ou `fitDistribution` |


---

## Chaîne

```text
unified (B3) → stats/*.ts (D2) → indicateurs + courbes fit → overlay C2b
```

---

[D1](./D1-analyses.md) · [D3](./D3-hypotheses.md)