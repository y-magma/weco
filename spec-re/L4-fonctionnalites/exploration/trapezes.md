# L4 — Exploration : approximations trapézoïdales

## Contexte

- **L3** : [Transformations — trapezoid](../../L3-domaine/transformations.md)
- **L5** : `trapezoidApproximation.ts`, `trapezoidChart.ts`

## Statut

Implémenté — **À compléter** (formules mathématiques détaillées)

## Comportement

### Méthodes (`TrapezoidMethod`)

| Valeur | Libellé UI | Principe |
|--------|------------|----------|
| `zero` | Zéro | y₀ = 0 |
| `anchor` | Ancrage début | y₀ = valeur au rang minimal |
| `leastSquares` | Moindres carrés | y₀ optimal MCQ |
| `minOscillation` | — | variante anti-oscillation |

### Partition population

Modes : `all`, `step10`, `step25`, `custom` — voir `populationPartition.ts`.

Recalcul nœuds à chaque changement partition ou méthode.

### Rendu

- `buildOriginalProfileOption` — courbe originale.
- `buildTrapezoidProfileOption` — trapèzes superposés + moyennes par intervalle.

## À compléter

- [ ] Équations `buildMeanPreservingNodes`, `buildAlternatingCoefficients`
- [ ] Critères `evaluateApproximation`
- [ ] UI choix méthode + hints (`TRAPEZOID_METHOD_OPTIONS`)

## Voir aussi (L5)

Tests : `trapezoidApproximation.spec.ts`, `trapezoidChart.spec.ts`, `populationPartition.spec.ts`

## Notes de reconstruction

1. `computeIntervalMeans` pur.
2. `buildMeanPreservingNodes` par méthode.
3. Mappers ECharts séparés du calcul numérique.
