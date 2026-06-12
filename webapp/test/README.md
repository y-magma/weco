# Tests unitaires

Tests [Vitest](https://vitest.dev/) sur la **logique pure** de la couche données
WID et des constructeurs de graphes (Version 1). Aucune dépendance réseau,
navigateur ou composant Vue : uniquement des fonctions déterministes.

## Lancer les tests

```bash
npm test              # exécution unique (~117 tests, CI), hors conformité live
npm run test:watch    # mode watch
npm run test:conformance  # API vs dump CSV (clé + dump requis)
```

Configuration : `vitest.config.ts` (environnement `node`, alias `@src` aligné
sur `nuxt.config.ts`, pool `threads`).

## Couverture par fichier

### `percentiles.spec.ts` — tri et génération des g-percentiles
Cible : `src/data-sources/wid/percentiles.ts`.

### `widCodes.spec.ts` — sémantique des variables WID
Cible : `src/data-sources/wid/widCodes.ts`.

### `widClient.spec.ts` — parsing de la réponse API live
Cible : `parseProfileResponse` (`src/data-sources/wid/widClient.ts`).

### `profileChart.spec.ts` — option ECharts du profil
Cible : `buildProfileOption` et helpers (`src/charts/profile.ts`).

### `profileHelp.spec.ts` — textes d'aide contextuels
Cible : `buildActiveCalculationHelp` (`src/charts/profileHelp.ts`).

### `drilldown.spec.ts` — zoom hiérarchique sur la queue
Cible : `src/charts/drilldown.ts`.

### `axisFormat.spec.ts` — formatage compact des axes
Cible : `formatCompactAxisValue` (`src/charts/axisFormat.ts`).

### `timeSeries.spec.ts` — série temporelle (mono / multi-pays, log)
Cible : `buildTimeSeriesOption` (`src/charts/timeSeries.ts`).

### `scatterProfiles.spec.ts` — nuage 2 variables
Cible : `buildProfileScatterOption` (`src/charts/scatterProfiles.ts`).

### `joinProfiles.spec.ts` — jointure de profils pour le nuage
Cible : `joinProfilesByPercentile` (`src/domain/joinProfiles.ts`).

### `countryLabels.spec.ts` — libellés pays
Cible : `src/data-sources/wid/countryLabels.ts`.

### `conformance.spec.ts` — comparaison profils API vs CSV (unitaire)
Cible : `compareProfiles`, `compareProfilesStrict` (`src/data-sources/wid/conformance.ts`).

### `widConformance.spec.ts` — conformité live (API + dump)
Cible : intégration API ↔ CSV. Exclu de `npm test` ; lancer via `npm run test:conformance`.

### `widApiKey.spec.ts` — en-tête clé API
Cible : `buildWidApiKeyHeader` (`src/data-sources/wid/widApiKey.ts`).

## Conventions

- Un fichier `*.spec.ts` par module testé, dans `test/`.
- Tester des **fonctions pures** ; extraire la logique hors des classes/composants
  quand c'est nécessaire (cf. `parseProfileResponse`).
- Pas d'appel réseau dans la suite par défaut : les réponses API sont simulées
  par des *fixtures* ; la conformité live est isolée dans `widConformance.spec.ts`.
