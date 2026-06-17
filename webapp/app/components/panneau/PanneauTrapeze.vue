<script setup lang="ts">
import {
  describeCustomIntervals,
  formatBoundaryLabel,
  parseBoundaryInput,
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
}>(), {
  panelIndex: 0,
  removable: false,
  collapsible: false,
  panelType: undefined,
  defaultFiltersExpanded: true,
  chartHeight: '420px',
})

const emit = defineEmits<{ remove: [] }>()

const countries = inject<Ref<CountryOption[]>>('widCountries')
if (!countries) {
  throw new Error('PanneauTrapeze requires a widCountries provider')
}

const initialVariable = WID_PROFILE_VARIABLES[props.panelIndex ?? 0]?.sixlet ?? 'ahweal'
const state = createWidTrapezoidState({ countries, initialVariable })

const {
  countryCode,
  variable,
  year,
  age,
  pop,
  method,
  showHistogram,
  showTrapezoids,
  populationViewMode,
  approxPartitionMode,
  customBreakpoints,
  availableBoundaries,
  customPartitionValidation,
  customPartitionReady,
  customPartitionComplete,
  approxReady,
  methodOptions,
  populationViewOptions,
  partitionViewOptions,
  variables,
  ageOptions,
  popOptions,
  years,
  yearsLoading,
  yearRangeLabel,
  loading,
  error: panelError,
  profile,
  approximation,
  chartOption,
  variableMeta,
  intervalCountLabel,
  activeMethodHint,
  load,
} = state

const paramsInSidebar = inject<Ref<boolean>>('paramsInSidebar', ref(false))

const customBreakpointInput = ref('')
const customBreakpointError = ref<string | null>(null)

const selectableBoundaries = computed(() =>
  selectableCustomBoundaries(customBreakpoints.value, availableBoundaries.value),
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

const nextBoundaryHint = computed(() => {
  const last = customBreakpoints.value.length > 0
    ? customBreakpoints.value[customBreakpoints.value.length - 1]!
    : 0
  return `Borne de fin après ${formatBoundaryLabel(last)}`
})

const addCustomBreakpoint = (raw: string | number | null) => {
  const text = raw == null ? '' : String(raw)
  const value = parseBoundaryInput(text)
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

onMounted(() => {
  void state.init()
})
</script>

<template>
  <div
    class="panneau-trapeze"
    :class="{ 'panneau--sidebar-mode': paramsInSidebar }"
  >
    <div class="panneau__filters">
      <PanneauFiltersShell
        :collapsible="collapsible"
        :panel-type="panelType ?? 'trapeze'"
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

        <div class="custom-partition-panel mt-3 pa-3 rounded border">
          <div class="d-flex align-center ga-1 mb-2">
            <span class="text-body-2 font-weight-medium">Intervalles d'approximation</span>
            <ProfileHelpButton
              title="Intervalles d'approximation"
              :paragraphs="[
                'Choisissez les tranches de population servant d\'intervalles d\'approximation : tranches fines (127 g-percentiles), pas fixe (1 %, 10 %, 25 %) ou personnalisées.',
                'En mode personnalisé, saisissez les bornes de fin de chaque intervalle (0–100 %). Il n\'est pas nécessaire d\'aller jusqu\'à 100 %.',
              ]"
            />
          </div>

          <v-select
            v-model="approxPartitionMode"
            :items="partitionViewOptions"
            item-title="label"
            item-value="value"
            label="Tranches de population"
            density="compact"
            hide-details
          />

          <template v-if="approxPartitionMode === 'custom'">
            <div v-if="customIntervalLabels.length > 0" class="d-flex flex-wrap ga-1 mt-3 mb-3">
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

            <v-row dense align="center" class="mt-1">
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
              v-else-if="profile && !customPartitionReady"
              type="info"
              density="compact"
              variant="tonal"
              class="mt-3"
            >
              Ajoutez au moins une borne de fin pour afficher l'approximation.
            </v-alert>
          </template>
        </div>

        <div class="mt-3">
          <div class="text-body-2 font-weight-medium mb-2">
            Méthode de calage (y₀)
          </div>
          <v-btn-toggle
            v-model="method"
            mandatory
            divided
            color="primary"
            variant="outlined"
            density="compact"
            class="method-toggle flex-wrap"
          >
            <v-btn
              v-for="opt in methodOptions"
              :key="opt.value"
              :value="opt.value"
              size="small"
            >
              {{ opt.label }}
            </v-btn>
          </v-btn-toggle>
          <p v-if="activeMethodHint" class="text-caption text-medium-emphasis mt-2 mb-0">
            {{ activeMethodHint }}
          </p>
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
                    v-model="populationViewMode"
                    :items="populationViewOptions"
                    item-title="label"
                    item-value="value"
                    label="Tranches de population (courbe)"
                    density="compact"
                    hide-details
                    class="mb-3"
                  />
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
          <v-chip v-if="profile" size="x-small" color="primary" variant="tonal">
            Source : WID.world
          </v-chip>
          <v-chip v-if="variableMeta?.unit" size="x-small" variant="tonal">
            Unité : {{ variableMeta.unit }}
          </v-chip>
          <v-chip v-if="intervalCountLabel" size="x-small" variant="tonal">
            {{ intervalCountLabel }}
          </v-chip>
          <v-chip v-if="approximation" size="x-small" variant="tonal" color="error">
            y₀ = {{ approximation.y0.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) }}
          </v-chip>
        </div>

        <div v-if="profile" class="d-flex align-center flex-wrap ga-3 mb-2">
          <v-switch
            v-model="showHistogram"
            label="Histogrammes"
            color="primary"
            density="compact"
            hide-details
            :disabled="!approxReady"
          />
          <v-switch
            v-model="showTrapezoids"
            label="Trapèzes"
            color="primary"
            density="compact"
            hide-details
            :disabled="!approxReady"
          />
        </div>

        <EChart
          :key="`${variable}-${year}-${countryCode}-${method}-${populationViewMode}-${approxPartitionMode}-${showHistogram}-${showTrapezoids}-${customBreakpoints.join(',')}`"
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

.method-toggle {
  height: auto;
}

.method-toggle :deep(.v-btn) {
  font-size: 0.75rem;
  letter-spacing: 0;
}

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
