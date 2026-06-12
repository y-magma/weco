# Structure de `webapp/` — carte de l'application

**Boîte à outils de visualisations** : application **Nuxt 4** (Vue 3 + Vuetify + ECharts)
en mode **SPA** (`ssr: false`). Elle interroge l'**API live WID.world** depuis le
navigateur (clé API requise). Un dump CSV local sert uniquement aux **tests de
conformité** API ↔ export bulk, pas au fonctionnement de l'app.

## Séparation des responsabilités

| Zone | Rôle | Dépend de Vue ? |
|------|------|-----------------|
| `app/` | Interface : pages, composants, état réactif, navigation | Oui |
| `src/` | Logique métier pure : graphes, accès données, types | Non (testable Vitest) |
| `test/` | Tests unitaires sur `src/` | Non |
| `scripts/` | Outils CLI (conformité, comparaison CSV/API) | Non |
| `public/` | Fichiers statiques servis tels quels | — |

L'alias TypeScript **`@src`** (`nuxt.config.ts` + `tsconfig.json`) pointe vers `./src`.
Les composables Nuxt importent `@src/...` ; les pages/composants aussi.

```
webapp/
├── app/                      # Couche présentation (Nuxt)
│   ├── app.vue               # Racine Vue (<NuxtLayout> + <NuxtPage>)
│   ├── assets/main.scss      # Styles globaux
│   ├── layouts/default.vue   # Shell : drawer, app-bar, footer
│   ├── pages/                # 1 fichier = 1 route (file-based routing)
│   ├── components/           # Composants auto-importés (pathPrefix: false)
│   ├── composables/          # Hooks partagés (useXxx, createXxx)
│   └── plugins/vuetify.client.ts
│
├── src/                      # Logique métier (sans Vue)
│   ├── charts/               # Options ECharts (fonctions pures)
│   ├── data-sources/         # Interface DataSource + adaptateur WID
│   ├── domain/               # Types TypeScript partagés
│   ├── csv/                  # Lecture CSV utilisateur (PapaParse)
│   ├── http/                 # fetchJson / fetchText
│   └── spec/                 # Chargement spec Markdown (page /spec)
│
├── test/                     # Vitest (*.spec.ts)
├── scripts/                  # wid-conformance.mjs, wid-compare.mjs
├── data/WID_DATA             # Symlink dump CSV (tests conformité)
├── public/                   # robots.txt, favicon…
├── nuxt.config.ts
├── package.json
├── vitest.config.ts
├── tsconfig.json
└── eslint.config.mjs
```

---

## 1. `app/` — l'interface web

### 1.1 Pages (`app/pages/`)

Nuxt génère les routes automatiquement à partir du nom de fichier.

| Fichier | Route | Description |
|---------|-------|-------------|
| `index.vue` | `/` | Accueil : liens vers panneau, grille, spec |
| `panneau/index.vue` | `/panneau` | **Hub** — choix entre 3 types de boîtes à outils |
| `panneau/population.vue` | `/panneau/population` | Profil WID sur les 127 g-percentiles |
| `panneau/temps.vue` | `/panneau/temps` | Série temporelle (variable × année) |
| `panneau/variables.vue` | `/panneau/variables` | Nuage de 2 variables joint par percentile |
| `grille.vue` | `/grille` | Grille 2 colonnes : N panneaux de types mixtes |
| `spec.vue` | `/spec` | Rendu Markdown de `spec/**/*.md` (dépôt parent) |
| `sources.vue` | `/sources` | Statut des sources de données enregistrées |
| `csv.vue` | `/csv` | Import et aperçu d'un CSV utilisateur |

**Redirections** (`nuxt.config.ts` → `routeRules`) :

| Ancienne route | Cible |
|----------------|-------|
| `/profil` | `/panneau/population` |
| `/panneau-visualisation` | `/panneau` |
| `/nuage` | `/panneau/variables` |
| `/grille-visus`, `/grille-visualisations` | `/grille` |

Routes prérendues (déploiement statique) : voir `nitro.prerender.routes` dans
`nuxt.config.ts`.

### 1.2 Layout (`app/layouts/default.vue`)

Gabarit commun à toutes les pages :

- **Drawer** : menu (`navItems`) — Home, Panneau, Grille, Spec, Sources, CSV
- **App bar** : titre « Boîte à outils de visualisations », lien WID.world
- **`<slot />`** : contenu de la page courante

### 1.3 Composables (`app/composables/`)

| Fichier | Rôle |
|---------|------|
| `useDataSources.ts` | Initialise le registre WID (clé API depuis `runtimeConfig`), expose `defaultSource` |
| `useWidProfile.ts` | **`createWidProfileState()`** — profil sur g-percentiles : filtres, drill-down, option ECharts |
| `useWidSeries.ts` | **`createWidSeriesState()`** — série temporelle : variable × année à percentile fixé |
| `useWidScatter.ts` | **`createWidScatterState()`** — nuage 2 variables joint par percentile |
| `panneauTypes.ts` | Catalogue des 3 types de panneau (id, icône, titre, route) |
| `useSpec.ts` | Blocs Markdown pour `/spec` |

Les fonctions `createWid*State()` sont instanciées **une fois par panneau**
(pages dédiées ou chaque cellule de `/grille`). La liste des pays peut être
**partagée** via `provide('widCountries', …)` pour éviter N appels parallèles à
`listCountries()`.

### 1.4 Composants (`app/components/`)

Organisés par dossier ; Nuxt les auto-importe sans préfixe de chemin.

#### `components/panneau/`

| Fichier | Rôle |
|---------|------|
| `PanneauVisualisation.vue` | Profil population : filtres, réglages, drill-down, graphe ECharts |
| `PanneauSerieTemporelle.vue` | Série temporelle : pays, variable, percentile, échelle log |
| `PanneauNuageVariables.vue` | Nuage 2 variables : pays, année, variables X/Y, échelles log |
| `PanneauFiltersShell.vue` | Enveloppe repliable des filtres (grille) : titre du type + chevron |
| `PanneauAddTile.vue` | Tuile « + » ; dialogue modal pour choisir le type de panneau |
| `PanneauBackLink.vue` | Lien retour vers `/panneau` (sous-pages dédiées) |

Dans la **grille**, chaque panneau reçoit `collapsible`, `:panel-type`, et
`:default-filters-expanded="false"` : la zone de filtres est repliée par défaut
et affiche le type (ex. « Série temporelle ») dans l'en-tête.

#### `components/charts/`

| Fichier | Rôle |
|---------|------|
| `EChart.vue` | Wrapper `vue-echarts` : reçoit une `EChartsOption`, émet `chart-click` |
| `ProfileHelpButton.vue` | Bouton d'aide contextuelle (textes depuis `src/charts/profileHelp.ts`) |

#### `components/csv/`

| Fichier | Rôle |
|---------|------|
| `CsvUploadCard.vue` | Upload fichier, aperçu colonnes, construction série temporelle |

### 1.5 Plugin Vuetify

`plugins/vuetify.client.ts` — thème et composants Vuetify, chargé côté client
uniquement (suffixe `.client.ts`).

---

## 2. `src/` — logique métier

Code **indépendant de Vue**, testé par Vitest. C'est ici que vivent les
transformations de données et la construction des graphes.

### 2.1 `src/domain/`

| Fichier | Rôle |
|---------|------|
| `types.ts` | Types centraux : `PercentileProfile`, `DataSeries`, `CountryOption`, paramètres de fetch |
| `joinProfiles.ts` | Jointure de 2 profils par percentile → points pour le nuage (`ProfileScatterPoint`) |

### 2.2 `src/data-sources/` — accès aux données

```
data-sources/
├── Source.ts          # Interface DataSource
├── registry.ts        # Enregistrement / liste des sources
├── cache.ts           # Cache mémoire (clé = source + opération + params)
└── wid/
    ├── widSource.ts       # WidDataSource : profils, séries, pays
    ├── widClient.ts       # Client HTTP API WID (countries-variables, …)
    ├── widLocalCsv.ts     # Lecture dump CSV (tests conformité)
    ├── conformance.ts     # Comparaison profils API vs CSV
    ├── percentiles.ts     # 127 g-percentiles : buildGPercentiles, parsePercentileRank
    ├── widCodes.ts        # Variables WID (sixlet, âge, pop), libellés V1
    ├── indicators.ts      # Métadonnées indicateurs pour fetchSeries
    ├── countryLabels.ts   # Libellés pays affichés dans l'UI
    ├── widCountryNames.ts # Table de noms pays
    ├── widApiKey.ts       # En-tête clé API
    └── widErrors.ts       # Messages d'erreur WID
```

**Méthodes clés de `WidDataSource`** :

| Méthode | Usage |
|---------|-------|
| `fetchPercentileProfile()` | Profil 127 g-percentiles (panneau population) |
| `fetchVariableTimeSeries()` | Série temporelle à percentile fixé (panneau temps) |
| `listProfileYears()` | Années disponibles pour une variable |
| `listCountries()` | Liste des pays |
| `fetchSeries()` | Séries indicateurs agrégés (indicateurs `indicators.ts`) |

**Flux live** : `WidDataSource` → `WidClient` → API AWS WID (`NUXT_PUBLIC_WID_API_KEY`).

Sans clé API valide, les pages affichent une erreur explicite (pas de données synthétiques).

### 2.3 `src/charts/` — construction ECharts

| Fichier | Rôle |
|---------|------|
| `profile.ts` | **`buildProfileOption()`** — profil 127 g-percentiles : barres/ligne/nuage, log, densités, Lorenz, zoom |
| `scatterProfiles.ts` | **`buildProfileScatterOption()`** — nuage 2 variables, visualMap rang, axes compacts |
| `timeSeries.ts` | **`buildTimeSeriesOption()`** — courbe temporelle, axes compacts, option log |
| `drilldown.ts` | Drill-down hiérarchique sur le haut de la distribution |
| `axisFormat.ts` | **`formatCompactAxisValue()`** — libellés WID : 1000, 10k, 1M, 1B… |
| `profileHelp.ts` | Textes d'aide selon les options actives du profil |

### 2.4 Autres modules `src/`

| Dossier | Rôle |
|---------|------|
| `csv/CsvReaderFactory.ts` | `createCsvReader()` (file/string/url) + `mapCsvToSeries()` |
| `http/fetchJson.ts` | `fetchJson` / `fetchText` avec timeout |
| `spec/specDocs.ts` | Liste des fichiers `spec/**/*.md` à la compilation |
| `spec/renderMarkdown.ts` | Rendu Markdown (`marked`) |

---

## 3. Parcours de données

### 3.1 Panneau population (`/panneau/population`, type `population` en grille)

```
panneau/population.vue
  │  provide('widCountries')
  └─ PanneauVisualisation.vue
       └─ createWidProfileState({ countries })
            ├─ widSource.fetchPercentileProfile()
            └─ buildProfileOption(profile, opts)
       └─ EChart.vue
```

### 3.2 Série temporelle (`/panneau/temps`, type `temps` en grille)

```
panneau/temps.vue
  │  provide('widCountries')
  └─ PanneauSerieTemporelle.vue
       └─ createWidSeriesState({ countries })
            ├─ widSource.fetchVariableTimeSeries()
            └─ buildTimeSeriesOption([series], title, { logScaleY })
       └─ EChart.vue
```

### 3.3 Nuage 2 variables (`/panneau/variables`, type `variables` en grille)

```
panneau/variables.vue
  │  provide('widCountries')
  └─ PanneauNuageVariables.vue
       └─ createWidScatterState({ countries })
            ├─ widSource.fetchPercentileProfile() × 2 (var X, var Y)
            ├─ joinProfilesByPercentile(xProfile, yProfile)
            └─ buildProfileScatterOption(points, { xLabel, yLabel, logScaleX, logScaleY })
       └─ EChart.vue
```

### 3.4 Grille (`/grille`)

```
grille.vue
  │  provide('widCountries')
  ├─ PanneauSerieTemporelle | PanneauNuageVariables | PanneauVisualisation
  │    (selon panel.type : temps | variables | population)
  │    collapsible + PanneauFiltersShell
  └─ PanneauAddTile → dialogue → addPanel(type)
```

---

## 4. Configuration

| Fichier | Contenu clé |
|---------|-------------|
| `nuxt.config.ts` | SPA, alias `@src`, clé API WID (`runtimeConfig.public`), prerender, redirections, Vuetify |
| `.env.example` | `NUXT_PUBLIC_WID_API_KEY`, `NUXT_PUBLIC_WID_API_BASE_URL`, `WID_REFERENCE_DATA_DIR` |
| `vitest.config.ts` | Tests Node, alias `@src` aligné sur Nuxt |

### Variables d'environnement

| Variable | Usage |
|----------|-------|
| `NUXT_PUBLIC_WID_API_KEY` | **Obligatoire** en dev/prod pour les données live |
| `NUXT_PUBLIC_WID_API_BASE_URL` | Endpoint API (défaut : prod AWS) |
| `WID_REFERENCE_DATA_DIR` | Dossier `WID_data_*.csv` — **tests conformité uniquement** |

---

## 5. Tests et scripts

```bash
npm test                 # Vitest — logique pure (hors conformité live)
npm run test:conformance # API vs dump CSV (réseau + clé + dump)
npm run wid:conformance  # Rapport CLI conformité
npm run wid:compare      # Comparaison percentile par percentile
```

| Fichier de test | Cible |
|-----------------|-------|
| `percentiles.spec.ts` | Génération et tri des g-percentiles |
| `widCodes.spec.ts` | Sémantique des variables WID |
| `widClient.spec.ts` | Parsing réponses API |
| `profileChart.spec.ts` | `buildProfileOption` |
| `scatterProfiles.spec.ts` | `buildProfileScatterOption` |
| `axisFormat.spec.ts` | `formatCompactAxisValue` |
| `profileHelp.spec.ts` | Textes d'aide contextuels |
| `drilldown.spec.ts` | Zoom hiérarchique |
| `countryLabels.spec.ts` | Libellés pays |
| `conformance.spec.ts` | Comparaison profils API vs CSV (unitaire) |
| `widApiKey.spec.ts` | En-tête clé API |
| `widConformance.spec.ts` | Intégration live (exclu de `npm test`) |

Détail par suite : [`test/README.md`](./test/README.md).

---

## 6. Commandes de développement

```bash
cd webapp
npm install
npm run dev          # http://localhost:3000
npm run build        # build production
npm run preview      # prévisualiser le build
npm run generate     # export statique → .output/public
npm run lint         # ESLint
```

---

## 7. Ajouter une source de données

1. Implémenter `DataSource` (`src/data-sources/Source.ts`)
2. Créer l'adaptateur sous `src/data-sources/<nom>/`
3. Enregistrer dans `src/data-sources/registry.ts`
4. Brancher un composable ou une page sur la nouvelle source

## 8. Ajouter un type de panneau

1. Ajouter une entrée dans `app/composables/panneauTypes.ts`
2. Créer le composable `createWid*State()` et le composant `Panneau*.vue`
3. Ajouter une page sous `app/pages/panneau/` et la route dans `nitro.prerender.routes`
4. Brancher le type dans `grille.vue` et le dialogue de `PanneauAddTile.vue`
5. Ajouter un `build*Option()` dans `src/charts/` et les tests Vitest associés
