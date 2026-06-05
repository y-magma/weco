# Spécification du projet

Spécifications d’**intention**. Chaque bloc **A → E** est un dossier ; chaque sous-étape est un fichier `.md`.

---

## Flux de données

```text
A (brut)  →  B2  →  B1 (clean)  →  B3 (unified)  →  B4? (dérivées)  →  C (graphiques)
                                              ↘  D (analyses statistiques)
E (cadres théoriques) — lecture transversale sur A–D
```


| Étape | Question                                                       |
| ----- | -------------------------------------------------------------- |
| **A** | Quoi observer, d’où, sous quelle forme, comment caractériser ? |
| **B** | Comment normaliser, unifier, dériver ?                         |
| **C** | Comment représenter (graphiques, interactions, produit) ?      |
| **D** | Quelles analyses et quels programmes ?                         |
| **E** | Comment interpréter (éconophysique, SFC, DSGE) ?               |


---

## Arborescence

```
spec/
├── README.md
├── plan.md                            Vision produit (référence utilisateur)
│
├── A-raw-data/
│   ├── A1-ce-qu-on-veut-observer.md
│   ├── A2-sources/
│   │   ├── catalogue-sources.md
│   │   └── acces-api.md
│   ├── A3-forme-du-brut.md
│   └── A4-caracterisation.md
│
├── B-clean-data/
│   ├── B1-formats-clean.md
│   ├── B2-brut-vers-clean.md
│   ├── B3-clean-vers-unified.md
│   └── B4-transformations-derivees.md
│
├── C-visualizations/
│   ├── C1-graphiques-et-echelles.md
│   ├── C2-representation-graphique/
│   │   ├── bibliotheques.md
│   │   └── implementation.md
│   └── C3-interactions.md
│
├── D-statistics/
│   ├── D1-analyses.md
│   ├── D2-programmes-statistiques.md
│   └── D3-hypotheses.md
│
└── E-economic-models/
    ├── E1-econophysique.md
    ├── E2-sfc.md
    └── E3-dsge.md
```

---

## Index par bloc


| Bloc  | Dossier                                    | Fichiers                                                                                                                                                                                                       |
| ----- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A** | [A-raw-data/](./A-raw-data/)               | [A1](./A-raw-data/A1-ce-qu-on-veut-observer.md) · [A2](./A-raw-data/A2-sources/) · [A3](./A-raw-data/A3-forme-du-brut.md) · [A4](./A-raw-data/A4-caracterisation.md)                                           |
| **B** | [B-clean-data/](./B-clean-data/)           | [B1](./B-clean-data/B1-formats-clean.md) · [B2](./B-clean-data/B2-brut-vers-clean.md) · [B3](./B-clean-data/B3-clean-vers-unified.md) · [B4](./B-clean-data/B4-transformations-derivees.md)                    |
| **C** | [C-visualizations/](./C-visualizations/)   | [C1](./C-visualizations/C1-graphiques-et-echelles.md) · [C2](./C-visualizations/C2-representation-graphique/) · [C3](./C-visualizations/C3-interactions.md)                                                    |
| **D** | [D-statistics/](./D-statistics/)           | [D1](./D-statistics/D1-analyses.md) · [D2](./D-statistics/D2-programmes-statistiques.md) · [D3](./D-statistics/D3-hypotheses.md)                                                                               |
| **E** | [E-economic-models/](./E-economic-models/) | [E1](./E-economic-models/E1-econophysique.md) · [E2](./E-economic-models/E2-sfc.md) · [E3](./E-economic-models/E3-dsge.md)                                                                                     |


---

## Conventions

- **MVP / Phase 2** : priorisation produit, pas choix entre sources (voir [A4](./A-raw-data/A4-caracterisation.md)).
- **Indépendance des sources** : les blocs B–E parlent de formats et d’usages, pas d’une base unique.

