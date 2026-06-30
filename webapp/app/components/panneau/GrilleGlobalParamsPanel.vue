<script setup lang="ts">
import type { CountryOption } from '@domain/entities'
import { WID_AGE_OPTIONS, WID_POP_OPTIONS } from '@domain/catalog/widCodes'
import { useGrilleGlobalParamsPanelContext } from '~/composables/useGrilleGlobalParams'

const {
  draft,
  activeCount,
  hasPendingChanges,
  apply,
  resetAll,
  countryCode: appliedCountryCode,
  variable: appliedVariable,
  year: appliedYear,
  age: appliedAge,
  pop: appliedPop,
} = useGrilleGlobalParamsPanelContext()

const { countryCode, variable, year, age, pop } = draft

const countries = inject<Ref<CountryOption[]>>('panelCountries', ref([]))
const { selectedSource } = usePanneauDataSource()

const indicators = computed(() => selectedSource.value.indicators ?? [])
const hasPercentileProfile = computed(() => selectedSource.value.capabilities?.percentileProfile === true)

const expanded = ref(false)

const countryItems = computed(() =>
  countries.value.map((item) => ({ title: item.label, value: item.code })),
)

const YEAR_OPTIONS = Array.from({ length: 2024 - 1960 + 1 }, (_, i) => 2024 - i)

const ageItems = computed(() =>
  WID_AGE_OPTIONS.map((item) => ({ title: item.label, value: item.value })),
)

const popItems = computed(() =>
  WID_POP_OPTIONS.map((item) => ({ title: item.label, value: item.value })),
)

const labelByParam: Record<string, string> = {
  countryCode: 'Pays',
  variable: 'Variable',
  year: 'Année',
  age: 'Âge',
  pop: 'Population',
}

const activeLabels = computed(() =>
  Object.entries({
    countryCode: appliedCountryCode.value,
    variable: appliedVariable.value,
    year: appliedYear.value,
    age: appliedAge.value,
    pop: appliedPop.value,
  })
    .filter(([, v]) => v !== null)
    .map(([k]) => labelByParam[k] ?? k),
)
</script>

<template>
  <v-card variant="outlined" class="grille-global-params-panel">
    <div
      class="grille-global-params-panel__header d-flex align-center ga-2 pa-3"
      :class="{ 'grille-global-params-panel__header--clickable': true }"
      @click="expanded = !expanded"
    >
      <v-icon icon="mdi-tune" size="small" color="primary" />
      <span class="text-subtitle-2 font-weight-medium">Paramètres globaux</span>

      <v-btn
        variant="tonal"
        size="x-small"
        color="primary"
        prepend-icon="mdi-check"
        :disabled="!hasPendingChanges"
        @click.stop="apply"
      >
        Appliquer
      </v-btn>

      <v-badge
        v-if="activeCount > 0"
        :content="activeCount"
        color="primary"
        inline
      />

      <div v-if="activeCount > 0" class="d-flex flex-wrap ga-1 ms-1">
        <v-chip
          v-for="label in activeLabels"
          :key="label"
          size="x-small"
          variant="tonal"
          color="primary"
        >
          {{ label }}
        </v-chip>
      </div>

      <v-spacer />

      <v-btn
        v-if="activeCount > 0"
        variant="text"
        size="x-small"
        prepend-icon="mdi-restore"
        @click.stop="resetAll"
      >
        Réinitialiser
      </v-btn>

      <v-btn
        :icon="expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
        variant="text"
        size="small"
        :aria-label="expanded ? 'Replier les paramètres globaux' : 'Déplier les paramètres globaux'"
        @click.stop="expanded = !expanded"
      />
    </div>

    <v-expand-transition>
      <div v-if="expanded" class="grille-global-params-panel__body pa-3 pt-0">
        <v-divider class="mb-3" />

        <p class="text-body-2 text-medium-emphasis mb-3">
          Réglez les valeurs puis cliquez sur <strong>Appliquer</strong> pour les propager à tous les panneaux.
          Effacer un champ (×) supprime la surcharge globale pour ce paramètre.
        </p>

        <v-row dense>
          <v-col cols="12" sm="6" md="3">
            <v-autocomplete
              v-model="countryCode"
              :items="countryItems"
              item-title="title"
              item-value="value"
              label="Pays"
              prepend-inner-icon="mdi-earth"
              placeholder="Tous les panneaux…"
              clearable
              auto-select-first
              density="compact"
              hide-details
            />
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="variable"
              :items="indicators"
              item-title="label"
              item-value="id"
              group-by="groupLabel"
              label="Variable"
              placeholder="Tous les panneaux…"
              clearable
              density="compact"
              hide-details
            />
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="year"
              :items="YEAR_OPTIONS"
              label="Année"
              placeholder="Tous les panneaux…"
              clearable
              density="compact"
              hide-details
              hint="S'applique aux panneaux « Profil d'inégalité »"
              persistent-hint
            />
          </v-col>

          <v-col v-if="hasPercentileProfile" cols="12" sm="6" md="3">
            <v-expansion-panels variant="accordion" density="compact">
              <v-expansion-panel>
                <v-expansion-panel-title class="text-body-2 py-1">
                  Paramètres avancés
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-select
                    v-model="age"
                    :items="ageItems"
                    item-title="title"
                    item-value="value"
                    label="Âge"
                    placeholder="Tous les panneaux…"
                    clearable
                    density="compact"
                    hide-details
                    class="mb-3"
                  />
                  <v-select
                    v-model="pop"
                    :items="popItems"
                    item-title="title"
                    item-value="value"
                    label="Population"
                    placeholder="Tous les panneaux…"
                    clearable
                    density="compact"
                    hide-details
                  />
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-col>
        </v-row>
      </div>
    </v-expand-transition>
  </v-card>
</template>

<style scoped>
.grille-global-params-panel__header--clickable {
  cursor: pointer;
  user-select: none;
  border-radius: 4px;
}

.grille-global-params-panel__header--clickable:hover {
  opacity: 0.85;
}
</style>
