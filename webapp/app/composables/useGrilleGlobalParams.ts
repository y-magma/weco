import type { ComputedRef, Ref } from 'vue'

const GRILLE_GLOBAL_PARAMS_KEY = Symbol('grilleGlobalParams')

export interface GrilleGlobalParamRefs {
  countryCode: Ref<string | null>
  variable: Ref<string | null>
  year: Ref<number | null>
  age: Ref<string | null>
  pop: Ref<string | null>
}

/** Valeurs appliquées aux panneaux (via le bouton Appliquer). */
export type GrilleGlobalOverrides = GrilleGlobalParamRefs

export interface GrilleGlobalParamsContext extends GrilleGlobalOverrides {
  draft: GrilleGlobalParamRefs
  applyVersion: Ref<number>
  activeCount: ComputedRef<number>
  hasPendingChanges: ComputedRef<boolean>
  apply: () => void
  resetAll: () => void
}

function createParamRefs(): GrilleGlobalParamRefs {
  return {
    countryCode: ref<string | null>(null),
    variable: ref<string | null>(null),
    year: ref<number | null>(null),
    age: ref<string | null>(null),
    pop: ref<string | null>(null),
  }
}

function copyParams(from: GrilleGlobalParamRefs, to: GrilleGlobalParamRefs) {
  to.countryCode.value = from.countryCode.value
  to.variable.value = from.variable.value
  to.year.value = from.year.value
  to.age.value = from.age.value
  to.pop.value = from.pop.value
}

function countActive(refs: GrilleGlobalParamRefs): number {
  return ([refs.countryCode, refs.variable, refs.year, refs.age, refs.pop] as Ref<unknown>[])
    .filter((r) => r.value !== null).length
}

function paramsEqual(a: GrilleGlobalParamRefs, b: GrilleGlobalParamRefs): boolean {
  return a.countryCode.value === b.countryCode.value
    && a.variable.value === b.variable.value
    && a.year.value === b.year.value
    && a.age.value === b.age.value
    && a.pop.value === b.pop.value
}

/** À appeler dans la page grille.vue pour initialiser le contexte global. */
export function useGrilleGlobalParamsProvider(): GrilleGlobalParamsContext {
  const draft = createParamRefs()
  const applied = createParamRefs()
  const applyVersion = ref(0)

  const context: GrilleGlobalParamsContext = {
    ...applied,
    draft,
    applyVersion,
    activeCount: computed(() => countActive(applied)),
    hasPendingChanges: computed(() => !paramsEqual(draft, applied)),
    apply() {
      copyParams(draft, applied)
      applyVersion.value++
    },
    resetAll() {
      for (const refs of [draft, applied]) {
        refs.countryCode.value = null
        refs.variable.value = null
        refs.year.value = null
        refs.age.value = null
        refs.pop.value = null
      }
      applyVersion.value++
    },
  }

  provide(GRILLE_GLOBAL_PARAMS_KEY, context)

  return context
}

export interface GrilleGlobalParamsConsumer extends GrilleGlobalOverrides {
  applyVersion: Ref<number>
}

/** Contexte complet pour le panneau de réglages globaux (brouillon + appliquer). */
export function useGrilleGlobalParamsPanelContext(): GrilleGlobalParamsContext {
  const ctx = inject<GrilleGlobalParamsContext | null>(GRILLE_GLOBAL_PARAMS_KEY, null)
  if (!ctx) {
    throw new Error('useGrilleGlobalParamsPanelContext doit être utilisé sous useGrilleGlobalParamsProvider')
  }
  return ctx
}

/** À appeler dans les composants enfants (panneaux) pour lire les overrides appliqués. */
export function useGrilleGlobalParamsConsumer(): GrilleGlobalParamsConsumer | null {
  const ctx = inject<GrilleGlobalParamsContext | null>(GRILLE_GLOBAL_PARAMS_KEY, null)
  if (!ctx) return null
  return {
    countryCode: ctx.countryCode,
    variable: ctx.variable,
    year: ctx.year,
    age: ctx.age,
    pop: ctx.pop,
    applyVersion: ctx.applyVersion,
  }
}
