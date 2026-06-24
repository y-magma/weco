# Structure de `webapp/` — architecture en couches

**Boîte à outils de visualisations** : application **Nuxt 4** (Vue 3 + Vuetify + ECharts)
en mode **SPA** (`ssr: false`). Elle interroge l'**API live WID.world** depuis le
navigateur (clé API requise).

## Architecture en 4 couches

```
Graphique (app/) → Application (lib/application/) → Domaine (lib/domain/) → Infrastructure (lib/infrastructure/)
```

| Couche | Dossier | Rôle |
|--------|---------|------|
| **Graphique** | `app/` | Pages, composants Vue, mappers ECharts (`app/visualization/`), composables minces |
| **Application** | `lib/application/` | Use cases, bootstrap (composition root) |
| **Domaine** | `lib/domain/` | Entités, services purs, catalogue WID, ports (`DataSourcePort`) |
| **Infrastructure** | `lib/infrastructure/` | HTTP, cache, adaptateur WID, CSV, chargement spec |

**Alias TypeScript** : `@application`, `@domain`, `@infrastructure` (`nuxt.config.ts` + `vitest.config.ts`).

```
webapp/
├── app/                              # Couche graphique
│   ├── pages/                        # Routes Nuxt
│   ├── layouts/
│   ├── components/
│   ├── composables/                  # Glue Vue ↔ use cases
│   ├── visualization/                # Mappers ECharts (ex-src/charts/)
│   ├── plugins/
│   │   ├── vuetify.client.ts
│   │   └── application.client.ts     # Injection du container applicatif
│   └── assets/
│
├── lib/
│   ├── application/
│   │   ├── use-cases/                # ListCountries, LoadProfile, LoadTimeSeries…
│   │   └── bootstrap/                # container, csvAdapter, specAdapter
│   ├── domain/
│   │   ├── entities/                 # PercentileProfile, DataSeries…
│   │   ├── services/                 # joinProfiles, percentiles
│   │   ├── catalog/                  # widCodes, indicators, countryLabels
│   │   └── ports/                    # DataSourcePort
│   └── infrastructure/
│       ├── http/
│       ├── cache/
│       ├── data-sources/wid/
│       ├── csv/
│       └── spec/
│
├── test/
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   └── visualization/
└── public/
```

---

## 1. Couche graphique — `app/`

### Pages (`app/pages/`)

| Fichier | Route | Description |
|---------|-------|-------------|
| `index.vue` | `/` | Accueil |
| `panneau/index.vue` | `/panneau` | Hub des types de panneau |
| `panneau/temps.vue` | `/panneau/temps` | Série temporelle |
| `panneau/exploration.vue` | `/panneau/exploration` | Profil d'inégalité et approximations |
| `grille.vue` | `/grille` | Grille multi-panneaux |
| `spec.vue` | `/spec` | Rendu Markdown de `spec/` |
| `sources.vue` | `/sources` | Statut des sources de données |
| `csv.vue` | `/csv` | Import CSV utilisateur |

### Composables (`app/composables/`)

| Fichier | Rôle |
|---------|------|
| `useApplication.ts` | Accès au container applicatif (`$application`) |
| `useExplorationPanel.ts` | État réactif panneau exploration → `LoadProfileUseCase` |
| `useTimeSeriesPanel.ts` | État réactif série → `LoadTimeSeriesUseCase` |
| `useTimeSeriesComparePanel.ts` | Comparaison multi-pays → `LoadTimeSeriesUseCase` |
| `useCountriesProvider.ts` | Pays partagés + prefetch métadonnées par source |
| `usePanneauDataSource.ts` | Sélection de source partagée entre panneaux |
| `useSpec.ts` | Page `/spec` via `specAdapter` |
| `panneauTypes.ts` | Catalogue des types de panneau |

Les composables **n'appellent jamais l'infrastructure directement** — uniquement les use cases.

### Visualization (`app/visualization/`)

| Fichier | Rôle |
|---------|------|
| `profile.ts` | `buildProfileOption()` — profil 127 g-percentiles |
| `timeSeries.ts` | `buildTimeSeriesOption()` |
| `scatterProfiles.ts` | `buildProfileScatterOption()` (legacy percentile join) |
| `drilldown.ts` | Drill-down hiérarchique |
| `axisFormat.ts` | Formatage axes compacts |
| `profileHelp.ts` | Textes d'aide contextuelle |

---

## 2. Couche application — `lib/application/`

| Use case | Rôle |
|----------|------|
| `ListCountriesUseCase` | Liste des pays pour une source |
| `ListProfileYearsUseCase` | Années disponibles pour un profil |
| `LoadProfileUseCase` | Profil 127 g-percentiles |
| `LoadTimeSeriesUseCase` | Séries temporelles par tranche de population |

Le **bootstrap** (`bootstrap/container.ts`) initialise le registre des sources et instancie les use cases. Plugin Nuxt : `app/plugins/application.client.ts`.

---

## 3. Couche domaine — `lib/domain/`

| Sous-dossier | Contenu |
|--------------|---------|
| `entities/` | Types métier (`PercentileProfile`, `DataSeries`, …) |
| `services/` | `joinProfiles`, `percentiles` (127 g-percentiles) |
| `catalog/` | Sémantique WID : `widCodes`, `indicators`, `countryLabels` |
| `ports/` | `DataSourcePort` — contrat unifié pour toutes les sources |

Code **100 % pur** (pas de Vue, pas de fetch, pas d'ECharts).

---

## 4. Couche infrastructure — `lib/infrastructure/`

| Sous-dossier | Contenu |
|--------------|---------|
| `http/` | `fetchJson`, `fetchText` |
| `cache/` | Cache mémoire TTL |
| `data-sources/wid/` | `WidClient`, `WidDataSource` |
| `data-sources/stub/` | `StubDataSource` (tests) |
| `data-sources/registry.ts` | Enregistrement des sources |
| `csv/` | `CsvReaderFactory` (PapaParse) |
| `spec/` | Chargement Markdown depuis `spec/` du dépôt |

`WidDataSource` implémente `DataSourcePort`.

---

## 5. Parcours de données (exemple profil)

```
panneau/exploration.vue
  useCountriesProvider() → panelCountries
  └─ PanneauExploration.vue
       └─ createExplorationPanelState()
            ├─ app.loadProfile.execute({ source })  ← use case
            │    └─ DataSourcePort.fetchPercentileProfile()  ← infra
            └─ buildTrapezoidProfileOption()        ← visualization (approximation)
       └─ EChart.vue
```

---

## 6. Tests

```bash
npm test
```

| Dossier | Cible |
|---------|-------|
| `test/domain/` | Services et catalogue |
| `test/application/` | Use cases |
| `test/infrastructure/` | Client WID |
| `test/visualization/` | Mappers ECharts |

---

## 7. Ajouter une source de données

1. Implémenter `DataSourcePort` (`lib/domain/ports/DataSourcePort.ts`)
2. Créer l'adaptateur sous `lib/infrastructure/data-sources/<nom>/`
3. Enregistrer dans `lib/infrastructure/data-sources/registry.ts`
4. Les use cases et composants graphiques restent **inchangés** si le mapping vers les entités domaine est compatible

---

## 8. Commandes

```bash
cd webapp
npm install
npm run dev          # http://localhost:3000
npm test
npm run lint
```
