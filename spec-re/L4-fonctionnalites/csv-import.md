# L4 — Import CSV

## Contexte

- **L1** : [Parcours — CSV](../L1-produit/parcours.md#parcours-type-4--csv-local)
- **L5** : `CsvUploadCard.vue`, `CsvReaderFactory.ts`

## Statut

Implémenté

## Comportement utilisateur

1. Page `/csv` : upload fichier CSV.
2. Utilisateur mappe colonnes → année, valeur (et label optionnel).
3. Aperçu graphique série temporelle à droite.

## Hors périmètre actuel

- Pas d’intégration registry `DataSourcePort`.
- Pas de profil percentile depuis CSV.

## À compléter

- [ ] Format CSV attendu, encodage, délimiteur
- [ ] Validation erreurs parsing (PapaParse)
- [ ] Options `buildTimeSeriesOption` appliquées au preview

## Voir aussi (L5)

| Fichier | Rôle |
|---------|------|
| `pages/csv.vue` | Layout page |
| `components/csv/CsvUploadCard.vue` | UI upload + mapping |
| `lib/infrastructure/csv/CsvReaderFactory.ts` | Parse → `DataSeries` |
| `lib/application/bootstrap/csvAdapter.ts` | Réexport factory |
| `visualization/timeSeries.ts` | `buildTimeSeriesOption` |

## Notes de reconstruction

Implémenter `CsvReaderFactory` + tests avant UI. Réutiliser `EChart.vue` identique aux panneaux.
