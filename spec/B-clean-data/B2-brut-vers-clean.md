# B2 — Brut → clean

*Programmes qui lisent les données telles qu’elles sortent des bases [A2](../A-raw-data/A2-sources/catalogue-sources.md) et produisent les formats [B1](./B1-formats-clean.md).*

---

## Objectif

- Un **convertisseur** par source ou par **famille de sources proches** (même enveloppe technique, mêmes conventions).
- Chaque convertisseur **mappe explicitement** : dimensions, codes variable, notations de tranches (centiles, déciles, quintiles…) → vocabulaire clean.
- Les écarts méthodologiques restent **traçables** (source, concept, vintage) dans les champs optionnels B1.

---

## Règles

- Réutiliser les **mêmes règles d’extraction** (pays, années, indicateurs) au sein d’une famille quand c’est possible.
- Sortie **versionnée / reproductible** (snapshot ou export daté) — pas seulement un appel live non tracé.
- Le convertisseur **renseigne la caractérisation** de chaque série ([A4](../A-raw-data/A4-caracterisation.md)) ; il ne tranche pas entre sources concurrentes.

---

## Livrable attendu

Données au format B1 (Série, Distribution, Tableau ou Point), prêtes pour [B3](./B3-clean-vers-unified.md).

---

[B1](./B1-formats-clean.md) · [B3](./B3-clean-vers-unified.md)
