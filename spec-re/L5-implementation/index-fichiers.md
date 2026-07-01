# L5 — Index fichiers (cartographie complète)

## Contexte

- **L2** : [Couches](../../L2-architecture/couches.md)

Objectif : retrouver **chaque fichier** nécessaire à la reconstruction.

## `app/pages/`

| Fichier | Route |
|---------|-------|
| `index.vue` | `/` |
| `panneau/index.vue` | `/panneau` |
| `panneau/temps.vue` | `/panneau/temps` |
| `panneau/exploration.vue` | `/panneau/exploration` |
| `grille.vue` | `/grille` |
| `sources.vue` | `/sources` |
| `csv.vue` | `/csv` |
| `spec.vue` | `/spec` |

## `app/layouts/` & plugins

| Fichier | Rôle |
|---------|------|
| `layouts/default.vue` | Shell navigation |
| `plugins/vuetify.client.ts` | Vuetify |
| `plugins/application.client.ts` | Container DI |

## `app/components/`

| Fichier | Rôle |
|---------|------|
| `charts/EChart.vue` | Rendu vue-echarts |
| `charts/ProfileHelpButton.vue` | Aide contextuelle |
| `panneau/PanneauExploration.vue` | UI exploration |
| `panneau/PanneauSerieTemporelle.vue` | UI série 1 pays |
| `panneau/PanneauSerieTemporelleCompare.vue` | UI multi-pays |
| `panneau/PanneauFiltersShell.vue` | Coque filtres repliable |
| `panneau/PanneauDataSourceSection.vue` | Sélecteur source |
| `panneau/PanneauExplorationExtendedParams.vue` | Params avancés |
| `panneau/ParamAdjustmentHint.vue` | Hint ajustement WID |
| `panneau/WidParamAdjustmentToast.vue` | Toast ajustement |
| `panneau/PanneauBackLink.vue` | Retour hub |
| `panneau/PanneauAddTile.vue` | Tuile + grille |
| `panneau/PanneauGridCell.vue` | Cellule grille shared |
| `panneau/PanneauGridCellScoped.vue` | Cellule per-panel |
| `csv/CsvUploadCard.vue` | Upload CSV |
| `DataSourceLinksMenu.vue` | Menu liens sources |
| `ShareUrlButton.vue` | Copie URL |

## `app/composables/`

| Fichier | Rôle |
|---------|------|
| `useApplication.ts` | Container + useDataSources |
| `useExplorationPanel.ts` | État exploration |
| `useTimeSeriesPanel.ts` | État série 1 pays |
| `useTimeSeriesComparePanel.ts` | État comparaison |
| `usePanneauDataSource.ts` | Source partagée |
| `useCountriesProvider.ts` | Prefetch pays |
| `useWidParamConstraints.ts` | Contraintes WID |
| `useSpec.ts` | Page spec |
| `panneauTypes.ts` | Catalogue types |
| `panelBase.ts` | PanelScope helper |
| `panneauExplorationExtendedContext.ts` | Contexte params étendus |

## `app/visualization/`

Voir [visualization/README.md](visualization/README.md) — 14 modules.

## `lib/application/`

| Fichier | Rôle |
|---------|------|
| `bootstrap/container.ts` | Composition root |
| `bootstrap/csvAdapter.ts` | Export CSV factory |
| `bootstrap/specAdapter.ts` | Chargement spec markdown |
| `use-cases/ListCountriesUseCase.ts` | |
| `use-cases/ListAvailableParamsUseCase.ts` | |
| `use-cases/ListProfileYearsUseCase.ts` | |
| `use-cases/LoadProfileUseCase.ts` | |
| `use-cases/LoadTimeSeriesUseCase.ts` | |

## `lib/domain/`

| Dossier | Fichiers clés |
|---------|---------------|
| `entities/index.ts` | Tous types |
| `ports/DataSourcePort.ts` | Port |
| `services/` | percentiles, joinProfiles, widParamAvailability, paramMetadataStore |
| `catalog/` | widCodes, decileBundles, countryLabels, oecdDeciles, widCountryNames |

## `lib/infrastructure/`

| Dossier | Fichiers clés |
|---------|---------------|
| `data-sources/registry.ts` | Registry |
| `data-sources/wid/` | widSource, widClient, widApiKey, widErrors |
| `data-sources/oecd-idd/` | oecdIddSource, oecdIddClient, oecdIddCatalog, oecdDeciles, oecdIddCountries |
| `data-sources/worldbank/` | worldBankSource, worldBankPipClient, worldBankWdiClient, worldBankCatalog, worldBankDeciles, worldBankQuintiles, worldBankCountries |
| `data-sources/stub/stubSource.ts` | Stub tests |
| `data-sources/decileBundles.ts` | Labels infra bundles |
| `data-sources/oecd-wdd/oecdWddCountries.ts` | WIP |
| `cache/cache.ts` | Cache TTL |
| `http/fetchJson.ts` | HTTP helper |
| `csv/CsvReaderFactory.ts` | CSV |
| `spec/specDocs.ts`, `renderMarkdown.ts` | Page /spec |

## `test/`

Voir [tests.md](tests.md).

## À compléter

- [ ] Fichiers types (`app/types/application.d.ts`)
- [ ] Assets publics
- [ ] Workflows CI/CD
