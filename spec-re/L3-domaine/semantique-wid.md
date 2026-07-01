# L3 — Sémantique WID (variables & percentiles)

## Contexte

- **L3** : [Entités](entites.md)
- **L5** : `webapp/lib/domain/catalog/widCodes.ts`, `webapp/lib/domain/services/percentiles.ts`

## Sixlet (6 lettres)

Format : **1 lettre type de mesure** + **5 lettres concept** (ex. `ahweal` = moyenne de patrimoine net personnel).

### Préfixe → `MeasureKind`

| Préfixe | Kind | Exemple usage |
|---------|------|---------------|
| `a` | average | Profil moyen par tranche |
| `t` | threshold | Seuil de richesse/revenu au rang |
| `s` | share | Part de richesse/revenu |
| `g` | gini | Scalaire Gini |
| `l` | groupLevel | Niveau groupe |
| autre | other | — |

### Groupes conceptuels UI

| Groupe | `groupLabel` |
|--------|--------------|
| `wealth` | Patrimoine |
| `income` | Revenus |
| `carbon` | Carbone |

## Grille g-percentiles

- **127 percentiles** standards WID : codes `pXpY` (ex. `p50p51`).
- `buildGPercentiles()` génère la liste complète.
- `parsePercentileRank` / `parsePercentileUpper` — bornes intervalle.
- Gini : seul code `p0p100` (`WID_SCALAR_PERCENTILE`).

## Règles analytics distribution

- `supportsDistributionAnalytics(sixlet)` : true pour `average`, `threshold`, `groupLevel`.
- CDF / PDF / Lorenz : placement seuil-like ; PDF stricte selon kind.
- `thresholdVariableFor(concept)` — paire moyenne ↔ seuil pour même concept.

## Variables catalogue

`WID_PROFILE_VARIABLES` — liste `WidVariable` avec sixlet, label, unit, group, concept, kind.

`WID_STRICT_DISTRIBUTION_VARIABLES` — sous-ensemble pour certaines vues.

## Defaults WID

- `WID_DEFAULT_AGE`, `WID_DEFAULT_POP` — valeurs initiales UI.

## Paramètres age / pop

Disponibilité par pays+variable via API → `buildParamAvailability` → résolution `resolveWidParams`.

→ L4 : [contraintes-parametres-wid](../L4-fonctionnalites/interactions/contraintes-parametres-wid.md)

## À compléter

- [ ] Table exhaustive des sixlets du catalogue avec unités
- [ ] Sémantique codes `age` et `pop` WID
- [ ] Règles `profilePercentilesFor` et `expectedProfilePointCount` par variable

## Voir aussi

- [Transformations](transformations.md)
- [L5 — wid](../L5-implementation/sources/wid.md)
