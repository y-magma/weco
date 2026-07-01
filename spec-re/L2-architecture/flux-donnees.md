# L2 — Flux de données

## Contexte

- **L2** : [Couches](couches.md)
- **L3** : [Entités](../L3-domaine/entites.md)
- **L5** : [Use cases](../L5-implementation/application/use-cases.md), [Composables](../L5-implementation/ui/composables.md)

## Flux générique (panneau avec source externe)

```
Page Vue
  → Composable (état refs, computed chartOption)
    → useApplication().loadProfile / loadTimeSeries / listCountries …
      → UseCase.execute(params, { source? })
        → DataSourcePort (adaptateur)
          → HTTP / cache / parsing
        ← Entité domaine (PercentileProfile | DataSeries | …)
      ←
    → build*Option() dans app/visualization/
  ← EChart.vue (:option="chartOption")
```

## Flux A — Profil exploration (WID)

1. Utilisateur change pays / variable / year / age / pop.
2. `useExplorationPanel` (ou équivalent grille) appelle contraintes WID si besoin (`useWidParamConstraints`).
3. `LoadProfileUseCase.execute({ countryCode, variable, year, age, pop })`.
4. `WidDataSource.fetchPercentileProfile` → `WidClient` → API WID.
5. Retour `PercentileProfile` avec `points[]` ordonnés par rang.
6. Composable dérive options trapèze / profil / Lorenz via `buildProfileOption`, etc.
7. `EChart` rend l’option.

## Flux B — Série temporelle

1. Sélection pays, variable, tranches (partition).
2. Pour chaque tranche : `LoadTimeSeriesUseCase` avec `percentile` ou bundle décile.
3. Agrégation en `CountryTrancheSeries[]` dans composable.
4. `buildTimeSeriesOption` ou `buildStackedShareTimeSeriesOption`.

## Flux C — Liste pays (prefetch)

1. `useCountriesProvider` au mount panneau / grille.
2. `ListCountriesUseCase` avec variable sonde (WID) ou liste statique (OECD).
3. Résultat partagé via `provide/inject` entre panneaux d’une même page.

## Flux D — Métadonnées paramètres WID

1. Changement pays ou variable → `ListAvailableParamsUseCase`, `ListProfileYearsUseCase`.
2. `ParamMetadataStore` mémorise combos age/pop et années.
3. `resolveWidParams` ajuste sélection invalides + hints UI.

## Flux E — CSV (hors use cases)

```
CsvUploadCard
  → createCsvReader / mapCsvToSeries (csvAdapter)
  → DataSeries locale
  → buildTimeSeriesOption
  → EChart preview
```

## Cache

Couche infrastructure : clés par `(sourceId, operation, params)` avec TTL distinct metadata vs séries.

→ L5 : `@infrastructure/cache/cache.ts`

## Gestion d’erreurs

- Sources mettent à jour `lastError` dans `getStatus()`.
- Composables exposent `error` ref → affichage Vuetify (alert / toast).
- WID sans clé : erreur immédiate `WID_NO_API_KEY_ERROR`.

## À compléter

- [ ] Diagramme séquence Mermaid par flux A–E
- [ ] Invalidation cache lors changement source
- [ ] Concurrence requêtes (annulation si param change vite)

## Voir aussi

- [Sélection source (L4)](../L4-fonctionnalites/interactions/selection-source.md)
- [Contraintes paramètres WID (L4)](../L4-fonctionnalites/interactions/contraintes-parametres-wid.md)
