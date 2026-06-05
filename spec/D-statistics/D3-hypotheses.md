# D3 — Hypothèses testables

*Quelles questions économiques et quels critères de validation — en s'appuyant sur les analyses [D1](./D1-analyses.md) et les programmes [D2](./D2-programmes-statistiques.md) ?*

---

## H0 — Stress et inégalité (démo uniquement)

| Élément | Contenu |
|---------|---------|
| Question | Le proxy « stress » covarie-t-il avec la part des 10 % les plus riches ? |
| Variables | Part des 10 % les plus riches (série **Distribution** / **Série**) ; stress (**fictif**) |
| Analyse D1 | Corrélation Pearson (non exécutée en prod) |
| Validation | **Non applicable** — démo UI (`stressHypothesis.ts`) |

---

## H1 — Revenu du capital et patrimoine (phase 2)

| Élément | Contenu |
|---------|---------|
| Question | Part du capital associée au patrimoine ? |
| Variables | Composition revenu ; patrimoine moyen ou par tranche |
| Analyse D1 | Corrélation de Spearman |
| Critère | ρ > seuil documenté sur panel FR, US, DE (~1995–2023) |

---

## H2 — Patrimoine vs travail (phase 2)

| Élément | Contenu |
|---------|---------|
| Question | Revenu implicite du patrimoine vs revenu du travail ? |
| Variables | Ratio capital/patrimoine ; salaires ou part travail |
| Analyse D1 | Régression OLS en panel |
| Critère | Panel documenté ; sensibilité post-2008 |

---

## H3 — Pente p50–p90 (phase 2)

| Élément | Contenu |
|---------|---------|
| Question | Pentes différentes entre FR, US, CN ? |
| Variables | log(tranche) ; patrimoine par tranche (2019, 2024) |
| Analyse D1 | `regressionP50P90` + `compareSlopesBootstrap` |
| Critère | Intervalles de confiance des pentes non recouvrants |

---

## Relations économiques

```mermaid
flowchart LR
  capital[Revenu du capital]
  wealth[Patrimoine]
  labor[Revenu du travail]
  implicit[Revenu implicite patrimoine]
  capital -->|H1| wealth
  implicit -->|H2| labor
  wealth --> implicit
```

| Relation | Statut |
|----------|--------|
| Capital ↔ patrimoine | H1 — phase 2 |
| Patrimoine ↔ travail | H2 — phase 2 |
| Inégalité ↔ stress | H0 — hors MVP réel |

Cadre macro : [E — Modèles économiques](../E-economic-models/).

---

[D1](./D1-analyses.md) · [D2](./D2-programmes-statistiques.md)
