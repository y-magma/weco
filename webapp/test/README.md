# Tests unitaires

Tests [Vitest](https://vitest.dev/) sur la **logique pure** de la couche données
WID et des constructeurs de graphes (Version 1). Aucune dépendance réseau,
navigateur ou composant Vue : uniquement des fonctions déterministes.

## Lancer les tests

```bash
npm test          # exécution unique (CI)
npm run test:watch  # mode watch
```

Configuration : `vitest.config.ts` (environnement `node`, alias `@src` aligné
sur `nuxt.config.ts`, pool `threads`).

## Couverture par fichier

### `percentiles.spec.ts` — tri et génération des g-percentiles
Cible : `src/data-sources/wid/percentiles.ts`.

| Cas | Vérifie |
| --- | --- |
| `parsePercentileRank` | borne basse d'un code `pXXpYY`, décimales de la queue (`p99.9p99.91`), code mono-borne, `NaN` si invalide |
| `parsePercentileUpper` | borne haute, repli sur la borne basse pour un code mono-borne |
| `sortPercentileCodes` | **tri par rang numérique, jamais alphabétique** ; n'altère pas l'entrée |
| `buildGPercentiles` | exactement **127** codes, de `p0p1` à `p99.999p100`, strictement croissant, bornes de zoom présentes, sans doublon |

### `widCodes.spec.ts` — sémantique des variables WID
Cible : `src/data-sources/wid/widCodes.ts`.

| Cas | Vérifie |
| --- | --- |
| `measureKind` | 1ʳᵉ lettre → `average` (a), `threshold` (t), `other` ; insensible à la casse |
| `buildVariableCode` | construction `sixlet_percentile_age_pop` |
| `findWidVariable` | retrouve une variable connue / `undefined` sinon |
| `WID_V1_VARIABLES` | chaque concept a une paire average + threshold ; `sixlet` cohérent avec `kind` |

### `sampleData.spec.ts` — génération du profil d'exemple
Cible : `src/data-sources/wid/sampleData.ts`.

| Cas | Vérifie |
| --- | --- |
| structure | 127 points triés par rang, flag `sample = true`, métadonnées (pays, variable, année, kind, unité) |
| réalisme | **patrimoine net négatif en bas** de distribution, croissance vers le haut |
| sensibilité | les valeurs varient selon l'**année** et le **pays** |
| seuil | une variable `t…` produit `kind = threshold` |

### `widClient.spec.ts` — parsing de la réponse API live
Cible : `parseProfileResponse` (fonction pure exportée de `src/data-sources/wid/widClient.ts`).

| Cas | Vérifie |
| --- | --- |
| extraction | 1 ligne par centile pour l'année demandée, valeurs correctes |
| rang | rang parsé depuis le code complet `sixlet_percentile_age_pop` |
| sélection d'année | années manquantes ignorées, filtrage sur l'année cible |
| robustesse | réponse vide / `null` → `[]` ; valeurs non-numériques ou non-finies écartées |

### `profileChart.spec.ts` — option ECharts du profil
Cible : `buildProfileOption` et `rankTopLogCoordinate` (`src/charts/profile.ts`).

| Cas | Vérifie |
| --- | --- |
| axe X linéaire | abscisses = rang % triées ; trous `null` conservés |
| axe Y | `value` (linéaire) par défaut, `log` si `logScaleY` |
| **garde-fou ≤ 0** | sur axe log Y, les valeurs ≤ 0 deviennent des trous (ne cassent pas le graphe) |
| type / unité | type de série respecté (bar/scatter/line) ; unité affichée sur l'axe Y |
| `rankFromTopLogCoordinate` | inverse log → rang % ; `formatRankAxisLabel` affiche le rang réel sur les graduations |
| **log X** | points placés en log₁₀(100−rang), graduations en rang % ; garde-fou ≤ 0 sur l'axe valeur |
| **densité population** | axes inversés (X = valeur, Y = part de population) ; logs routés vers l'axe affiché |
| **densité probabilité** | dérivée ΔF/Δx de la CDF entre tranches consécutives ; Y = densité empirique |

### `joinProfiles.spec.ts` — jointure de deux profils par percentile
Cible : `joinProfilesByPercentile` (`src/domain/joinProfiles.ts`).

| Cas | Vérifie |
| --- | --- |
| jointure | 1 point par percentile partagé (x = var1, y = var2) |
| intersection | ne garde que les percentiles présents dans les **deux** profils |
| valeurs manquantes | écarte tout percentile avec une valeur `null` d'un côté |
| ordre | résultat trié par rang |

### `scatterProfiles.spec.ts` — option ECharts du nuage 2 variables
Cible : `buildProfileScatterOption` (`src/charts/scatterProfiles.ts`).

| Cas | Vérifie |
| --- | --- |
| données | valeurs `[x, y, rang]`, percentile en `name` |
| axes | linéaires par défaut, `log` par axe sur demande |
| **garde-fou log X / log Y** | retire les valeurs ≤ 0 de l'axe concerné |
| labels | noms d'axes corrects |

### `panels.spec.ts` — helpers du multi-panneaux
Cible : `src/domain/panels.ts`.

| Cas | Vérifie |
| --- | --- |
| `clampPanelCount` | bornage [1, 4], arrondi, `NaN` → min |
| `panelColSpan` | nombre de panneaux → colonnes Vuetify (1→12, 2→6, 3→4, 4→6), bornage |
| `defaultPanelVariables` | variables distinctes, cyclage si trop de panneaux, chaînes vides si aucune variable |
| `resizePanelVariables` | préserve les choix en agrandissant, tronque en réduisant, borne le compte |

## Conventions

- Un fichier `*.spec.ts` par module testé, dans `test/`.
- Tester des **fonctions pures** ; extraire la logique hors des classes/composants
  quand c'est nécessaire (cf. `parseProfileResponse`).
- Pas d'appel réseau : les réponses API sont simulées par des *fixtures*.
