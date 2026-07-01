# Structure de `webapp/` — architecture en couches

**Boîte à outils de visualisations** : application **Nuxt 4** (Vue 3 + Vuetify + ECharts)
en mode **SPA** (`ssr: false`). Elle interroge les sources de données depuis le
navigateur (WID.world, OECD IDD, World Bank ; clé API WID requise pour WID).

## Architecture en 4 couches

```
Graphique (app/) → Application (lib/application/) → Domaine (lib/domain/) → Infrastructure (lib/infrastructure/)
```

| Couche | Dossier | Rôle |
|--------|---------|------|
| **Graphique** | `app/` | Pages, composants Vue, mappers ECharts (`app/visualization/`), composables minces |
| **Application** | `lib/application/` | Use cases, partage d'URL, bootstrap (composition root) |
| **Domaine** | `lib/domain/` | Entités, services purs, catalogues (WID, déciles, pays), ports (`DataSourcePort`) |
| **Infrastructure** | `lib/infrastructure/` | HTTP, cache, adaptateurs sources, CSV, chargement spec |

**Alias TypeScript** : `@application`, `@domain`, `@infrastructure` (`nuxt.config.ts` + `vitest.config.ts`).

```
webapp/
├── app/                              # Couche graphique
│   ├── pages/                        # Routes Nuxt
│   ├── layouts/
│   ├── components/
│   ├── composables/                  # Glue Vue ↔ use cases
│   ├── visualization/                # Mappers ECharts
│   ├── plugins/
│   │   ├── vuetify.client.ts
│   │   └── application.client.ts     # Injection du container applicatif
│   └── assets/
│
├── lib/
│   ├── application/
│   │   ├── use-cases/                # ListCountries, LoadProfile, LoadTimeSeries…
│   │   ├── share/                    # shareCodec, panelSnapshots
│   │   └── bootstrap/                # container, csvAdapter, specAdapter
│   ├── domain/
│   │   ├── entities/                 # PercentileProfile, DataSeries… (index.ts)
│   │   ├── services/                 # percentiles, widParamAvailability, paramMetadataStore
│   │   ├── catalog/                  # widCodes, decileBundles, oecdDeciles, countryLabels
│   │   └── ports/                    # DataSourcePort
│   └── infrastructure/
│       ├── http/
│       ├── cache/
│       ├── data-sources/
│       │   ├── wid/
│       │   ├── oecd-idd/
│       │   ├── worldbank/
│       │   ├── stub/
│       │   └── registry.ts
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
| `useWidParamConstraints.ts` | Contraintes age/pop/owner selon métadonnées WID |
| `useShareableUrl.ts` | Sérialisation / restauration d'état dans l'URL |
| `timeSeriesPanelShared.ts` | Contexte partagé entre `useTimeSeriesPanel` et `useTimeSeriesComparePanel` |
| `useGrilleGlobalParams.ts` | Paramètres globaux de la grille |
| `useSpec.ts` | Page `/spec` via `specAdapter` |
| `panelBase.ts` | `PanelScope` — chargement pays/erreur partagé (exploration + séries) |
| `panneauTypes.ts` | Catalogue des types de panneau |

Les composables **n'appellent jamais l'infrastructure directement** — uniquement les use cases.

### Visualization (`app/visualization/`)

| Fichier | Rôle |
|---------|------|
| `profile.ts` | `buildProfileOption()` — profil 127 g-percentiles |
| `trapezoidChart.ts` | Trapèzes / rectangles sur le profil |
| `trapezoidApproximation.ts` | Approximation trapèzoïdale |
| `timeSeries.ts` | `buildTimeSeriesOption()` |
| `timeSeriesPartition.ts` | Partition temporelle par tranches |
| `timeSeriesHelp.ts` | Textes d'aide série temporelle |
| `drilldown.ts` | Drill-down hiérarchique |
| `populationPartition.ts` | Agrégation par tranches de population |
| `empiricalDistributionSmooth.ts` | Lissage CDF/PDF empirique |
| `axisScale.ts` | Échelles linéaire / log / symlog |
| `axisFormat.ts` | Formatage axes compacts |
| `symlogScale.ts` | Échelle symlog |
| `profileHelp.ts` | Textes d'aide contextuelle |

---

## 2. Couche application — `lib/application/`

| Use case | Rôle |
|----------|------|
| `ListCountriesUseCase` | Liste des pays pour une source |
| `ListAvailableParamsUseCase` | Paramètres disponibles (age, pop, owner…) |
| `ListProfileYearsUseCase` | Années disponibles pour un profil |
| `LoadProfileUseCase` | Profil 127 g-percentiles |
| `LoadTimeSeriesUseCase` | Séries temporelles par tranche de population |

Le **bootstrap** (`bootstrap/container.ts`) initialise le registre des sources et instancie les use cases. Plugin Nuxt : `app/plugins/application.client.ts`.

---

## 3. Couche domaine — `lib/domain/`

| Sous-dossier | Contenu |
|--------------|---------|
| `entities/` | Types métier (`PercentileProfile`, `DataSeries`, …) |
| `services/` | `percentiles` (127 g-percentiles), `widParamAvailability`, `paramMetadataStore` |
| `panelState.ts` | Types d'état panneau partagés (couches graphique, snapshots URL) |
| `catalog/` | Sémantique WID, bundles déciles (PIP, OECD, WDI), labels pays |
| `ports/` | `DataSourcePort` — contrat unifié pour toutes les sources |

Code **100 % pur** (pas de Vue, pas de fetch, pas d'ECharts).

---

## 4. Couche infrastructure — `lib/infrastructure/`

| Sous-dossier | Contenu |
|--------------|---------|
| `http/` | `fetchJson`, `fetchText` |
| `cache/` | Cache mémoire TTL |
| `data-sources/wid/` | `WidClient`, `WidDataSource` |
| `data-sources/oecd-idd/` | `OecdIddDataSource`, client SDMX CSV |
| `data-sources/worldbank/` | `WorldBankDataSource` (PIP + WDI) |
| `data-sources/stub/` | `StubDataSource` (tests) |
| `data-sources/registry.ts` | Enregistrement des sources |
| `csv/` | `CsvReaderFactory` (PapaParse) |
| `spec/` | Chargement Markdown depuis `spec/` du dépôt |

Chaque adaptateur implémente `DataSourcePort`.

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
npm run lint
npm run typecheck
```

| Dossier | Cible |
|---------|-------|
| `test/domain/` | Services et catalogue |
| `test/application/` | Use cases, partage d'URL |
| `test/infrastructure/` | Adaptateurs sources, registre |
| `test/visualization/` | Mappers ECharts |

Voir [`test/README.md`](./test/README.md) pour le détail des 30 suites.

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
npm run typecheck
npm run check        # lint + typecheck + test
```
