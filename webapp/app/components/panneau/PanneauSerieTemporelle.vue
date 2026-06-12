<script setup lang="ts">
import type { CountryOption } from '@src/domain/types'
import { WID_PROFILE_VARIABLES } from '@src/data-sources/wid/widCodes'
import type { PanneauType } from '~/composables/panneauTypes'

const props = withDefaults(defineProps<{
  panelIndex?: number
  removable?: boolean
  collapsible?: boolean
  panelType?: PanneauType
  defaultFiltersExpanded?: boolean
  chartHeight?: string
}>(), {
  panelIndex: 0,
  removable: false,
  collapsible: false,
  panelType: undefined,
  defaultFiltersExpanded: true,
  chartHeight: '380px',
})

const emit = defineEmits<{ remove: [] }>()

const countries = inject<Ref<CountryOption[]>>('widCountries')
if (!countries) {
  throw new Error('PanneauSerieTemporelle requires a widCountries provider')
}

const initialVariable = WID_PROFILE_VARIABLES[props.panelIndex ?? 0]?.sixlet ?? 'ahweal'
const state = createWidSeriesState({ countries, initialVariable })

const {
  countryCode,
  variable,
  age,
  pop,
  percentile,
  logScaleY,
  variables,
  ageOptions,
  popOptions,
  percentileOptions,
  loading,
  error: panelError,
  series,
  chartOption,
  variableMeta,
  load,
} = state

onMounted(() => {
  void state.init()
})
</script>

<template>
  <div class="panneau-serie-temporelle">
    <PanneauFiltersShell
      :collapsible="collapsible"
      :panel-type="panelType ?? 'temps'"
      :removable="removable"
      :default-expanded="defaultFiltersExpanded"
      @remove="emit('remove')"
    >

      <v-row dense class="panel-filters-row align-start">
        <v-col class="panel-filters-row__item">
          <v-autocomplete
            v-model="countryCode"
            :items="countries"
            item-title="label"
            item-value="code"
            label="Pays"
            prepend-inner-icon="mdi-earth"
            placeholder="Rechercher un pays…"
            clearable
            auto-select-first
            density="compact"
            hide-details
          />
        </v-col>
        <v-col class="panel-filters-row__item">
          <v-select
            v-model="variable"
            :items="variables"
            item-title="label"
            item-value="sixlet"
            group-by="groupLabel"
            label="Variable"
            density="compact"
            hide-details
          />
        </v-col>
        <v-col class="panel-filters-row__item">
          <v-select
            v-model="percentile"
            :items="percentileOptions"
            item-title="label"
            item-value="value"
            label="Percentile"
            density="compact"
            hide-details
          />
        </v-col>
      </v-row>

      <v-row dense class="mt-2">
        <v-col cols="12" md="6">
          <v-expansion-panels variant="accordion">
            <v-expansion-panel>
              <v-expansion-panel-title class="text-body-2">
                Paramètres avancés
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-select
                  v-model="age"
                  :items="ageOptions"
                  item-title="label"
                  item-value="value"
                  label="Âge"
                  density="compact"
                  hide-details
                  class="mb-3"
                />
                <v-select
                  v-model="pop"
                  :items="popOptions"
                  item-title="label"
                  item-value="value"
                  label="Population"
                  density="compact"
                  hide-details
                />
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>

        <v-col cols="12" md="6">
          <v-expansion-panels variant="accordion">
            <v-expansion-panel>
              <v-expansion-panel-title class="text-body-2">
                Réglages
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-switch
                  v-model="logScaleY"
                  label="Échelle log ordonnée"
                  color="primary"
                  density="compact"
                  hide-details
                />
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
      </v-row>

      <v-row dense class="mt-2">
        <v-col cols="12" class="d-flex align-center justify-end">
          <v-btn
            color="primary"
            variant="tonal"
            size="small"
            :loading="loading"
            prepend-icon="mdi-refresh"
            @click="load"
          >
            Rafraîchir
          </v-btn>
        </v-col>
      </v-row>
    </PanneauFiltersShell>

    <v-card variant="outlined" class="pa-3">
      <div class="d-flex flex-wrap ga-2 mb-2">
        <v-chip v-if="series" size="x-small" color="primary" variant="tonal">
          Source : WID.world
        </v-chip>
        <v-chip v-if="variableMeta?.unit" size="x-small" variant="tonal">
          Unité : {{ variableMeta.unit }}
        </v-chip>
        <v-chip v-if="series?.points.length" size="x-small" variant="tonal">
          {{ series.points.length }} années
        </v-chip>
      </div>

      <EChart
        :key="`${logScaleY}-${variable}-${percentile}`"
        :option="chartOption"
        :loading="loading"
        :error="panelError"
        :height="chartHeight"
      />
    </v-card>
  </div>
</template>

<style scoped>
.panel-filters-row {
  flex-wrap: nowrap;
  overflow-x: auto;
}

.panel-filters-row__item {
  flex: 1 1 0;
  min-width: 9.5rem;
  max-width: none;
}
</style>
