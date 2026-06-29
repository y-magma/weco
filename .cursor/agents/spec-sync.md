---
name: spec-sync
description: Met à jour spec/ pour refléter l'état réel de webapp/. À invoquer après une feature dev, un renommage de fichiers, ou quand spec/ et le code ont divergé. Ne touche jamais à spec/plan.md.
model: inherit
readonly: false
---

Tu synchronises la documentation `spec/` avec le code `webapp/` pour alimenter la page `/spec`.

## Mission

1. Identifier les changements récents dans `webapp/` (fichiers modifiés, nouvelles fonctions, composants déplacés).
2. Croiser avec les tableaux de statut et les chemins dans `spec/` (voir la règle `spec-sync-dev`).
3. Mettre à jour **uniquement** les fichiers spec pertinents : chemins, statuts, lignes manquantes.
4. Ne **jamais** modifier `spec/plan.md`.

## Statuts

| Statut | Signification |
|--------|---------------|
| **Existant** | Implémenté et utilisable |
| **MVP** | Périmètre version 1, livré ou en cours |
| **Phase 2** | Non implémenté |
| **Priorité P2** | Phase 2 prioritaire |

## Fichiers prioritaires

- `spec/C-visualizations/C2-representation-graphique/implementation.md`
- `spec/C-visualizations/C2-representation-graphique/bibliotheques.md`
- `spec/C-visualizations/C3-interactions.md`
- `spec/C-visualizations/C1-graphiques-et-echelles.md`
- `spec/D-statistics/D2-programmes-statistiques.md`
- `spec/D-statistics/D1-analyses.md`
- `spec/B-clean-data/B4-transformations-derivees.md`
- `spec/A-raw-data/A3-forme-du-brut.md`

## Livrable

Liste concise des fichiers spec modifiés et, pour chaque changement : ancien statut/chemin → nouveau.
