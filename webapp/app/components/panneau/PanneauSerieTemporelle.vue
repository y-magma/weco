<script setup lang="ts">
import {
  formatBoundaryLabel,
  selectableCustomBoundaries,
  validateNextCustomBreakpoint,
} from '~/visualization/populationPartition'
import type { CountryOption } from '@domain/entities'
import type { PanneauType } from '~/composables/panneauTypes'
import type { TimeSeriesPanelSnapshot } from '@application/share/shareSnapshot'
import { useGrilleGlobalParamsConsumer } from '~/composables/useGrilleGlobalParams'
import { useGrilleGlobalParamsApply } from '~/composables/useGrilleGlobalParamsApply'
import { buildTimeSeriesStackHelp, TIME_SERIES_HELP } from '~/visualization/timeSeriesHelp'

export type PanneauLayout = 'split-column' | 'stacked'

const props = withDefaults(defineProps<{
  panelIndex?: number
  shareKey?: string
  initialSnapshot?: TimeSeriesPanelSnapshot
  removable?: boolean
  collapsible?: boolean
  panelType?: PanneauType
  defaultFiltersExpanded?: boolean
  chartHeight?: string
  showDataSourceSection?: boolean
  layout?: PanneauLayout
}>(), {
  panelIndex: 0,
  shareKey: undefined,
  initialSnapshot: undefined,
  removable: false,
  collapsible: false,
  panelType: undefined,
  defaultFiltersExpanded: true,
  chartHeight: '380px',
  showDataSourceSection: true,
  layout: 'split-column',
})

const emit = defineEmits<{ remove: [] }>()

const panelCountries = inject<Ref<CountryOption[]>>('panelCountries')
if (!panelCountries) {
  throw new Error('PanneauSerieTemporelle requires a panelCountries provider')
}

const state = createTimeSeriesPanelState({
  countries: panelCountries,
  initialSnapshot: props.initialSnapshot,
  panelIndex: props.panelIndex,
})

const {
  countryCode,
  variable,
  age,
  pop,
  partitionMode,
  customBreakpoints,
  stackMode,
  countries,
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
  scalarSeries,
  chartOption,
  variableMeta,
  yearCountLabel,
  yearRangeLabel,
  paramsLoading,
  trancheCountLabel,
  hasPercentileProfile,
  hasDecileProfile,
  isDecileBundle,
  decileBundleConfig,
  load,
} = state

const resolvedShareKey = computed(() => props.shareKey ?? `panel-${props.panelIndex}`)
const { triggerSync } = useShareablePanelRegistration(
  resolvedShareKey.value,
  () => state.serializeSnapshot(),
)

watch(() => state.serializeSnapshot(), () => triggerSync(), { deep: true })

// Surcharges globales provenant de la page /grille
const globalOverrides = useGrilleGlobalParamsConsumer()
const isInGrille = globalOverrides !== null
if (globalOverrides) {
  useGrilleGlobalParamsApply(globalOverrides, { countryCode, variable, age, pop })
}

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

const customPartitionReadyHint = computed(() => {
  if (!customPartitionComplete.value) {
    return 'Vous pouvez ajouter d\'autres bornes ou étendre jusqu\'à 100 %.'
  }
  return ''
})

const nextBoundaryHint = computed(() => {
  const last = customBreakpoints.value.length > 0
    ? customBreakpoints.value[customBreakpoints.value.length - 1]!
    : 0
  return `Borne de fin après ${formatBoundaryLabel(last)}`
})

const activeStackHelp = computed(() => buildTimeSeriesStackHelp(stackMode.value))

const stackModeBanner = computed(() =>
  hasPercentileProfile.value && trancheSeriesByCountry.value.length > 0 && stackMode.value === 'weighted'
    ? 'Valeurs tracées = moyenne WID × part de population (voir ?)'
    : null,
)

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
    :class="layout === 'stacked' ? 'panneau--stacked' : 'panneau--split-column'"
  >
    <div class="panneau__layout">
      <div class="panneau__params-left">
        <PanneauFiltersShell
          :collapsible="collapsible"
          :panel-type="panelType ?? 'temps'"
          :removable="removable"
          :default-expanded="defaultFiltersExpanded"
          @remove="emit('remove')"
        >
          <PanneauDataSourceSection v-if="showDataSourceSection" v-model="sourceId" />

          <v-row dense class="panel-filters-stack">
            <v-col cols="12">
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
            <v-col cols="12">
              <v-select
                v-model="variable"
                :items="variables"
                item-title="label"
                item-value="id"
                group-by="groupLabel"
                label="Variable"
                density="compact"
                hide-details
              />
            </v-col>
          </v-row>

          <v-alert
            v-if="hasDecileProfile && isDecileBundle"
            type="info"
            variant="tonal"
            density="compact"
            class="mt-3 mb-0"
          >
            {{ decileBundleConfig?.seriesSubtitle ?? 'Bundle décile' }}
          </v-alert>

          <div
            v-if="hasPercentileProfile"
            class="custom-partition-panel mt-3 pa-3 rounded border"
          >
            <div class="text-body-2 font-weight-medium mb-2 d-flex align-center ga-1">
              Tranches de population
              <ProfileHelpButton
                :title="TIME_SERIES_HELP.widTranches.title"
                :paragraphs="TIME_SERIES_HELP.widTranches.paragraphs"
                :hint="TIME_SERIES_HELP.widTranches.hint"
              />
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

              <v-alert
                v-if="customBreakpoints.length > 0 && customPartitionValidation.error"
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

            <div
              v-if="partitionMode === 'custom' && customPartitionReady"
              class="mt-3 d-flex align-center justify-end ga-2"
            >
              <v-tooltip
                location="top"
                :disabled="!customPartitionReadyHint"
                :text="customPartitionReadyHint"
              >
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
          </div>

          <v-expansion-panels
            v-if="hasPercentileProfile && !isInGrille"
            variant="accordion"
            density="compact"
            class="mt-3"
          >
            <v-expansion-panel>
              <v-expansion-panel-title class="text-body-2 py-2">
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
            <v-chip v-if="trancheSeriesByCountry.length || scalarSeries.length" size="x-small" color="primary" variant="tonal">
              Source : {{ sourceLabel }}
            </v-chip>
            <v-chip v-if="variableMeta?.concept" size="x-small" variant="tonal">
              Concept : {{ variableMeta.concept }}
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
            class="d-flex flex-wrap align-center justify-space-between ga-1 mb-2"
          >
            <div class="d-flex flex-wrap ga-1">
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

            <div class="d-flex align-center ga-1 stack-mode-controls">
              <v-btn-toggle
                v-model="stackMode"
                density="compact"
                variant="outlined"
                mandatory
                rounded="lg"
                class="stack-mode-toggle"
              >
                <v-btn value="weighted" size="x-small">
                  <v-icon start size="14" icon="mdi-chart-areaspline" />
                  Pondéré
                </v-btn>
                <v-btn value="raw" size="x-small">
                  <v-icon start size="14" icon="mdi-chart-bar-stacked" />
                  Valeurs réelles
                </v-btn>
              </v-btn-toggle>
              <ProfileHelpButton
                :title="activeStackHelp.title"
                :paragraphs="activeStackHelp.paragraphs"
                :hint="activeStackHelp.hint"
              />
            </div>
          </div>

          <v-alert
            v-if="stackModeBanner"
            type="info"
            variant="tonal"
            density="compact"
            class="mb-2"
          >
            {{ stackModeBanner }}
          </v-alert>

          <div
            v-if="hasDecileProfile && isDecileBundle && scalarSeries.length > 0"
            class="d-flex align-center ga-1 mb-2"
          >
            <span class="text-caption text-medium-emphasis">Parts empilées sans transformation</span>
            <ProfileHelpButton
              :title="TIME_SERIES_HELP.decileShares.title"
              :paragraphs="TIME_SERIES_HELP.decileShares.paragraphs"
              :hint="TIME_SERIES_HELP.decileShares.hint"
            />
          </div>

          <EChart
            :key="`${variable}-${countryCode}`"
            :option="chartOption"
            :loading="loading"
            :error="panelError"
            :height="chartHeight"
          />
        </v-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-partition-panel {
  border-color: rgba(var(--v-border-color), var(--v-border-opacity));
}

.stack-mode-toggle {
  flex-shrink: 0;
}

.stack-mode-controls {
  flex-shrink: 0;
}

.custom-partition-actions {
  padding-top: 0;
}
</style>
