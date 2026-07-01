# L2 — Extensibilité & port des sources

## Contexte

- **L1** : [Sources utilisateur](../L1-produit/sources-utilisateur.md)
- **L3** : [Entités](../L3-domaine/entites.md)
- **L5** : [Registry](../L5-implementation/sources/_registry.md)

## Contrat `DataSourcePort`

Chaque adaptateur implémente :

| Membre | Type | Rôle |
|--------|------|------|
| `id` | `string` | Identifiant registry (`wid`, `oecd-idd`, `worldbank`) |
| `label`, `description`, `website?` | `string` | Métadonnées UI |
| `capabilities?` | `DataSourceCapabilities` | Facettes supportées |
| `indicators?` | `SourceIndicator[]` | Catalogue pour v-select |
| `listCountries` | async | Pays disponibles |
| `listAvailableParams` | async | Combos age/pop (WID) |
| `fetchPercentileProfile` | async | Profil distribution |
| `fetchVariableTimeSeries` | async | Série temporelle |
| `listProfileYears` | async | Années disponibles profil |
| `getStatus` | sync | État santé source |

## Capacités déclarées

```typescript
interface DataSourceCapabilities {
  percentileProfile: boolean      // 127 g-pct WID
  decileProfile?: boolean         // profils agrégés décile/quintile
  timeSeries: boolean
  scatter: boolean
}
```

| Source | percentileProfile | decileProfile | timeSeries | scatter |
|--------|-------------------|---------------|------------|---------|
| wid | true | — | true | true |
| oecd-idd | false | true | true | false |
| worldbank | false | true | true | false |

## Registry

- `initializeDataSources(config?)` — enregistre WID (si clé), OECD, World Bank.
- `registerDataSource(source)` — extension manuelle / tests.
- `getDefaultDataSource()` — `wid` si présent, sinon premier enregistré.
- `getDataSourceById(id)` — lookup.

## Ajouter une source (procédure reconstruction)

1. Créer classe implémentant `DataSourcePort` dans `lib/infrastructure/data-sources/<id>/`.
2. Déclarer `capabilities` et `indicators` cohérents avec ce que l’UI peut consommer.
3. Appeler `registerDataSource` dans `initializeDataSources`.
4. Si profils décile : étendre `decileBundles` domaine + branches composables exploration/temps.
5. Tests infrastructure : client HTTP mocké, parsing, erreurs.
6. Documenter L5 fiche source + mettre à jour matrices L1/L4.

## Use cases & source optionnelle

Tous les use cases acceptent `{ source?: DataSourcePort }` pour override (grille per-panel).

## Points d’extension UI

- `usePanneauDataSource` — inject `sourceId` partagé ou local.
- `EXPLORATION_DISABLED_SOURCE_IDS` — filtre UI par contexte.
- `timeSeriesIndicatorsForPanel` — sous-ensemble indicateurs World Bank panel 0.

## À compléter

- [ ] Interface `usesLiveApi()` si généralisée au-delà de WID
- [ ] Stub source (`stubSource.ts`) — usage tests / démo
- [ ] OECD WDD — état stub `oecdWddCountries.ts`

## Voir aussi

- [L5 — Adaptateurs](../L5-implementation/sources/)
- [Sélection source (L4)](../L4-fonctionnalites/interactions/selection-source.md)
