<script setup lang="ts">
import { buildActiveCalculationHelp, buildDrillDownHelp, PROFILE_HELP } from '~/visualization/profileHelp'
import { resolveProfileChartType } from '~/visualization/profile'
import {
  describeCustomIntervals,
  formatBoundaryLabel,
  parseBoundaryInput,
  PROFILE_POPULATION_VIEW_OPTIONS,
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
  showPanelTitle?: boolean
  chartHeight?: string
}>(), {
  panelIndex: 0,
  removable: false,
  collapsible: false,
  panelType: undefined,
  defaultFiltersExpanded: true,
  showPanelTitle: true,
  chartHeight: '380px',
})

const emit = defineEmits<{ remove: [] }>()

const countries = inject<Ref<CountryOption[]>>('widCountries')
if (!countries) {
  throw new Error('PanneauVisualisation requires a widCountries provider')
}

const paramsInSidebar = inject<Ref<boolean>>('paramsInSidebar', ref(false))

const initialVariable = WID_PROFILE_VARIABLES[props.panelIndex ?? 0]?.sixlet ?? 'ahweal'
const state = createWidProfileState({ countries, initialVariable })

const {
  countryCode,
  variable,
  year,
  age,
  pop,
  chartTypeLayers,
  logScaleY,
  logScaleX,
  populationDensity,
  probabilityDensity,
  lorenzCurve,
  variables,
  ageOptions,
  popOptions,
  years,
  yearsLoading,
  yearRangeLabel,
  loading,
  error: panelError,
  drillLevel,
  drillBreadcrumb,
  currentDrillableCode,
  canDrillDown,
  supportsDrillDown,
  populationViewMode,
  customBreakpoints,
  availableBoundaries,
  customPartitionValidation,
  customPartitionReady,
  customPartitionComplete,
  drillTo,
  drillDownTop,
  handleChartClick,
  profile,
  profileOption,
  load,
} = state

const customBreakpointInput = ref('')
const customBreakpointError = ref<string | null>(null)

const selectableBoundaries = computed(() =>
  selectableCustomBoundaries(customBreakpoints.value, availableBoundaries.value),
)

const selectableBoundaryItems = computed(() =>
  selectableBoundaries.value.map((value) => ({
    value,
    title: formatBoundaryLabel(value),
  })),
)

const customIntervalLabels = computed(() =>
  describeCustomIntervals(customBreakpoints.value),
)

const nextBoundaryHint = computed(() => {
  const last = customBreakpoints.value.length > 0
    ? customBreakpoints.value[customBreakpoints.value.length - 1]!
    : 0
  return `Prochaine borne de fin (après ${formatBoundaryLabel(last)})`
})

const addCustomBreakpoint = (raw: string | number | { value: number, title?: string }) => {
  let value: number | null
  if (typeof raw === 'object' && raw !== null && 'value' in raw) {
    value = raw.value
  } else if (typeof raw === 'number') {
    value = raw
  } else {
    value = parseBoundaryInput(String(raw))
  }
  if (value === null) {
    customBreakpointError.value = 'Saisissez un pourcentage entre 0 et 100.'
    return
  }
  const validation = validateNextCustomBreakpoint(
    value,
    customBreakpoints.value,
    availableBoundaries.value,
  )
  if (!validation.valid) {
    customBreakpointError.value = validation.error
    return
  }
  customBreakpoints.value = [...customBreakpoints.value, value]
  customBreakpointInput.value = ''
  customBreakpointError.value = null
}

const removeLastCustomBreakpoint = () => {
  customBreakpoints.value = customBreakpoints.value.slice(0, -1)
  customBreakpointError.value = null
}

const resetCustomBreakpoints = () => {
  customBreakpoints.value = []
  customBreakpointInput.value = ''
  customBreakpointError.value = null
}

watch(populationViewMode, () => {
  customBreakpointInput.value = ''
  customBreakpointError.value = null
})

const chartTypes = [
  { value: 'bar', label: 'Bandes' },
  { value: 'scatter', label: 'Nuage' },
  { value: 'line', label: 'Ligne' },
]

const activeCalculationHelp = computed(() => buildActiveCalculationHelp({
  chartType: resolveProfileChartType(chartTypeLayers.value),
  logScaleX: logScaleX.value,
  logScaleY: logScaleY.value,
  populationDensity: populationDensity.value,
  probabilityDensity: probabilityDensity.value,
  lorenzCurve: lorenzCurve.value,
  profile: profile.value,
}))

const drillDownHelp = computed(() => buildDrillDownHelp(currentDrillableCode.value))

onMounted(() => {
  void state.init()
})
</script>

<template>
  <div
    class="panneau-visualisation"
    :class="{ 'panneau--sidebar-mode': paramsInSidebar }"
  >
    <div class="panneau__filters">
    <PanneauFiltersShell
      :collapsible="collapsible"
      :panel-type="panelType ?? (collapsible ? 'population' : undefined)"
      :removable="removable"
      :default-expanded="defaultFiltersExpanded"
      @remove="emit('remove')"
    >
      <div
        v-if="showPanelTitle && !collapsible"
        class="text-subtitle-2 font-weight-medium mb-2"
      >
        Étude
      </div>

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
            v-model="year"
            :items="years"
            :loading="yearsLoading"
            :disabled="yearsLoading || years.length === 0"
            :hint="yearRangeLabel ? `Disponible : ${yearRangeLabel}` : undefined"
            label="Année"
            density="compact"
            persistent-hint
          />
        </v-col>
      </v-row>

      <v-row dense class="mt-2 panel-options-row">
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
                <div class="d-flex align-center ga-2 mb-3 chart-type-row">
                  <div class="d-flex align-center ga-1 chart-type-row__label">
                    <span class="text-body-2 text-medium-emphasis">Type</span>
                    <ProfileHelpButton
                      :title="PROFILE_HELP.chartType.title"
                      :paragraphs="PROFILE_HELP.chartType.paragraphs"
                    />
                  </div>
                  <v-btn-toggle
                    v-model="chartTypeLayers"
                    multiple
                    mandatory
                    density="compact"
                    divided
                    color="primary"
                    variant="outlined"
                    class="chart-type-toggle"
                  >
                    <v-btn
                      v-for="type in chartTypes"
                      :key="type.value"
                      :value="type.value"
                      size="small"
                    >
                      {{ type.label }}
                    </v-btn>
                  </v-btn-toggle>
                </div>

                <div class="d-flex align-center mb-1">
                  <v-switch
                    v-model="lorenzCurve"
                    label="Courbe de Lorenz"
                    color="primary"
                    density="compact"
                    hide-details
                  />
                  <ProfileHelpButton
                    :title="PROFILE_HELP.lorenzCurve.title"
                    :paragraphs="PROFILE_HELP.lorenzCurve.paragraphs"
                  />
                </div>

                <div class="d-flex align-center mb-1">
                  <v-switch
                    v-model="populationDensity"
                    label="Densité de population"
                    color="primary"
                    density="compact"
                    hide-details
                    :disabled="lorenzCurve"
                  />
                  <ProfileHelpButton
                    :title="PROFILE_HELP.populationDensity.title"
                    :paragraphs="PROFILE_HELP.populationDensity.paragraphs"
                  />
                </div>

                <div class="d-flex align-center mb-1">
                  <v-switch
                    v-model="probabilityDensity"
                    label="Densité de probabilité"
                    color="primary"
                    density="compact"
                    hide-details
                    :disabled="lorenzCurve"
                  />
                  <ProfileHelpButton
                    :title="PROFILE_HELP.probabilityDensity.title"
                    :paragraphs="PROFILE_HELP.probabilityDensity.paragraphs"
                  />
                </div>

                <div class="d-flex align-center mb-1">
                  <v-switch
                    v-model="logScaleX"
                    label="Échelle log abscisse"
                    color="primary"
                    density="compact"
                    hide-details
                    :disabled="lorenzCurve"
                  />
                  <ProfileHelpButton
                    :title="PROFILE_HELP.logScaleX.title"
                    :paragraphs="PROFILE_HELP.logScaleX.paragraphs"
                  />
                </div>

                <div class="d-flex align-center">
                  <v-switch
                    v-model="logScaleY"
                    label="Échelle log ordonnée"
                    color="primary"
                    density="compact"
                    hide-details
                    :disabled="lorenzCurve"
                  />
                  <ProfileHelpButton
                    :title="PROFILE_HELP.logScaleY.title"
                    :paragraphs="PROFILE_HELP.logScaleY.paragraphs"
                  />
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
      </v-row>

      <v-row dense class="mt-2">
        <v-col cols="12" class="d-flex align-center justify-end ga-2">
          <ProfileHelpButton
            :title="activeCalculationHelp.title"
            :paragraphs="activeCalculationHelp.paragraphs"
            label="Calcul des données"
            hint="Récapitulatif selon les options actives"
          />
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
        <v-chip v-if="profile" size="x-small" color="primary" variant="tonal">
          Source : WID.world
        </v-chip>
        <v-chip v-if="profile?.unit" size="x-small" variant="tonal">
          Unité : {{ profile.unit }}
        </v-chip>
      </div>

      <div class="d-flex flex-wrap align-center justify-space-between ga-2 mb-2">
        <div class="d-flex align-center flex-wrap ga-2 population-view-row">
          <v-select
            v-model="populationViewMode"
            :items="PROFILE_POPULATION_VIEW_OPTIONS"
            item-title="label"
            item-value="value"
            label="Tranches de population"
            density="compact"
            hide-details
            class="population-view-select"
          />
          <ProfileHelpButton
            :title="PROFILE_HELP.populationView.title"
            :paragraphs="PROFILE_HELP.populationView.paragraphs"
            hint="Modes de découpage en tranches de population"
          />
        </div>

        <div
          v-if="supportsDrillDown"
          class="d-flex align-center flex-wrap ga-1"
        >
          <template v-for="(crumb, idx) in drillBreadcrumb" :key="crumb.level">
            <v-icon v-if="idx > 0" size="x-small" icon="mdi-chevron-right" class="text-medium-emphasis" />
            <v-chip
              size="x-small"
              :color="crumb.level === drillLevel ? 'primary' : undefined"
              :variant="crumb.level === drillLevel ? 'flat' : 'text'"
              @click="drillTo(crumb.level)"
            >
              {{ crumb.label }}
            </v-chip>
          </template>
          <ProfileHelpButton
            v-if="canDrillDown"
            :title="drillDownHelp.title"
            :paragraphs="drillDownHelp.paragraphs"
            :hint="drillDownHelp.hint"
          />
          <ProfileHelpButton
            v-else
            :title="PROFILE_HELP.drillMaxLevel.title"
            :paragraphs="PROFILE_HELP.drillMaxLevel.paragraphs"
            hint="Niveau de zoom maximal atteint"
          />
        </div>
        <div v-else-if="populationViewMode === 'all'" class="d-flex align-center ga-1">
          <span class="text-body-2 font-weight-medium">Tranches fines sur les plus riches</span>
          <ProfileHelpButton
            :title="PROFILE_HELP.showAllPercentiles.title"
            :paragraphs="PROFILE_HELP.showAllPercentiles.paragraphs"
            hint="Affichage des 127 g-percentiles WID"
          />
        </div>

        <div v-if="canDrillDown" class="d-flex align-center ga-2">
          <v-btn
            size="x-small"
            variant="tonal"
            color="primary"
            prepend-icon="mdi-magnify-plus-outline"
            @click="drillDownTop"
          >
            Zoomer sur {{ currentDrillableCode }}
          </v-btn>
        </div>
      </div>

      <v-expand-transition>
        <div
          v-if="populationViewMode === 'custom'"
          class="custom-partition-panel mb-3 pa-3 rounded border"
        >
          <div class="d-flex align-center ga-1 mb-2">
            <span class="text-body-2 font-weight-medium">Tranches personnalisées</span>
            <ProfileHelpButton
              title="Tranches personnalisées"
              :paragraphs="[
                'Saisissez les bornes de fin de chaque intervalle d\'observation (0–100 %). Il n\'est pas nécessaire d\'aller jusqu\'à 100 %.',
                'Exemple : 50, 90, 100 → ]0 %, 50 %], ]50 %, 90 %], ]90 %, 100 %].',
              ]"
            />
          </div>

          <div v-if="customIntervalLabels.length > 0" class="d-flex flex-wrap ga-1 mb-3">
            <v-chip
              v-for="(label, idx) in customIntervalLabels"
              :key="idx"
              size="small"
              variant="tonal"
              color="primary"
            >
              {{ label }}
            </v-chip>
          </div>

          <v-row dense align="center">
            <v-col cols="12" sm="6" md="4">
              <v-combobox
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
                @keydown.enter.prevent="addCustomBreakpoint(customBreakpointInput)"
              />
            </v-col>
            <v-col cols="auto">
              <v-btn
                size="small"
                color="primary"
                variant="tonal"
                :disabled="!customBreakpointInput"
                @click="addCustomBreakpoint(customBreakpointInput)"
              >
                Ajouter
              </v-btn>
            </v-col>
            <v-col cols="auto">
              <v-btn
                size="small"
                variant="text"
                :disabled="customBreakpoints.length === 0"
                @click="removeLastCustomBreakpoint"
              >
                Annuler dernière
              </v-btn>
            </v-col>
            <v-col cols="auto">
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

          <v-alert
            v-if="customPartitionReady"
            type="success"
            density="compact"
            variant="tonal"
            class="mt-3"
          >
            Découpage prêt — {{ customIntervalLabels.length }} intervalle(s).
            <span v-if="!customPartitionComplete">
              Vous pouvez ajouter d'autres bornes ou étendre jusqu'à 100 %.
            </span>
          </v-alert>
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
            v-else-if="!customPartitionReady && profile"
            type="info"
            density="compact"
            variant="tonal"
            class="mt-3"
          >
            Ajoutez au moins une borne de fin pour afficher le graphique.
            {{ selectableBoundaries.length }} borne(s) disponible(s) dans les données.
          </v-alert>
        </div>
      </v-expand-transition>

      <EChart
        :key="`${lorenzCurve}-${populationDensity}-${probabilityDensity}-${chartTypeLayers.join('+')}-${populationViewMode}-${drillLevel}-${customBreakpoints.join(',')}`"
        :option="profileOption"
        :loading="loading"
        :error="panelError"
        :height="chartHeight"
        @chart-click="handleChartClick"
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

.chart-type-row {
  flex-wrap: wrap;
}

.chart-type-row__label {
  flex-shrink: 0;
}

.chart-type-toggle {
  flex: 1 1 auto;
  min-width: 0;
  height: auto;
}

.chart-type-toggle :deep(.v-btn) {
  font-size: 0.875rem;
  letter-spacing: 0.01em;
}

.chart-type-toggle :deep(.v-btn--selected) {
  font-weight: 600;
}

.population-view-row {
  min-width: 12rem;
}

.population-view-select {
  min-width: 16rem;
  max-width: 22rem;
}

.custom-partition-panel {
  border-color: rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-surface-variant), 0.15);
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
