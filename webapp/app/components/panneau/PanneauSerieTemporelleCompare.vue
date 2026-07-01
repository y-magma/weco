<script setup lang="ts">
import type { CountryOption } from '@domain/entities'
import type { PanneauType } from '~/composables/panneauTypes'
import { formatBoundaryLabel } from '~/visualization/populationPartition'
import { TIME_SERIES_COMPARE_CUSTOM_SENTINEL } from '~/visualization/timeSeriesPartition'
import type { TimeSeriesComparePanelSnapshot } from '@application/share/shareSnapshot'
import { useGrilleGlobalParamsConsumer } from '~/composables/useGrilleGlobalParams'
import { useGrilleGlobalParamsApply } from '~/composables/useGrilleGlobalParamsApply'

export type PanneauLayout = 'split-column' | 'stacked'

const props = withDefaults(defineProps<{
  panelIndex?: number
  shareKey?: string
  initialSnapshot?: TimeSeriesComparePanelSnapshot
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
  throw new Error('PanneauSerieTemporelleCompare requires a panelCountries provider')
}

const { selectedSource } = usePanneauDataSource()
const initialVariable = selectedSource.value.indicators?.[props.panelIndex ?? 0]?.id ?? 'ahweal'
const state = createTimeSeriesComparePanelState({
  countries: panelCountries,
  initialVariable,
  initialSnapshot: props.initialSnapshot,
  panelIndex: props.panelIndex,
})

const {
  countryCodes,
  variable,
  percentile,
  customLo,
  customHi,
  countries,
  availableBoundaries,
  customIntervalValidation,
  activePercentileCode,
  age,
  pop,
  variables,
  ageOptions,
  popOptions,
  populationOptions,
  loading,
  error: panelError,
  loadWarning,
  seriesList,
  chartOption,
  variableMeta,
  yearCountLabel,
  yearRangeLabel,
  paramsLoading,
  hasPercentileProfile,
  hasDecileProfile,
  isDecileBundle,
  decileSubSelection,
  decileBundleOptions,
  decileBundleConfig,
  load,
} = state

const resolvedShareKey = computed(() => props.shareKey ?? `panel-${props.panelIndex}`)
const { triggerSync } = useShareablePanelRegistration(
  resolvedShareKey.value,
  () => state.serializeSnapshot(),
)

watch(() => state.serializeSnapshot(), () => triggerSync(), { deep: true })

// Surcharges globales provenant de la page /grille.
// Pour le panneau comparaison, le pays global remplace tous les pays sélectionnés par un unique pays.
const globalOverrides = useGrilleGlobalParamsConsumer()
const isInGrille = globalOverrides !== null
if (globalOverrides) {
  useGrilleGlobalParamsApply(globalOverrides, { countryCodes, variable, age, pop })
}

const { sourceId, sourceLabel } = usePanneauDataSource()

const boundaryItems = computed(() =>
  availableBoundaries.map((value) => ({
    title: formatBoundaryLabel(value),
    value,
  })),
)

const loBoundaryItems = computed(() =>
  boundaryItems.value.filter((item) => item.value < customHi.value),
)

const hiBoundaryItems = computed(() =>
  boundaryItems.value.filter((item) => item.value > customLo.value),
)

onMounted(() => {
  void state.init()
})
</script>

<template>
  <div
    class="panneau-serie-temporelle-compare"
    :class="layout === 'stacked' ? 'panneau--stacked' : 'panneau--split-column'"
  >
    <div class="panneau__layout">
      <div class="panneau__params-left">
        <PanneauFiltersShell
          :collapsible="collapsible"
          :panel-type="panelType ?? 'temps-compare'"
          :removable="removable"
          :default-expanded="defaultFiltersExpanded"
          @remove="emit('remove')"
        >
          <PanneauDataSourceSection v-if="showDataSourceSection" v-model="sourceId" />

          <p class="text-body-2 text-medium-emphasis mb-3">
            <template v-if="hasPercentileProfile">
              Comparer la même tranche de population entre plusieurs pays.
            </template>
            <template v-else-if="hasDecileProfile && isDecileBundle">
              Comparer un ratio inter-déciles OECD entre plusieurs pays.
            </template>
            <template v-else>
              Comparer la même variable entre plusieurs pays.
            </template>
          </p>

          <v-row dense class="panel-filters-stack">
            <v-col cols="12">
              <v-autocomplete
                v-model="countryCodes"
                :items="countries"
                item-title="label"
                item-value="code"
                label="Pays"
                prepend-inner-icon="mdi-earth"
                placeholder="Comparer plusieurs pays…"
                multiple
                chips
                closable-chips
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
            <v-col v-if="hasPercentileProfile" cols="12">
              <v-select
                v-model="percentile"
                :items="populationOptions"
                item-title="label"
                item-value="value"
                label="Tranche de population"
                density="compact"
                hide-details
              />
            </v-col>
            <v-col v-if="hasDecileProfile && isDecileBundle" cols="12">
              <v-select
                v-model="decileSubSelection"
                :items="decileBundleOptions"
                item-title="label"
                item-value="id"
                :label="decileBundleConfig?.subSelectorLabel ?? 'Sous-indicateur'"
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
            class="mt-0 mb-0"
          >
            {{ decileBundleConfig?.seriesSubtitle ?? 'Bundle décile' }}
          </v-alert>

          <v-expand-transition>
            <div
              v-if="hasPercentileProfile && percentile === TIME_SERIES_COMPARE_CUSTOM_SENTINEL"
              class="custom-partition-panel mt-3 pa-3 rounded border"
            >
              <div class="text-body-2 font-weight-medium mb-2">
                Tranche personnalisée
              </div>
              <p class="text-body-2 text-medium-emphasis mb-3">
                Choisissez les bornes de population à comparer entre les pays.
                <br>
                Exemple : 50 % et 90 % → intervalle ]50 %, 90 %].
              </p>

              <v-select
                v-model="customLo"
                :items="loBoundaryItems"
                item-title="title"
                item-value="value"
                label="Borne basse"
                density="compact"
                hide-details="auto"
                class="mb-3"
              />
              <v-select
                v-model="customHi"
                :items="hiBoundaryItems"
                item-title="title"
                item-value="value"
                label="Borne haute"
                density="compact"
                hide-details="auto"
              />

              <v-alert
                v-if="customIntervalValidation.valid && activePercentileCode"
                type="success"
                density="compact"
                variant="tonal"
                class="mt-3"
              >
                Tranche : ]{{ formatBoundaryLabel(customLo) }}, {{ formatBoundaryLabel(customHi) }}]
              </v-alert>
              <v-alert
                v-else-if="customIntervalValidation.error"
                type="warning"
                density="compact"
                variant="tonal"
                class="mt-3"
              >
                {{ customIntervalValidation.error }}
              </v-alert>
            </div>
          </v-expand-transition>

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
            <v-chip v-if="seriesList.length" size="x-small" color="primary" variant="tonal">
              Source : {{ sourceLabel }}
            </v-chip>
            <v-chip v-if="variableMeta?.unit" size="x-small" variant="tonal">
              Unité : {{ variableMeta.unit }}
            </v-chip>
            <v-chip v-if="seriesList.length" size="x-small" variant="tonal">
              {{ seriesList.length }} pays
            </v-chip>
            <v-chip v-if="yearRangeLabel" size="x-small" variant="tonal">
              Plage : {{ yearRangeLabel }}
            </v-chip>
            <v-chip v-if="yearCountLabel" size="x-small" variant="tonal">
              {{ yearCountLabel }}
            </v-chip>
          </div>

          <EChart
            :key="`${variable}-${countryCodes.join(',')}`"
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
</style>
