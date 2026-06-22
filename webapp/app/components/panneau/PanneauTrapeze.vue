<script setup lang="ts">
import { buildDrillDownHelp, PROFILE_HELP } from '~/visualization/profileHelp'
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
  chartHeight: '420px',
  showDataSourceSection: true,
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
  derivedViewActive,
  approxPartitionMode,
  customBreakpoints,
  availableBoundaries,
  customPartitionValidation,
  customPartitionReady,
  customPartitionComplete,
  drillLevel,
  drillBreadcrumb,
  currentDrillableCode,
  canDrillDown,
  supportsDrillDown,
  drillTo,
  drillDownTop,
  handleChartClick,
  approxReady,
  approxIntervalLabels,
  isApproxIntervalVisible,
  toggleApproxIntervalVisibility,
  hiddenApproxIntervals,
  methodOptions,
  originalViewOptions,
  populationViewOptions,
  partitionViewOptions,
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
  profile,
  approximation,
  chartOption,
  variableMeta,
  intervalCountLabel,
  activeMethodHint,
  load,
} = state

const paramsInSidebar = inject<Ref<boolean>>('paramsInSidebar', ref(false))
const { sourceId, sourceLabel } = usePanneauDataSource()

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

const customIntervalLabels = computed(() =>
  describeCustomIntervals(customBreakpoints.value),
)

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

        <div class="mt-3">
          <div class="text-body-2 font-weight-medium mb-2">
            Courbe d'origine
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

        <div class="mt-3">
          <div class="text-body-2 font-weight-medium mb-2">
            Analyses dérivées
          </div>
          <div class="d-flex flex-wrap ga-2">
            <v-btn
              size="small"
              :color="lorenzCurve ? 'primary' : undefined"
              :variant="lorenzCurve ? 'flat' : 'outlined'"
              prepend-icon="mdi-chart-bell-curve-cumulative"
              :disabled="!profile || anyDensityActive"
              @click="toggleLorenzCurve"
            >
              Courbe intégrale
            </v-btn>
            <ProfileHelpButton
              :title="PROFILE_HELP.lorenzCurve.title"
              :paragraphs="PROFILE_HELP.lorenzCurve.paragraphs"
            />
          </div>
          <div class="d-flex flex-wrap ga-2 mt-2">
            <v-btn
              size="small"
              :color="empiricalCdf ? 'primary' : undefined"
              :variant="empiricalCdf ? 'flat' : 'outlined'"
              prepend-icon="mdi-chart-areaspline"
              :disabled="!profile || lorenzCurve"
              @click="toggleEmpiricalCdf"
            >
              CDF empirique
            </v-btn>
            <ProfileHelpButton
              :title="PROFILE_HELP.empiricalCdf.title"
              :paragraphs="PROFILE_HELP.empiricalCdf.paragraphs"
            />
          </div>
          <div class="d-flex flex-wrap ga-2 mt-2">
            <v-btn
              size="small"
              :color="empiricalPdf ? 'primary' : undefined"
              :variant="empiricalPdf ? 'flat' : 'outlined'"
              prepend-icon="mdi-chart-histogram"
              :disabled="!profile || lorenzCurve"
              @click="toggleEmpiricalPdf"
            >
              PDF empirique
            </v-btn>
            <ProfileHelpButton
              :title="PROFILE_HELP.empiricalPdf.title"
              :paragraphs="PROFILE_HELP.empiricalPdf.paragraphs"
            />
          </div>
          <div
            v-if="empiricalCdf || empiricalPdf"
            class="d-flex flex-wrap ga-2 mt-2 align-center"
          >
            <v-btn
              size="small"
              :color="showEmpiricalDistribution ? 'primary' : undefined"
              :variant="showEmpiricalDistribution ? 'flat' : 'outlined'"
              @click="showEmpiricalDistribution = !showEmpiricalDistribution"
            >
              Empirique
            </v-btn>
            <v-btn
              size="small"
              :color="showSmoothDistribution ? 'primary' : undefined"
              :variant="showSmoothDistribution ? 'flat' : 'outlined'"
              @click="showSmoothDistribution = !showSmoothDistribution"
            >
              Lissée
            </v-btn>
            <ProfileHelpButton
              :title="PROFILE_HELP.smoothDistribution.title"
              :paragraphs="PROFILE_HELP.smoothDistribution.paragraphs"
            />
          </div>
        </div>

        <div class="custom-partition-panel mt-3 pa-3 rounded border">
          <div class="d-flex align-center ga-1 mb-2">
            <span class="text-body-2 font-weight-medium">Intervalles d'approximation</span>
            <ProfileHelpButton
              title="Intervalles d'approximation"
              :paragraphs="[
                'Choisissez les tranches de population servant d\'intervalles d\'approximation : tranches fines (127 g-percentiles), pas fixe (1 %, 10 %, 25 %) ou personnalisées.',
                'En mode personnalisé, choisissez les bornes de fin de chaque intervalle parmi les pourcentages disponibles. Il n\'est pas nécessaire d\'aller jusqu\'à 100 %.',
                'Cliquez sur un intervalle dans « Visibilité des intervalles » pour le masquer ou l\'afficher sur le graphique.',
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
            <v-row dense align="center" class="mt-1">
              <v-col cols="12" sm="6" md="4">
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
              Choisissez au moins une borne de fin pour afficher l'approximation.
            </v-alert>
          </template>

          <div v-if="approxReady" class="mt-3">
            <v-btn
              size="x-small"
              variant="text"
              class="px-0"
              :prepend-icon="showIntervalVisibilityPanel ? 'mdi-chevron-up' : 'mdi-chevron-down'"
              @click="showIntervalVisibilityPanel = !showIntervalVisibilityPanel"
            >
              Visibilité des intervalles
              ({{ visibleApproxIntervalCount }}/{{ approxIntervalLabels.length }})
            </v-btn>
            <v-expand-transition>
              <div
                v-show="showIntervalVisibilityPanel"
                class="d-flex flex-wrap ga-1 mt-2"
              >
                <v-chip
                  v-for="(label, idx) in approxIntervalLabels"
                  :key="idx"
                  size="small"
                  :variant="isApproxIntervalVisible(idx) ? 'tonal' : 'outlined'"
                  :color="isApproxIntervalVisible(idx) ? 'primary' : 'default'"
                  :prepend-icon="isApproxIntervalVisible(idx) ? 'mdi-eye' : 'mdi-eye-off'"
                  class="interval-visibility-chip"
                  @click="toggleApproxIntervalVisibility(idx)"
                >
                  {{ label }}
                </v-chip>
              </div>
            </v-expand-transition>
          </div>
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

        <div v-if="profile" class="mb-2">
          <v-expansion-panels variant="accordion" density="compact">
            <v-expansion-panel>
              <v-expansion-panel-title class="text-body-2 py-2">
                Échelles
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <div class="d-flex align-center mb-1">
                  <v-switch
                    v-model="logRichZoom"
                    label="log zoom sur les riches"
                    color="primary"
                    density="compact"
                    hide-details
                    :disabled="lorenzCurve"
                  />
                  <ProfileHelpButton
                    title="Log zoom sur les riches"
                    :paragraphs="[
                      'Espacement logarithmique depuis le 100 % : les points sont placés en −log₁₀(100 − rang), graduations en rang % réel (0 % à gauche, 100 % à droite).',
                      'Permet de zoomer visuellement sur la queue haute de la distribution (ultra-riches) tout en gardant le sens d’affichage des axes.',
                    ]"
                  />
                </div>
                <div class="d-flex align-center mb-1">
                  <v-switch
                    v-model="logScaleX"
                    label="logX"
                    color="primary"
                    density="compact"
                    hide-details
                    :disabled="lorenzCurve"
                  />
                  <ProfileHelpButton
                    title="Échelle log (abscisse)"
                    :paragraphs="[
                      'Échelle logarithmique native ECharts sur le rang percentile (abscisse).',
                      'Seuls les rangs strictement positifs sont affichés ; rang 0 % masqué (trou dans la courbe).',
                    ]"
                  />
                </div>
                <div class="d-flex align-center">
                  <v-switch
                    v-model="logScaleY"
                    label="logY"
                    color="primary"
                    density="compact"
                    hide-details
                    :disabled="lorenzCurve"
                  />
                  <ProfileHelpButton
                    :title="PROFILE_HELP.logScaleY.title"
                    :paragraphs="[
                      ...PROFILE_HELP.logScaleY.paragraphs.slice(0, 1),
                      'Trapèzes : échelle logarithmique native sur la richesse — seules les valeurs strictement positives sont affichées (trou dans la courbe si ≤ 0).',
                    ]"
                  />
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>

        <div v-if="profile" class="d-flex align-center flex-wrap ga-3 mb-2">
          <v-switch
            v-model="showHistogram"
            label="Histogrammes"
            color="primary"
            density="compact"
            hide-details
            :disabled="!approxReady || derivedViewActive"
          />
          <v-switch
            v-model="showTrapezoids"
            label="Trapèzes"
            color="primary"
            density="compact"
            hide-details
            :disabled="!approxReady || derivedViewActive"
          />
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

.interval-visibility-chip {
  cursor: pointer;
}

.custom-partition-panel {
  border-color: rgba(var(--v-border-color), var(--v-border-opacity));
}

.method-toggle {
  height: auto;
}

.method-toggle :deep(.v-btn),
.original-view-toggle :deep(.v-btn) {
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
