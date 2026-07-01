# L5 — Composables Vue

## Contexte

- **L2** : [Flux](../../L2-architecture/flux-donnees.md)
- **L4** : comportement panneaux

## Index

| Composable | Rôle | Use cases / deps |
|------------|------|------------------|
| `useApplication` | Accès `$application` | plugin |
| `useDataSources` | `sources`, `defaultSource` computed | registry |
| `usePanneauDataSourceProvider` | provide `sourceId` | Symbol key |
| `usePanneauDataSource` | inject source, `selectedSource` | |
| `useCountriesProvider` | prefetch pays, error | `ListCountriesUseCase` |
| `useWidParamConstraints` | resolve params WID | `ListAvailableParams`, `ListProfileYears` |
| `useExplorationPanel` | **État complet exploration** | LoadProfile, visualization/* |
| `useTimeSeriesPanel` | État série 1 pays | LoadTimeSeries |
| `useTimeSeriesComparePanel` | Multi-pays | LoadTimeSeries |
| `useSpec` | Chargement markdown spec | specAdapter |
| `panelBase` | `PanelScope`, helpers année | |
| `panneauExplorationExtendedContext` | provide/inject params étendus | |

## panneauTypes

```typescript
type PanneauType = 'temps' | 'temps-compare' | 'exploration'
const PANNEAU_TYPES: PanneauTypeMeta[]
const EXPLORATION_DISABLED_SOURCE_IDS = ['oecd-idd']
```

## Pattern composable panneau

1. `useApplication()` + `usePanneauDataSource()`.
2. Refs filtres (pays, variable, year…).
3. `watch` / `watchEffect` → fetch use case.
4. `computed chartOption` → `build*Option`.
5. Expose `{ chartOption, loading, error, … }` au composant.

## Fichier critique

`useExplorationPanel.ts` (~740 lignes) — **priorité rédaction L4/L5** : decouper doc par section (profil, trapèze, drill, scales).

## À compléter

- [ ] Liste exacte refs/computed exportés par composable
- [ ] Watchers et debounce
- [ ] Partage état grille vs standalone

## Notes de reconstruction

Extraire `createTimeSeriesPanelState` pattern factory pour tests unitaires sans mount Vue (si applicable).

Commencer par composables temps (plus petits) avant exploration.
