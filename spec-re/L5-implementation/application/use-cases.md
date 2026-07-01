# L5 — Use cases application

## Contexte

- **L2** : [Flux](../../L2-architecture/flux-donnees.md)

## Container

`lib/application/bootstrap/container.ts`

```typescript
interface ApplicationContainer {
  listCountries: ListCountriesUseCase
  listAvailableParams: ListAvailableParamsUseCase
  listProfileYears: ListProfileYearsUseCase
  loadProfile: LoadProfileUseCase
  loadTimeSeries: LoadTimeSeriesUseCase
  getDefaultSource: () => DataSourcePort
  listDataSources: () => DataSourcePort[]
  paramMetadata: ParamMetadataStore
}
```

## Use cases

Tous suivent le pattern :

```typescript
class XxxUseCase {
  constructor(private readonly getSource: () => DataSourcePort) {}
  async execute(params, options?: { source?: DataSourcePort }) {
    const source = options?.source ?? this.getSource()
    return source.method(params)
  }
}
```

| Classe | Méthode port | Params |
|--------|--------------|--------|
| `ListCountriesUseCase` | `listCountries` | `ListCountriesParams?` |
| `ListAvailableParamsUseCase` | `listAvailableParams` | `ListAvailableParamsParams` |
| `ListProfileYearsUseCase` | `listProfileYears` | `ListProfileYearsParams` |
| `LoadProfileUseCase` | `fetchPercentileProfile` | `FetchProfileParams` |
| `LoadTimeSeriesUseCase` | `fetchVariableTimeSeries` | `FetchVariableTimeSeriesParams` |

## ParamMetadataStore

`lib/domain/services/paramMetadataStore.ts` — cache côté client des métadonnées WID (combos, années).

Infrastructure miroir : `lib/infrastructure/cache/paramMetadataStore.ts` si distinct — **vérifier à la rédaction**.

## Tests

`test/application/ListCountriesUseCase.spec.ts`

## Notes de reconstruction

Use cases = pass-through volontairement minces ; logique métier reste domaine + visualization.

Ne pas mettre de logique HTTP ici.
