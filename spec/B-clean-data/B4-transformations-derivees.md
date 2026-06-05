# B4 — Transformations dérivées (optionnel)

*Entre [B3](./B3-clean-vers-unified.md) et [C](../C-visualizations/) : variables issues des clean data, **avec ou sans transformations supplémentaires**, sans réécrire les convertisseurs B2.*

---

## Objectif

- Produire des champs exploitables pour le **sélecteur d’axes** ([C3](../C-visualizations/C3-interactions.md)) : ratios, logs, différences temporelles, agrégations.
- Ne **pas** remplacer B3 : les unified restent la vérité ; les dérivées sont **annotées** (formule, champs sources).

---

## Exemples de dérivées

| Dérivée | Entrée B1/B3 | Usage C |
|---------|--------------|---------|
| Log(valeur) | Série, Distribution, Tableau | Abscisse ou ordonnée en échelle log sans changer l’affichage seul |
| Ratio A / B | Deux Séries ou colonnes Tableau | Nuage, courbe |
| Δ année sur année | Série | Courbe |
| Cumul population / indicateur | Distribution | Courbe intégrale (Lorenz) |

---

## Règles

- Chaque dérivée **documente** sa formule et propage la [caractérisation](../A-raw-data/A4-caracterisation.md) des champs sources.
- Calcul **côté client ou pipeline intermédiaire** — pas de fusion de concepts incompatibles (pré- vs post-impôt).
- Les dérivées peuvent alimenter [D](../D-statistics/) comme les unified.

---

## Chaîne

```text
B3 (unified) → B4 (dérivée, optionnel) → C / D
```

---

[B3](./B3-clean-vers-unified.md) · [C3](../C-visualizations/C3-interactions.md)
