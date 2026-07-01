# L2 — Architecture en couches

## Contexte

- **L0** : [Principes directeurs](../L0-vision/intention.md#principes-directeurs)
- **L5** : [Index fichiers](../L5-implementation/index-fichiers.md), [Stack](../L5-implementation/stack-et-config.md)

## Schéma

```
┌─────────────────────────────────────────────────────────┐
│  app/          Pages, composants Vue, composables       │
│                app/visualization/ → options ECharts     │
└──────────────────────────┬──────────────────────────────┘
                           │ use cases via useApplication()
┌──────────────────────────▼──────────────────────────────┐
│  lib/application/   Use cases, bootstrap (container)    │
└──────────────────────────┬──────────────────────────────┘
                           │ DataSourcePort
┌──────────────────────────▼──────────────────────────────┐
│  lib/domain/        Entités, services purs, catalogues  │
└──────────────────────────┬──────────────────────────────┘
                           │ implémentations
┌──────────────────────────▼──────────────────────────────┐
│  lib/infrastructure/  HTTP, cache, adaptateurs, CSV     │
└─────────────────────────────────────────────────────────┘
```

## Règles de dépendance

| Couche | Peut importer | Ne doit pas importer |
|--------|---------------|----------------------|
| `app/` | `@application`, `@domain`, `~/visualization`, composables | `@infrastructure` directement (sauf cas CSV page isolé) |
| `lib/application/` | `@domain`, `@infrastructure` (registry) | `app/`, Vue |
| `lib/domain/` | — (pur TypeScript) | `app/`, `@application`, `@infrastructure` |
| `lib/infrastructure/` | `@domain` | `app/`, Vue |

## Alias TypeScript

| Alias | Chemin |
|-------|--------|
| `@application` | `webapp/lib/application/` |
| `@domain` | `webapp/lib/domain/` |
| `@infrastructure` | `webapp/lib/infrastructure/` |
| `~/` | `webapp/app/` (convention Nuxt) |

## Composition root

- Plugin Nuxt `app/plugins/application.client.ts` injecte `$application`.
- Composable `useApplication()` expose le container.
- Container : `lib/application/bootstrap/container.ts` — singleton lazy.

## Use cases exposés

| Use case | Méthode domaine |
|----------|-----------------|
| `ListCountriesUseCase` | `source.listCountries` |
| `ListAvailableParamsUseCase` | `source.listAvailableParams` |
| `ListProfileYearsUseCase` | `source.listProfileYears` |
| `LoadProfileUseCase` | `source.fetchPercentileProfile` |
| `LoadTimeSeriesUseCase` | `source.fetchVariableTimeSeries` |

+ `ParamMetadataStore` (cache client métadonnées WID).

## Dossiers `app/` clés

| Dossier | Rôle |
|---------|------|
| `pages/` | Routes Nuxt (file-based routing) |
| `layouts/` | Shell Vuetify (`default.vue`) |
| `components/` | UI réutilisable (panneau, charts, csv) |
| `composables/` | État réactif panneaux → use cases |
| `visualization/` | Pure functions → `EChartsOption` |
| `plugins/` | Vuetify, injection application |

## Dossiers `lib/` clés

| Dossier | Rôle |
|---------|------|
| `domain/entities/` | Types partagés |
| `domain/ports/` | `DataSourcePort` |
| `domain/services/` | Logique métier sans I/O |
| `domain/catalog/` | WID codes, bundles, labels pays |
| `infrastructure/data-sources/` | Adaptateurs WID, OECD, World Bank |
| `infrastructure/cache/` | Cache mémoire TTL |
| `infrastructure/http/` | `fetchJson` |
| `infrastructure/csv/` | Lecture CSV |

## Tests

`webapp/test/` miroir partiel : `domain/`, `application/`, `infrastructure/`, `visualization/`.

→ [L5/tests](../L5-implementation/tests.md)

## À compléter

- [ ] Diagramme de séquence pour un chargement profil complet
- [ ] Liste des exceptions à la règle « pas d'infra dans composables »

## Voir aussi

- [Flux de données](flux-donnees.md)
- [Extensibilité](extensibilite.md)
