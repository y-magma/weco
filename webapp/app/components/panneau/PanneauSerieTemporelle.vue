<script setup lang="ts">
import {
  describeCustomIntervals,
  formatBoundaryLabel,
  selectableCustomBoundaries,
  validateNextCustomBreakpoint,
} from '~/visualization/populationPartition'
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
  showDataSourceSection?: boolean
}>(), {
  panelIndex: 0,
  removable: false,
  collapsible: false,
  panelType: undefined,
  defaultFiltersExpanded: true,
  chartHeight: '380px',
  showDataSourceSection: true,
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
  partitionMode,
  customBreakpoints,
  availableBoundaries,
  customPartitionValidation,
  customPartitionReady,
  customPartitionComplete,
  variables,
  ageOptions,
  popOptions,
  partitionViewOptions,
  activeTranches,
  loading,
  error: panelError,
  loadWarning,
  trancheSeriesByCountry,
  chartOption,
  variableMeta,
  yearCountLabel,
  yearRangeLabel,
  paramsLoading,
  trancheCountLabel,
  load,
} = state

const paramsInSidebar = inject<Ref<boolean>>('paramsInSidebar', ref(false))
const { sourceId, sourceLabel } = usePanneauDataSource()

const customBreakpointInput = ref<number | null>(null)
const customBreakpointError = ref<string | null>(null)

const selectableBoundaries = computed(() =>
  selectableCustomBoundaries(customBreakpoints.value, availableBoundaries),
)

const selectableBoundaryItems = computed(() =>
  selectableBoundaries.value.map((value) => ({
    title: formatBoundaryLabel(value),
    value,
  })),
)

const customIntervalLabels = computed(() =>
  describeCustomIntervals(customBreakpoints.value),
)

const customPartitionReadyHint = computed(() => {
  const base = `Découpage prêt — ${customIntervalLabels.value.length} intervalle(s).`
  if (!customPartitionComplete.value) {
    return `${base} Vous pouvez ajouter d'autres bornes ou étendre jusqu'à 100 %.`
  }
  return base
})

const nextBoundaryHint = computed(() => {
  const last = customBreakpoints.value.length > 0
    ? customBreakpoints.value[customBreakpoints.value.length - 1]!
    : 0
  return `Borne de fin après ${formatBoundaryLabel(last)}`
})

const addCustomBreakpoint = (value: number | null) => {
  if (value == null) return
  const validation = validateNextCustomBreakpoint(
    value,
    customBreakpoints.value,
    availableBoundaries,
  )
  if (!validation.valid) {
    customBreakpointError.value = validation.error
    return
  }
  customBreakpoints.value = [...customBreakpoints.value, value]
  customBreakpointInput.value = null
  customBreakpointError.value = null
}

const onCustomBoundarySelected = (value: number | null) => {
  if (value == null) return
  addCustomBreakpoint(value)
}

const removeLastCustomBreakpoint = () => {
  customBreakpoints.value = customBreakpoints.value.slice(0, -1)
  customBreakpointError.value = null
}

const resetCustomBreakpoints = () => {
  customBreakpoints.value = []
  customBreakpointInput.value = null
  customBreakpointError.value = null
}

watch(partitionMode, () => {
  customBreakpointInput.value = null
  customBreakpointError.value = null
})

onMounted(() => {
  void state.init()
})
</script>

<template>
  <div
    class="panneau-serie-temporelle"
    :class="{ 'panneau--sidebar-mode': paramsInSidebar }"
  >
    <div class="panneau__filters">
    <PanneauFiltersShell
      :collapsible="collapsible"
      :panel-type="panelType ?? 'temps'"
      :removable="removable"
      :default-expanded="defaultFiltersExpanded"
      @remove="emit('remove')"
    >
      <PanneauDataSourceSection v-if="showDataSourceSection" v-model="sourceId" />

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
      </v-row>

      <div class="custom-partition-panel mt-3 pa-3 rounded border">
        <div class="text-body-2 font-weight-medium mb-2">
          Tranches de population
        </div>

        <v-select
          v-model="partitionMode"
          :items="partitionViewOptions"
          item-title="label"
          item-value="value"
          label="Mode de découpage"
          density="compact"
          hide-details
        />

        <template v-if="partitionMode === 'custom'">
          <v-row dense align="center" class="mt-1">
            <v-col cols="12">
              <v-select
                v-model="customBreakpointInput"
                :items="selectableBoundaryItems"
                item-title="title"
                item-value="value"
                :label="nextBoundaryHint"
                :error-messages="customBreakpointError ? [customBreakpointError] : []"
                :disabled="selectableBoundaries.length === 0"
                density="compact"
                hide-details="auto"
                clearable
                @update:model-value="onCustomBoundarySelected"
              />
            </v-col>
            <v-col cols="12" class="custom-partition-actions d-flex flex-wrap ga-1">
              <v-btn
                size="small"
                variant="text"
                :disabled="customBreakpoints.length === 0"
                @click="removeLastCustomBreakpoint"
              >
                Annuler dernière
              </v-btn>
              <v-btn
                size="small"
                variant="text"
                :disabled="customBreakpoints.length === 0"
                @click="resetCustomBreakpoints"
              >
                Réinitialiser
              </v-btn>
            </v-col>
          </v-row>

          <div v-if="customPartitionReady" class="mt-2">
            <v-tooltip location="top" :text="customPartitionReadyHint">
              <template #activator="{ props: tooltipProps }">
                <v-icon
                  v-bind="tooltipProps"
                  icon="mdi-check-circle"
                  color="success"
                  size="small"
                  aria-label="Découpage prêt"
                />
              </template>
            </v-tooltip>
          </div>
          <v-alert
            v-else-if="customBreakpoints.length > 0 && customPartitionValidation.error"
            type="warning"
            density="compact"
            variant="tonal"
            class="mt-3"
          >
            {{ customPartitionValidation.error }}
          </v-alert>
          <v-alert
            v-else-if="!customPartitionReady"
            type="info"
            density="compact"
            variant="tonal"
            class="mt-3"
          >
            Choisissez au moins une borne de fin pour afficher la série.
          </v-alert>
        </template>
      </div>

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
                  :loading="paramsLoading"
                  :disabled="paramsLoading || ageOptions.length === 0"
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
                  :loading="paramsLoading"
                  :disabled="paramsLoading || popOptions.length === 0"
                  item-title="label"
                  item-value="value"
                  label="Population"
                  density="compact"
                  :hint="yearRangeLabel ? `Années disponibles : ${yearRangeLabel}` : undefined"
                  persistent-hint
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
      <v-alert
        v-if="loadWarning"
        type="warning"
        variant="tonal"
        density="compact"
        class="mb-3"
      >
        {{ loadWarning }}
      </v-alert>

      <div class="d-flex flex-wrap ga-2 mb-2">
        <v-chip v-if="trancheSeriesByCountry.length" size="x-small" color="primary" variant="tonal">
          Source : {{ sourceLabel }}
        </v-chip>
        <v-chip v-if="variableMeta?.unit" size="x-small" variant="tonal">
          Unité : {{ variableMeta.unit }}
        </v-chip>
        <v-chip v-if="trancheSeriesByCountry.length" size="x-small" variant="tonal">
          {{ trancheSeriesByCountry[0]?.countryLabel }}
        </v-chip>
        <v-chip v-if="trancheCountLabel" size="x-small" variant="tonal">
          {{ trancheCountLabel }}
        </v-chip>
        <v-chip v-if="yearRangeLabel" size="x-small" variant="tonal">
          Plage : {{ yearRangeLabel }}
        </v-chip>
        <v-chip v-if="yearCountLabel" size="x-small" variant="tonal">
          {{ yearCountLabel }}
        </v-chip>
      </div>

      <div
        v-if="activeTranches.length > 0"
        class="d-flex flex-wrap ga-1 mb-2"
      >
        <v-chip
          v-for="tranche in activeTranches"
          :key="tranche.code"
          size="x-small"
          variant="flat"
          :style="{ backgroundColor: tranche.color, color: '#fff' }"
        >
          {{ tranche.label }}
        </v-chip>
      </div>

      <EChart
        :key="`${variable}-${partitionMode}-${customBreakpoints.join(',')}-${countryCode}`"
        :option="chartOption"
        :loading="loading"
        :error="panelError"
        :height="chartHeight"
      />
    </v-card>
    </div>
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

.custom-partition-panel {
  border-color: rgba(var(--v-border-color), var(--v-border-opacity));
}

.custom-partition-actions {
  padding-top: 0;
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

/* Stack filter items vertically */
.panneau--sidebar-mode .panneau__filters :deep(.panel-filters-row) {
  flex-wrap: wrap !important;
  overflow-x: visible !important;
}

.panneau--sidebar-mode .panneau__filters :deep(.panel-filters-row__item) {
  flex: 1 1 100% !important;
  min-width: 0 !important;
}

/* Full-width for all non-auto cols (expansion panels, advanced params rows) */
.panneau--sidebar-mode .panneau__filters :deep(.v-col:not(.v-col-auto)) {
  flex: 0 0 100% !important;
  max-width: 100% !important;
}
</style>
