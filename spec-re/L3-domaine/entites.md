# L3 — Entités domaine

## Contexte

- **L2** : [Flux](../L2-architecture/flux-donnees.md)
- **L5** : `webapp/lib/domain/entities/index.ts`

## Modèle unifié

Toutes les sources projettent leurs réponses vers ces types avant la couche visualization.

### `SeriesPoint` / `DataSeries`

```typescript
interface SeriesPoint { year: number; value: number }

interface DataSeries {
  id: string
  label: string
  unit?: string
  points: SeriesPoint[]
  metadata?: Record<string, string | number | boolean>
}
```

Usage : séries temporelles, CSV import, indicateurs scalaires WDI.

### `PercentilePoint` / `PercentileProfile`

```typescript
interface PercentilePoint {
  percentile: string   // ex. "p90p91"
  rank: number         // borne basse en % pour tri
  value: number | null  // null = trou explicite, pas d'interpolation cachée
}

interface PercentileProfile {
  id: string
  country: string
  variable: string     // sixlet WID ou id bundle
  year: number
  age: string
  pop: string
  label: string
  unit?: string
  kind: MeasureKind
  points: PercentilePoint[]
  sample: boolean      // false = live API
}
```

### Paramètres de requête

| Type | Champs |
|------|--------|
| `FetchProfileParams` | `countryCode`, `variable`, `year`, `age`, `pop` |
| `ListProfileYearsParams` | idem sans `year` |
| `FetchVariableTimeSeriesParams` | + `percentile?`, `yearFrom?`, `yearTo?` |
| `ListCountriesParams` | `variable` (sonde WID) |
| `ListAvailableParamsParams` | `countryCode`, `variable` |

### Métadonnées UI

| Type | Rôle |
|------|------|
| `CountryOption` | `{ code, label }` |
| `SourceIndicator` | id, label, unit, group, kind, concept |
| `ParamAvailabilityEntity` | combos `{ age, pop }`, listes distinctes |
| `ParamComboEntity` | `{ age, pop }` |

## Invariants métier

- Points profil **ordonnés par `rank` croissant**.
- **`value: null`** conservé à l’affichage (trous visibles).
- **`kind`** dérivé du préfixe sixlet — pilote échelles et analytics (voir [semantique-wid](semantique-wid.md)).
- Gini WID : un seul point `p0p100`.

## Mapping source → entité

| Source | Profil | Série |
|--------|--------|-------|
| WID | 127 `PercentilePoint` | `DataSeries` par percentile/tranche |
| World Bank PIP | 10 points décile (rangs mid) | PIP / WDI APIs |
| World Bank WDI | 5 quintiles | WDI |
| OECD | throw profil centile | `DataSeries` par indicateur |

→ L5 fiches sources pour détail parsing.

## À compléter

- [ ] Exemples JSON complets par source (fixtures reconstruction)
- [ ] Règles `id` et `label` générés par adaptateur
- [ ] Champs `metadata` utilisés en UI

## Voir aussi

- [Sémantique WID](semantique-wid.md)
- [Bundles déciles](bundles-deciles.md)
