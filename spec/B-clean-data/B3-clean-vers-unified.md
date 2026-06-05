# B3 — Clean → unified

*Quand plusieurs jeux **B1** décrivent le **même type d’objet**, produire un format **unified** unique pour [C](../C-visualizations/) et [D](../D-statistics/).*

---

## Objectif

- **Aligner la structure** (mêmes dimensions, mêmes noms de champs) pour simplifier graphiques et analyses.
- Exemples : deux séries temporelles issues de sources différentes ; deux grilles distributives sur le même indicateur.

---

## Règles

- L’unification **ne fusionne pas** des concepts incompatibles (pré- vs post-impôt, tranches non comparables) : les différences restent **caractérisées** et visibles ([A4](../A-raw-data/A4-caracterisation.md)).
- **Un schéma unified par usage aval** (ex. une série unifiée, une distribution unifiée) sauf exception documentée.
- Les couches C et D consomment **unified**, pas le brut A2.

---

## Chaîne

```text
B1 (clean) → B3 (unificateur) → unified → B4? (dérivées) → C / D
```

---

[B1](./B1-formats-clean.md) · [B2](./B2-brut-vers-clean.md) · [B4](./B4-transformations-derivees.md)
