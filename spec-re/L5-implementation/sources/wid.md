# L5 — Adaptateur WID.world

## Contexte

- **L1** : [Sources — WID](../../L1-produit/sources-utilisateur.md#widworld-défaut)
- **L3** : [Sémantique WID](../../L3-domaine/semantique-wid.md)
- **L4** : [Contraintes paramètres WID](../../L4-fonctionnalites/interactions/contraintes-parametres-wid.md)

## Fichiers

| Rôle | Chemin |
|------|--------|
| Port impl | `lib/infrastructure/data-sources/wid/widSource.ts` |
| Client HTTP | `lib/infrastructure/data-sources/wid/widClient.ts` |
| Clé API header | `lib/infrastructure/data-sources/wid/widApiKey.ts` |
| Erreurs | `lib/infrastructure/data-sources/wid/widErrors.ts` |
| Catalogue | `lib/domain/catalog/widCodes.ts` |

## Identité

- `id`: `wid`
- `capabilities`: `{ percentileProfile: true, timeSeries: true, scatter: true }`
- `indicators`: dérivés de `WID_PROFILE_VARIABLES`

## Configuration

- `baseUrl` default : `https://rfap9nitz6.execute-api.eu-west-1.amazonaws.com/prod`
- Header API : `buildWidApiKeyHeader(apiKey)` — hex depuis package R `wid`
- Sans clé : `WID_NO_API_KEY_ERROR`, client non instancié

## Endpoints (client)

| Opération | Méthode client | Notes |
|-----------|----------------|-------|
| Pays | `listCountries` / countries probe | variable sonde default `ahweal` |
| Profil | fetch profile percentiles | codes `buildVariableCode`, chunking requêtes |
| Série | fetch time series | percentile bracket ex. `p50p51` |
| Années profil | probe percentiles | `profileYearProbePercentiles` |
| Combos age/pop | metadata API | → `buildParamAvailability` |

## Parsing profil

- `parseProfileResponse(response, year)` — pure, testée
- Forme nested : `{ "<sixlet>_<pct>_<age>_<pop>": [ { "<country>": { values: [[y,v]] } } ] }`
- Sortie : `WidProfileRow[]` → mappé `PercentileProfile`

## Cache

- Clés via `dataSourceCache.buildKey('wid', operation, params)`
- TTL : `CACHE_TTL_METADATA_MS`, `CACHE_TTL_YEARS_MS`

## Erreurs utilisateur

| Code / message | Cause |
|----------------|-------|
| `WID_NO_API_KEY_ERROR` | Clé absente |
| `WID_EMPTY_COUNTRIES_ERROR` | Liste pays vide |
| `widEmptyProfileError` | Réponse sans données |

## Tests

| Fichier | Couverture |
|---------|------------|
| `widClient.spec.ts` | parseProfileResponse, séries |
| `widApiKey.spec.ts` | Header |
| `widCodes.spec.ts` | Catalogue domaine |

## À compléter

- [ ] Liste exacte routes API (paths relatifs baseUrl)
- [ ] Taille chunks percentiles
- [ ] Mapping complet `WidDataSource.fetchPercentileProfile` ligne par ligne

## Notes de reconstruction

1. `parseProfileResponse` + tests avec fixtures JSON.
2. `WidClient` mock fetch.
3. `WidDataSource` + cache + status.
4. Brancher `LoadProfileUseCase` dans UI minimale.
