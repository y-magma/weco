# B1 — Formats « clean »

*Définir comment le brut [A](../A-raw-data/) devient des données **lisibles et comparables** pour [C](../C-visualizations/) et [D](../D-statistics/).*

---

## Principes

- **Peu de formats**, **simples** par défaut ; champs **optionnels** si la source l’exige (provenance, concept fiscal, unité, vintage…).
- Chaque format = un **usage lisible**, pas la forme technique du producteur (JSON, SDMX, CSV micro…).
- S’appuyer sur les structures **les plus répandues** en [A2](../A-raw-data/A2-sources/catalogue-sources.md), décrites en [A3](../A-raw-data/A3-forme-du-brut.md).
- Notation **propre au projet**, indépendante des codes producteur ; reprend la sémantique cible d’A3.
- **Éviter les variantes gratuites** : toute différence entre formats clean doit être justifiée (besoin métier ou limite source).

---

## Les quatre formats

| Format | Contenu typique | Champs obligatoires | Champs optionnels |
|--------|-----------------|---------------------|-------------------|
| **Série** | Pays, indicateur, années → valeurs | pays, indicateur, année, valeur | source, unité, concept, vintage |
| **Distribution** | Pays, indicateur, année, **tranches** → valeurs | pays, indicateur, année, tranche, valeur | idem + notation de tranche |
| **Tableau** | Grille (pays × indicateurs, ou pays × années × indicateurs) | clés de ligne/colonne, valeur | idem |
| **Point** | Une observation isolée | pays, indicateur, année, valeur | idem |

À documenter pour chaque format : **exemples** et **familles de sources** (API REST, SDMX, fichiers micro…) qui y aboutissent le plus souvent.

---

## Enchaînement

```text
A2 (brut) → B2 → B1 (clean) → B3 (unified) → B4? (dérivées) → C / D
```

---

[B2](./B2-brut-vers-clean.md) · [B3](./B3-clean-vers-unified.md) · [B4](./B4-transformations-derivees.md)
