<script setup lang="ts">
import { buildDrillDownHelp, PROFILE_HELP } from '~/visualization/profileHelp'
import {
  formatBoundaryLabel,
  selectableCustomBoundaries,
  validateNextCustomBreakpoint,
} from '~/visualization/populationPartition'
import type { CountryOption } from '@domain/entities'
import type { PanneauType } from '~/composables/panneauTypes'
import { PANNEAU_EXPLORATION_EXTENDED_KEY } from '~/composables/panneauExplorationExtendedContext'

export type PanneauLayout = 'tri-column' | 'stacked'

const props = withDefaults(defineProps<{
  panelIndex?: number
  removable?: boolean
  collapsible?: boolean
  panelType?: PanneauType
  defaultFiltersExpanded?: boolean
  chartHeight?: string
  showDataSourceSection?: boolean
  layout?: PanneauLayout
}>(), {
  panelIndex: 0,
  removable: false,
  collapsible: false,
  panelType: undefined,
  defaultFiltersExpanded: true,
  chartHeight: '420px',
  showDataSourceSection: true,
  layout: 'tri-column',
})

const emit = defineEmits<{ remove: [] }>()

const countries = inject<Ref<CountryOption[]>>('panelCountries')
if (!countries) {
  throw new Error('PanneauExploration requires a panelCountries provider')
}

const { selectedSource, sourceId, sourceLabel } = usePanneauDataSource()
const initialVariable = selectedSource.value.indicators?.[props.panelIndex ?? 0]?.id ?? 'ahweal'
const state = createExplorationPanelState({
  countries,
  initialVariable,
  panelIndex: props.panelIndex,
})

const {
  countryCode,
  variable,
  year,
  age,
  pop,
  method,
  showHistogram,
  showTrapezoids,
  logRichZoom,
  logScaleX,
  logScaleY,
  originalViewMode,
  populationViewMode,
  lorenzCurve,
  empiricalCdf,
  empiricalPdf,
  showEmpiricalDistribution,
  showSmoothDistribution,
  approxPartitionMode,
  customBreakpoints,
  availableBoundaries,
  customPartitionComplete,
  drillLevel,
  drillBreadcrumb,
  currentDrillableCode,
  canDrillDown,
  supportsDrillDown,
  drillTo,
  drillDownTop,
  handleChartClick,
  approxIntervalLabels,
  isApproxIntervalVisible,
  hiddenApproxIntervals,
  originalViewOptions,
  populationViewOptions,
  variables,
  ageOptions,
  popOptions,
  countries: countryItems,
  years,
  yearsLoading,
  yearRangeLabel,
  paramAdjustmentHints,
  adjustmentToastVisible,
  adjustmentToastMessage,
  loading,
  error: panelError,
  profile,
  approximation,
  chartOption,
  variableMeta,
  intervalCountLabel,
  load,
  hasPercentileProfile,
  hasDecileProfileOnly,
  hasProfile,
  decileProfileHelp,
} = state

const customBreakpointInput = ref<number | null>(null)
const customBreakpointError = ref<string | null>(null)
const showIntervalVisibilityPanel = ref(false)

const toggleLorenzCurve = () => {
  lorenzCurve.value = !lorenzCurve.value
}

const toggleEmpiricalCdf = () => {
  empiricalCdf.value = !empiricalCdf.value
}

const toggleEmpiricalPdf = () => {
  empiricalPdf.value = !empiricalPdf.value
}

const anyDensityActive = computed(() =>
  empiricalCdf.value || empiricalPdf.value,
)

const drillDownHelp = computed(() => buildDrillDownHelp(currentDrillableCode.value))

const visibleApproxIntervalCount = computed(() =>
  approxIntervalLabels.value.filter((_, idx) => isApproxIntervalVisible(idx)).length,
)

const selectableBoundaries = computed(() =>
  selectableCustomBoundaries(customBreakpoints.value, availableBoundaries.value),
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

const addCustomBreakpoint = (value: number | null) => {
  if (value == null) return
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

watch(approxPartitionMode, () => {
  showIntervalVisibilityPanel.value = false
})

provide(PANNEAU_EXPLORATION_EXTENDED_KEY, {
  state,
  customBreakpointInput,
  customBreakpointError,
  showIntervalVisibilityPanel,
  selectableBoundaries,
  selectableBoundaryItems,
  customPartitionReadyHint,
  nextBoundaryHint,
  onCustomBoundarySelected,
  removeLastCustomBreakpoint,
  resetCustomBreakpoints,
  toggleLorenzCurve,
  toggleEmpiricalCdf,
  toggleEmpiricalPdf,
  anyDensityActive,
  visibleApproxIntervalCount,
})

onMounted(() => {
  void state.init()
})
</script>

<template>
  <div
    class="panneau-exploration"
    :class="layout === 'stacked' ? 'panneau--stacked' : 'panneau--tri-column'"
  >
    <div class="panneau__layout">
      <div class="panneau__params-left">
        <PanneauFiltersShell
          :collapsible="collapsible"
          :panel-type="panelType ?? 'exploration'"
          :removable="removable"
          :default-expanded="defaultFiltersExpanded"
          @remove="emit('remove')"
        >
          <PanneauDataSourceSection v-if="showDataSourceSection" v-model="sourceId" />

          <v-alert
            v-if="!hasProfile"
            type="info"
            variant="tonal"
            density="compact"
            class="mb-3"
          >
            Cette source ne propose pas de profil de distribution.
          </v-alert>

          <v-alert
            v-if="hasDecileProfileOnly"
            type="info"
            variant="tonal"
            density="compact"
            class="mb-3"
          >
            {{ decileProfileHelp }}
          </v-alert>

          <v-row dense class="panel-filters-stack">
            <v-col cols="12">
              <v-autocomplete
                v-model="countryCode"
                :items="countryItems"
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
            <v-col cols="12">
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

          <div v-if="hasPercentileProfile" class="mt-3">
            <v-expansion-panels variant="accordion" density="compact">
              <v-expansion-panel>
                <v-expansion-panel-title class="text-body-2 py-2">
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
          </div>

          <div class="mt-3">
            <div class="text-body-2 font-weight-medium mb-2">
              Graphiques
            </div>
            <v-btn-toggle
              v-model="originalViewMode"
              mandatory
              divided
              color="primary"
              variant="outlined"
              density="compact"
              class="original-view-toggle flex-wrap"
            >
              <v-btn
                v-for="opt in originalViewOptions"
                :key="opt.value"
                :value="opt.value"
                size="small"
              >
                {{ opt.label }}
              </v-btn>
            </v-btn-toggle>
          </div>

          <PanneauExplorationExtendedParams v-if="hasPercentileProfile && layout !== 'stacked'" scales-only />

          <PanneauExplorationExtendedParams v-if="hasPercentileProfile && layout === 'stacked'" />

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
              Source : {{ sourceLabel }}
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

          <div
            v-if="supportsDrillDown"
            class="d-flex align-center flex-wrap justify-space-between ga-2 mb-2"
          >
            <div class="d-flex align-center flex-wrap ga-1">
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

          <EChart
            :key="`${variable}-${year}-${countryCode}-${method}-${originalViewMode}-${populationViewMode}-${approxPartitionMode}-${drillLevel}-${logRichZoom}-${logScaleX}-${logScaleY}-${showHistogram}-${showTrapezoids}-${lorenzCurve}-${empiricalCdf}-${empiricalPdf}-${showEmpiricalDistribution}-${showSmoothDistribution}-${customBreakpoints.join(',')}-${[...hiddenApproxIntervals].join(',')}`"
            :option="chartOption"
            :loading="loading"
            :error="panelError"
            :height="chartHeight"
            @chart-click="handleChartClick"
          />
        </v-card>
      </div>

      <div v-if="hasPercentileProfile && layout !== 'stacked'" class="panneau__params-right">
        <v-card variant="outlined" class="pa-3 panneau-params-right">
          <PanneauExplorationExtendedParams :show-scales-section="false" />
        </v-card>
      </div>
    </div>
  </div>

  <WidParamAdjustmentToast
    v-model="adjustmentToastVisible"
    :message="adjustmentToastMessage"
  />
</template>

<style scoped>
.original-view-toggle :deep(.v-btn) {
  font-size: 0.75rem;
  letter-spacing: 0;
}
</style>
