# Structure de `webapp/` — où trouver quoi

Application **Nuxt 4** (Vue 3 + Vuetify + ECharts) qui visualise les données
**WID.world**. Les données sont lues **localement** depuis le dump WID
(`WID_data_<ZONE>.csv`) via des routes serveur Nitro — aucune API externe ni
clé n'est utilisée.

## Vue d'ensemble en une phrase

- Le **code de l'app** (UI, pages, état) est dans `app/`.
- La **logique métier réutilisable** (graphes, sources de données, types) est dans `src/`.
- L'**accès aux fichiers CSV locaux** se fait via `server/` (routes Nitro).
- Les **données brutes** sont dans `data/WID_DATA` (un symlink vers le dump).

```
webapp/
├── app/            # Code de l'application Nuxt (ce que voit l'utilisateur)
│   ├── app.vue              # Racine de l'app
│   ├── layouts/             # Gabarits (barre de nav, structure de page)
│   ├── pages/               # Une page = une route (/profil, /nuage, …)
│   ├── components/          # Composants Vue réutilisables (graphe, upload CSV)
│   ├── composables/         # Logique d'état par page (useXxx)
│   ├── plugins/             # Plugins Nuxt (Vuetify)
│   └── assets/              # Styles globaux (SCSS)
│
├── src/            # Logique métier pure, indépendante de Vue (testable)
│   ├── charts/              # Construction des options ECharts
│   ├── data-sources/        # Accès et modélisation des données (WID, cache…)
│   ├── domain/              # Types + transformations métier
│   ├── csv/                 # Lecture de fichiers CSV (import utilisateur)
│   ├── http/                # Helper fetch (JSON / texte)
│   ├── hypotheses/          # Définition de l'hypothèse « stress »
│   └── spec/                # Chargement de la spec Markdown pour la page /spec
│
├── server/         # Backend Nitro : lit les CSV WID locaux
│   ├── api/wid/             # Endpoints HTTP /api/wid/*
│   └── utils/               # Lecture/filtre des CSV en streaming
│
├── data/           # Données
│   └── WID_DATA  ->  symlink vers le dump WID complet
│
├── test/           # Tests unitaires (Vitest)
├── public/         # Fichiers statiques servis tels quels (favicon, robots.txt)
├── nuxt.config.ts  # Config Nuxt (runtimeConfig, modules, prerender…)
├── package.json    # Dépendances + scripts npm
├── tsconfig.json   # Config TypeScript
├── vitest.config.ts# Config des tests
└── eslint.config.mjs
```

---

## 1. `app/` — l'interface (Nuxt)

### `app/pages/` — les écrans (routing automatique)

Chaque fichier `.vue` devient une route accessible dans la barre de navigation.

| Fichier | Route | Rôle |
|---|---|---|
| `index.vue` | `/` | Page d'accueil. |
| `profil.vue` | `/profil` | **Page principale** : profil des 127 g-percentiles (barres / ligne / nuage), zoom plage de valeurs, drill-down sur le haut de la distribution, tableau de données. Affiché « Boîte à outils de visus » dans le menu. |
| `nuage.vue` | `/nuage` | Nuage de points croisant 2 variables WID, jointes par percentile. |
| `panneaux.vue` | `/panneaux` | Multi-panneaux : plusieurs profils en parallèle (pays/année/âge/pop partagés). |
| `dashboard.vue` | `/dashboard` | Tableau de bord de l'hypothèse inégalités ↔ stress (série temporelle + nuage). Le proxy « stress » reste synthétique. |
| `sources.vue` | `/sources` | État des sources de données enregistrées. |
| `csv.vue` | `/csv` | Import et aperçu d'un CSV fourni par l'utilisateur. |
| `spec.vue` | `/spec` | Rendu de la spécification (`spec/**/*.md` du dépôt). |

### `app/composables/` — l'état et la logique de chaque page

Hooks Vue (`useXxx`) qui orchestrent : filtres, appel aux sources de données,
construction des options de graphe. **C'est ici qu'on branche une page sur les
données.**

| Fichier | Utilisé par | Rôle |
|---|---|---|
| `useWidProfile.ts` | `profil.vue` | État du profil : pays/variable/année/âge/pop, type de graphe, échelles log, zoom valeur, drill-down, tableau. |
| `useWidScatter.ts` | `nuage.vue` | Charge 2 profils et les joint par percentile. |
| `useWidPanels.ts` | `panneaux.vue` | Charge N profils en parallèle. |
| `useDashboard.ts` | `dashboard.vue` | Séries temporelles + distribution + nuage de l'hypothèse. |
| `useDataSources.ts` | toutes | Initialise et fournit la source de données par défaut (WID). |
| `useSpec.ts` | `spec.vue` | Fournit les blocs de spec à afficher. |

### `app/components/` — composants réutilisables

| Fichier | Rôle |
|---|---|
| `charts/EChart.vue` | Wrapper générique ECharts (rend une `EChartsOption`, émet `chart-click`). |
| `charts/ProfileHelpButton.vue` | Bouton d'aide contextuelle sur le profil. |
| `csv/CsvUploadCard.vue` | Carte d'upload/aperçu pour la page CSV. |

### `app/layouts/default.vue`

Gabarit commun : **barre de navigation** (la liste `navItems` définit le menu),
app-bar et pied de page.

### `app/plugins/vuetify.client.ts`

Initialise Vuetify (thème, composants) côté client.

### `app/assets/main.scss`

Styles globaux.

---

## 2. `src/` — la logique métier (sans Vue, testée)

### `src/data-sources/` — d'où viennent les données

| Fichier | Rôle |
|---|---|
| `Source.ts` | Interface `DataSource` que toute source doit implémenter. |
| `registry.ts` | Enregistre / récupère les sources disponibles. |
| `cache.ts` | Cache mémoire des résultats (clé = id + params). |
| `errors.ts` | Erreurs typées des sources. |
| `wid/widSource.ts` | **Source WID** : implémente `fetchPercentileProfile`, `fetchSeries`, `listCountries`. Appelle le client local ; repli sur données d'exemple si fichier/série manquant. |
| `wid/widLocalClient.ts` | Client qui appelle les routes serveur `/api/wid/*` (lecture du dump local). |
| `wid/widClient.ts` | Ancien client de l'API HTTP WID (conservé, plus utilisé par l'app — encore couvert par un test). |
| `wid/percentiles.ts` | Construit/parse les **127 g-percentiles** (`buildGPercentiles`, `parsePercentileRank`…). |
| `wid/widCodes.ts` | Variables/âges/populations WID + libellés (`ahweal`, `thweal`…). |
| `wid/indicators.ts` | Listes d'indicateurs et de pays par défaut. |
| `wid/sampleData.ts` | Génère des données synthétiques (repli hors-ligne). |

> **Pour changer la façon dont l'app obtient les données**, c'est dans
> `wid/widSource.ts` + `wid/widLocalClient.ts`.

### `src/charts/` — comment les graphes sont construits

Fonctions pures qui produisent des `EChartsOption`.

| Fichier | Rôle |
|---|---|
| `profile.ts` | Profil par percentile (barres/ligne/nuage), zoom dual-axe, échelles log, densité. |
| `drilldown.ts` | Logique de drill-down hiérarchique sur le haut de la distribution + agrégats. |
| `scatterProfiles.ts` | Nuage de 2 profils joints par percentile. |
| `scatter.ts` | Nuage générique (dashboard). |
| `timeSeries.ts` | Série temporelle (dashboard). |
| `distribution.ts` | Histogramme/distribution (dashboard). |
| `profileHelp.ts` | Textes d'aide du profil. |

### `src/domain/` — types et transformations

| Fichier | Rôle |
|---|---|
| `types.ts` | **Types centraux** : `PercentilePoint`, `PercentileProfile`, `DataSeries`, params de fetch… À lire en premier pour comprendre les structures de données. |
| `joinProfiles.ts` | Jointure de 2 profils par percentile (pour le nuage). |
| `panels.ts` | Helpers de mise en page des multi-panneaux. |

### Autres dossiers `src/`

| Dossier | Rôle |
|---|---|
| `csv/CsvReaderFactory.ts` | Lecture CSV (fichier / chaîne / URL) via PapaParse, + `mapCsvToSeries`. |
| `http/fetchJson.ts` | `fetchJson` / `fetchText` avec timeout + retries. |
| `hypotheses/` | Définition de l'hypothèse « inégalités ↔ stress » (`stressHypothesis.ts`) et ses types. |
| `spec/` | `specDocs.ts` charge `spec/**/*.md` à la compilation ; `renderMarkdown.ts` rend le Markdown. |

---

## 3. `server/` — lecture des CSV WID locaux (Nitro)

Tourne côté Node : c'est ce qui permet de lire les gros fichiers sur disque.

| Fichier | Endpoint | Rôle |
|---|---|---|
| `api/wid/profile.get.ts` | `GET /api/wid/profile` | 127 g-percentiles pour `country/variable/age/pop/year`. |
| `api/wid/series.get.ts` | `GET /api/wid/series` | Série temporelle d'un `(variable, percentile)`. |
| `api/wid/countries.get.ts` | `GET /api/wid/countries` | Liste des zones présentes dans le dump. |
| `utils/widCsv.ts` | — | Lecture/filtre **en streaming** des CSV (résolution du dossier, `WID_data_<ZONE>.csv`, set des 127 codes). |

> **Pour modifier les filtres / le format lu dans les CSV**, c'est dans
> `server/utils/widCsv.ts`.

---

## 4. `data/` — les données brutes

```
data/WID_DATA  ->  /home/.../Stage_gscop/wid_all_data   (symlink)
```

Un CSV par zone, séparateur `;`, colonnes :
`country;variable;percentile;year;value;age;pop`.
La colonne `variable` encode `<sixlet><pop><age>` (ex. `ahwealj992`).

Le dossier lu est configurable via la variable d'env **`WID_DATA_DIR`**
(défaut : `data/WID_DATA`), définie dans `nuxt.config.ts → runtimeConfig.widDataDir`.

---

## 5. Configuration et tests

| Fichier | Rôle |
|---|---|
| `nuxt.config.ts` | Config Nuxt : `ssr: false` (SPA), modules, `runtimeConfig.widDataDir`, routes prérendues. |
| `package.json` | Scripts : `dev`, `build`, `preview`, `generate`, `test`, `lint`. |
| `tsconfig.json` | Alias `@src` → `./src`. |
| `vitest.config.ts` | Config des tests unitaires. |
| `test/*.spec.ts` | Tests des fonctions pures de `src/` (percentiles, profil, drill-down, jointures…). |

### Lancer l'app

```bash
npm run dev          # serveur de dev (lit les CSV à la volée)
# ou
npm run build && npm run preview
```

> ⚠️ Comme les données sont lues sur disque à chaque requête, il faut un serveur
> Node. Un export 100 % statique (`nuxt generate`) ne servirait pas les routes
> `/api/wid/*`.

---

## Parcours type d'une donnée (page Profil)

```
profil.vue
  └─ useWidProfile.ts            (état + filtres)
       └─ widSource.fetchPercentileProfile()      [src/data-sources/wid]
            └─ widLocalClient.fetchProfile()       (fetch /api/wid/profile)
                 └─ server/api/wid/profile.get.ts
                      └─ server/utils/widCsv.ts → lit data/WID_DATA/WID_data_FR.csv
  └─ buildProfileOption()        [src/charts/profile.ts]  → option ECharts
  └─ EChart.vue                  (rendu)
```
