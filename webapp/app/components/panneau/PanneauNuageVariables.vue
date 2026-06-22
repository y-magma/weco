<script setup lang="ts">
import type { CountryOption } from '@domain/entities'
import { WID_PROFILE_VARIABLES } from '@domain/catalog/widCodes'
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
  throw new Error('PanneauNuageVariables requires a widCountries provider')
}

const vars = WID_PROFILE_VARIABLES
const initialX = vars[props.panelIndex % vars.length]?.sixlet ?? 'thweal'
const initialY = vars[(props.panelIndex + 1) % vars.length]?.sixlet ?? 'ahweal'
const paramsInSidebar = inject<Ref<boolean>>('paramsInSidebar', ref(false))

const state = createWidScatterState({ countries, initialVariableX: initialX, initialVariableY: initialY })

const {
  countryCode,
  variableX,
  variableY,
  year,
  age,
  pop,
  logScaleX,
  logScaleY,
  variables,
  ageOptions,
  popOptions,
  years,
  yearsLoading,
  yearRangeLabel,
  paramAdjustmentHints,
  adjustmentToastVisible,
  adjustmentToastMessage,
  loading,
  error: panelError,
  points,
  scatterOption,
  load,
} = state

onMounted(() => {
  void state.init()
})
</script>

<template>
  <div
    class="panneau-nuage-variables"
    :class="{ 'panneau--sidebar-mode': paramsInSidebar }"
  >
    <div class="panneau__filters">
    <PanneauFiltersShell
      :collapsible="collapsible"
      :panel-type="panelType ?? 'variables'"
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
            v-model="year"
            :items="years"
            :loading="yearsLoading"
            :disabled="yearsLoading || years.length === 0"
            :hint="yearRangeLabel ? `Disponible : ${yearRangeLabel}` : undefined"
            label="Année"
            density="compact"
            persistent-hint
          />
          <ParamAdjustmentHint :message="paramAdjustmentHints.year" />
        </v-col>
      </v-row>

      <v-row dense class="mt-2 panel-filters-row align-start">
        <v-col class="panel-filters-row__item">
          <v-select
            v-model="variableX"
            :items="variables"
            item-title="label"
            item-value="sixlet"
            group-by="groupLabel"
            label="Variable X (abscisse)"
            prepend-inner-icon="mdi-axis-x-arrow"
            density="compact"
            hide-details
          />
        </v-col>
        <v-col class="panel-filters-row__item">
          <v-select
            v-model="variableY"
            :items="variables"
            item-title="label"
            item-value="sixlet"
            group-by="groupLabel"
            label="Variable Y (ordonnée)"
            prepend-inner-icon="mdi-axis-y-arrow"
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
                  :loading="yearsLoading"
                  :disabled="yearsLoading || ageOptions.length === 0"
                  item-title="label"
                  item-value="value"
                  label="Âge"
                  density="compact"
                  hide-details
                  class="mb-3"
                />
                <ParamAdjustmentHint :message="paramAdjustmentHints.age" />
                <v-select
                  v-model="pop"
                  :items="popOptions"
                  :loading="yearsLoading"
                  :disabled="yearsLoading || popOptions.length === 0"
                  item-title="label"
                  item-value="value"
                  label="Population"
                  density="compact"
                  hide-details
                />
                <ParamAdjustmentHint :message="paramAdjustmentHints.pop" />
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
                  v-model="logScaleX"
                  label="Échelle log abscisse"
                  color="primary"
                  density="compact"
                  hide-details
                  class="mb-1"
                />
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
    </div>

    <div class="panneau__chart">
    <v-card variant="outlined" class="pa-3">
      <div class="d-flex flex-wrap ga-2 mb-2">
        <v-chip size="x-small" color="primary" variant="tonal">
          Source : WID.world
        </v-chip>
        <v-chip v-if="points.length" size="x-small" variant="tonal">
          {{ points.length }} percentiles joints
        </v-chip>
      </div>

      <EChart
        :key="`${logScaleX}-${logScaleY}-${variableX}-${variableY}`"
        :option="scatterOption"
        :loading="loading"
        :error="panelError"
        :height="chartHeight"
      />
    </v-card>
    </div>
  </div>

  <WidParamAdjustmentToast
    v-model="adjustmentToastVisible"
    :message="adjustmentToastMessage"
  />
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

/* ── Sidebar mode: filters left, chart right ── */
.panneau--sidebar-mode {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.panneau--sidebar-mode .panneau__filters {
  width: 310px;
  min-width: 310px;
  flex-shrink: 0;
}

.panneau--sidebar-mode .panneau__chart {
  flex: 1;
  min-width: 0;
}

.panneau--sidebar-mode .panneau__filters :deep(.panel-filters-row) {
  flex-wrap: wrap !important;
  overflow-x: visible !important;
}

.panneau--sidebar-mode .panneau__filters :deep(.panel-filters-row__item) {
  flex: 1 1 100% !important;
  min-width: 0 !important;
}

.panneau--sidebar-mode .panneau__filters :deep(.v-col:not(.v-col-auto)) {
  flex: 0 0 100% !important;
  max-width: 100% !important;
}
</style>
