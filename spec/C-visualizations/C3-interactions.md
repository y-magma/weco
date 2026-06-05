# C3 — Échelles et interactions

*Échelles par défaut et comportements interactifs sur les vues [C1](./C1-graphiques-et-echelles.md), via [ECharts](./C2-representation-graphique/bibliotheques.md) et [traceurs](./C2-representation-graphique/implementation.md).*

---

## Échelles par défaut

Choix **au premier affichage** (avant action utilisateur). La bascule lin/log (phase 2) ne modifie que l’échelle d’affichage.

| Graphique | Abscisse | Ordonnée |
|-----------|----------|----------|
| Courbe (Série) | Années, **lin** | Valeur **lin** |
| Bâtons / histogramme (Distribution) | Tranches ou bins, **lin** | Valeur **lin** ; **log** si écart de ordres de grandeur |
| Nuage (Tableau) | Variable X **lin** | Variable Y **lin** |
| Courbe cumulative | Part population **lin** | Part cumulée **lin** |
| Heatmap | Catégories | Couleur = valeur (échelle continue) |
| Régression p50–p90 | Rang / tranche **log** | Valeur **lin** ([D1](../D-statistics/D1-analyses.md)) |

---

## Interactions

| Interaction | Graphiques | Comportement | Priorité | Support ECharts |
|-------------|------------|--------------|----------|-----------------|
| **Tooltip** | Tous | Valeur, tranche, pays au survol | MVP | `tooltip` |
| **Zoom temporel** | Courbe (Série) | Fenêtre d’années, slider + molette | MVP | `dataZoom` *(déjà dans `buildTimeSeriesOption`)* |
| **Zoom / brush tranches** | Bâtons, histogramme | Plage de tranches → envoi [D1](../D-statistics/D1-analyses.md) | Phase 2 | `dataZoom` category, `brush` |
| **Zoom haut de distribution** | Distribution fine | 0–100 % → top 1 % / 0,1 % | Phase 2 | `dataZoom` + filtre données |
| **Bascule lin / log** | Courbe, bâtons, nuage | Remplace l’échelle ordonnée par défaut (affichage seul) | Phase 2 | `yAxis.type: 'log'` dynamique |
| **Légende cliquable** | Courbe multi-séries | Masquer / afficher une série | MVP | `legend` |
| **Export image** | Courbe MVP, puis tous | PNG depuis la toolbox | MVP / P2 | `toolbox.saveAsImage` |
| **Réinitialiser vue** | Tous avec zoom | Retour à la plage initiale | MVP | `toolbox.restore` |

---

## Règles

- Les interactions ne **modifient pas** les données unified : elles filtrent l’affichage ou déclenchent une analyse D sur la plage sélectionnée.
- Préférence lin/log mémorisée par vue (phase 2).
- Accessibilité cible : titres, contraste, puis ARIA sur les contrôles.

---

[C1](./C1-graphiques-et-echelles.md) · [C2](./C2-representation-graphique/)
