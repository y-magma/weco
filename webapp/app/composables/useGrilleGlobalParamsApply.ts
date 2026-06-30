import type { Ref } from 'vue'
import type { GrilleGlobalParamsConsumer } from '~/composables/useGrilleGlobalParams'

export interface GrilleGlobalApplyTargets {
  countryCode?: Ref<string>
  countryCodes?: Ref<string[]>
  variable?: Ref<string>
  year?: Ref<number>
  age?: Ref<string>
  pop?: Ref<string>
}

/** Applique les paramètres globaux de la grille aux refs locales d'un panneau. */
export function useGrilleGlobalParamsApply(
  overrides: GrilleGlobalParamsConsumer,
  targets: GrilleGlobalApplyTargets,
) {
  function applyFromGlobal() {
    const country = overrides.countryCode.value
    if (country !== null) {
      if (targets.countryCode) targets.countryCode.value = country
      if (targets.countryCodes) targets.countryCodes.value = [country]
    }
    if (overrides.variable.value !== null && targets.variable) {
      targets.variable.value = overrides.variable.value
    }
    if (overrides.year.value !== null && targets.year) {
      targets.year.value = overrides.year.value
    }
    if (overrides.age.value !== null && targets.age) {
      targets.age.value = overrides.age.value
    }
    if (overrides.pop.value !== null && targets.pop) {
      targets.pop.value = overrides.pop.value
    }
  }

  watch(() => overrides.applyVersion.value, applyFromGlobal)

  onMounted(() => {
    if (overrides.applyVersion.value > 0) {
      applyFromGlobal()
    }
  })
}
