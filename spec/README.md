# Spécification du projet

Spécifications d’**intention** (conceptuelles, langage humain) — pas de détail d’implémentation (fichiers de code, APIs TypeScript, etc.).

Chaque bloc **A → E** est un dossier ; chaque sous-étape est un fichier `.md`.

---

## Flux de données

```text
A (brut)  →  B2  →  B1 (clean)  →  B3 (unified)  →  C (graphiques)
                                              ↘  D (analyses statistiques)
E (cadres théoriques) — lecture transversale sur A–D
```


| Étape | Question                                                       |
| ----- | -------------------------------------------------------------- |
| **A** | Quoi observer, d’où, sous quelle forme, comment caractériser ? |
| **B** | Comment normaliser et unifier ?                                |
| **C** | Comment représenter (graphiques, interactions) ?               |
| **D** | Quelles analyses et quels programmes ?                         |
| **E** | Comment interpréter (éconophysique, SFC, DSGE) ?               |


---

## Arborescence

```
spec/
├── README.md                          ← ce fichier
│
├── A-raw-data/                        Bloc A — Raw Data
│   ├── A1-ce-qu-on-veut-observer.md   Thèmes et indicateurs à couvrir
│   ├── A2-sources/
│   │   ├── catalogue-sources.md       Catalogue mondial des bases
│   │   └── acces-api.md               Accès programmatique (API ou non)
│   ├── A3-forme-du-brut.md            Formats bruts par base (à compléter)
│   └── A4-caracterisation.md          Métadonnées : concept, périmètre, vintage…
│
├── B-clean-data/                      Bloc B — Clean Data
│   ├── B1-formats-clean.md            Série · Distribution · Tableau · Point
│   ├── B2-brut-vers-clean.md          Convertisseurs A2 → B1
│   └── B3-clean-vers-unified.md       Unificateurs B1 → unified
│
├── C-visualizations/                  Bloc C — Visualisations
│   ├── C1-graphiques-et-echelles.md   Types de graphiques ↔ données B1
│   ├── C2-representation-graphique/
│   │   ├── bibliotheques.md           Stack ECharts (C2a)
│   │   └── implementation.md          Fonctions build*Option (C2b)
│   └── C3-interactions.md             Échelles par défaut et interactions
│
├── D-statistics/                      Bloc D — Statistiques
│   ├── D1-analyses.md                 Catalogue d’analyses (stats, ML léger)
│   ├── D2-programmes-statistiques.md  Fonctions de calcul
│   └── D3-hypotheses.md               Hypothèses économiques testables
│
└── E-economic-models/                 Bloc E — Modèles économiques
    ├── E1-econophysique.md            Queues de distribution
    ├── E2-sfc.md                      Stock-Flow Consistency
    └── E3-dsge.md                     DSGE : usages et liens données
```

---

## Index par bloc


| Bloc  | Dossier                                    | Fichiers                                                                                                                                                             |
| ----- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A** | [A-raw-data/](./A-raw-data/)               | [A1](./A-raw-data/A1-ce-qu-on-veut-observer.md) · [A2](./A-raw-data/A2-sources/) · [A3](./A-raw-data/A3-forme-du-brut.md) · [A4](./A-raw-data/A4-caracterisation.md) |
| **B** | [B-clean-data/](./B-clean-data/)           | [B1](./B-clean-data/B1-formats-clean.md) · [B2](./B-clean-data/B2-brut-vers-clean.md) · [B3](./B-clean-data/B3-clean-vers-unified.md)                                |
| **C** | [C-visualizations/](./C-visualizations/)   | [C1](./C-visualizations/C1-graphiques-et-echelles.md) · [C2](./C-visualizations/C2-representation-graphique/) · [C3](./C-visualizations/C3-interactions.md)          |
| **D** | [D-statistics/](./D-statistics/)           | [D1](./D-statistics/D1-analyses.md) · [D2](./D-statistics/D2-programmes-statistiques.md) · [D3](./D-statistics/D3-hypotheses.md)                                     |
| **E** | [E-economic-models/](./E-economic-models/) | [E1](./E-economic-models/E1-econophysique.md) · [E2](./E-economic-models/E2-sfc.md) · [E3](./E-economic-models/E3-dsge.md)                                           |


---

## Conventions

- **MVP / Phase 2** : priorisation produit, pas choix entre sources (voir [A4](./A-raw-data/A4-caracterisation.md)).
- **Indépendance des sources** : les blocs B–E parlent de formats et d’usages, pas d’une base unique.

