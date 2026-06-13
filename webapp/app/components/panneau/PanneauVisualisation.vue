<script setup lang="ts">
import { buildActiveCalculationHelp, buildDrillDownHelp, PROFILE_HELP } from '~/visualization/profileHelp'
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

const initialVariable = WID_PROFILE_VARIABLES[props.panelIndex ?? 0]?.sixlet ?? 'ahweal'
const state = createWidProfileState({ countries, initialVariable })

const {
  countryCode,
  variable,
  year,
  age,
  pop,
  chartType,
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
  showAllPercentiles,
  drillTo,
  drillDownTop,
  handleChartClick,
  profile,
  profileOption,
  profilePointCountLabel,
  profilePartialData,
  load,
} = state

const chartTypes = [
  { value: 'bar', label: 'Bandes' },
  { value: 'scatter', label: 'Nuage' },
  { value: 'line', label: 'Ligne' },
]

const activeCalculationHelp = computed(() => buildActiveCalculationHelp({
  chartType: chartType.value,
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
  <div class="panneau-visualisation">
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
        Panneau de visualisation
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
                <div class="d-flex align-center ga-1 mb-1">
                  <span class="text-caption text-medium-emphasis">Type</span>
                  <ProfileHelpButton
                    :title="PROFILE_HELP.chartType.title"
                    :paragraphs="PROFILE_HELP.chartType.paragraphs"
                  />
                </div>
                <v-btn-toggle v-model="chartType" mandatory density="compact" divided class="mb-3">
                  <v-btn
                    v-for="type in chartTypes"
                    :key="type.value"
                    :value="type.value"
                    size="x-small"
                  >
                    {{ type.label }}
                  </v-btn>
                </v-btn-toggle>

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
            label="Comment sont calculées mes données ?"
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

    <v-card variant="outlined" class="pa-3">
      <div class="d-flex flex-wrap ga-2 mb-2">
        <v-chip v-if="profile" size="x-small" color="primary" variant="tonal">
          Source : WID.world
        </v-chip>
        <v-chip v-if="profile?.unit" size="x-small" variant="tonal">
          Unité : {{ profile.unit }}
        </v-chip>
        <v-chip
          v-if="profilePointCountLabel"
          size="x-small"
          :color="profilePartialData ? 'warning' : undefined"
          variant="tonal"
        >
          {{ profilePointCountLabel }}
        </v-chip>
      </div>

      <div class="d-flex flex-wrap align-center justify-space-between ga-2 mb-2">
        <div v-if="!showAllPercentiles" class="d-flex align-center flex-wrap ga-1">
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
        <div v-else class="d-flex align-center ga-1">
          <span class="text-body-2 font-weight-medium">Vue détaillée — 127 g-percentiles</span>
          <ProfileHelpButton
            :title="PROFILE_HELP.showAllPercentiles.title"
            :paragraphs="PROFILE_HELP.showAllPercentiles.paragraphs"
            hint="Affichage des 127 g-percentiles"
          />
        </div>

        <div class="d-flex align-center ga-2">
          <v-btn
            v-if="canDrillDown"
            size="x-small"
            variant="tonal"
            color="primary"
            prepend-icon="mdi-magnify-plus-outline"
            @click="drillDownTop"
          >
            Zoomer sur {{ currentDrillableCode }}
          </v-btn>
          <v-switch
            v-model="showAllPercentiles"
            label="127 g-percentiles"
            color="primary"
            density="compact"
            hide-details
          />
          <ProfileHelpButton
            v-if="!showAllPercentiles"
            :title="PROFILE_HELP.showAllPercentiles.title"
            :paragraphs="PROFILE_HELP.showAllPercentiles.paragraphs"
            hint="Afficher les 127 g-percentiles"
          />
        </div>
      </div>

      <EChart
        :key="`${lorenzCurve}-${populationDensity}-${probabilityDensity}-${chartType}-${drillLevel}-${showAllPercentiles}`"
        :option="profileOption"
        :loading="loading"
        :error="panelError"
        :height="chartHeight"
        @chart-click="handleChartClick"
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
