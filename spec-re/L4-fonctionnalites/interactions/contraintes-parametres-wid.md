# L4 — Contraintes paramètres WID

## Contexte

- **L3** : [Sémantique WID](../../L3-domaine/semantique-wid.md)
- **L5** : `widParamAvailability.ts`, `useWidParamConstraints.ts`

## Statut

Implémenté — **À compléter**

## Comportement

- Au changement pays/variable : fetch combos age/pop, années.
- `resolveWidParams` : clamp ou reset invalides (`variableChange` vs `clamp`).
- UI : `ParamAdjustmentHint`, `WidParamAdjustmentToast` — messages `describeYearAdjustment`, `describeCodeAdjustment`.

## À compléter

- [ ] Table transitions état → action
- [ ] Prefetch `ParamMetadataStore`
- [ ] Interaction avec grille multi-panneaux

## Voir aussi (L5)

Test : `widParamAvailability.spec.ts`, `paramMetadataStore.spec.ts`
