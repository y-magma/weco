<script setup lang="ts">
import type { CountryOption } from '@domain/entities'
import { formatBoundaryLabel } from '~/visualization/populationPartition'
import { TIME_SERIES_COMPARE_CUSTOM_SENTINEL } from '~/visualization/timeSeriesPartition'

withDefaults(defineProps<{
  chartHeight?: string
  showDataSourceSection?: boolean
}>(), {
  chartHeight: '380px',
  showDataSourceSection: true,
})

const countries = inject<Ref<CountryOption[]>>('widCountries')
if (!countries) {
  throw new Error('PanneauSerieTemporelleCompare requires a widCountries provider')
}

const paramsInSidebar = inject<Ref<boolean>>('paramsInSidebar', ref(false))
const { sourceId, sourceLabel } = usePanneauDataSource()

const state = createWidSeriesCompareState({ countries })

const {
  countryCodes,
  variable,
  percentile,
  customLo,
  customHi,
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
  load,
} = state

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
    :class="{ 'panneau--sidebar-mode': paramsInSidebar }"
  >
    <div class="panneau__filters">
    <PanneauFiltersShell
      panel-type="temps"
      :default-expanded="true"
    >
      <PanneauDataSourceSection v-if="showDataSourceSection" v-model="sourceId" />

      <div class="text-subtitle-2 font-weight-medium mb-2">
        Comparaison multi-pays — une tranche de population
      </div>

      <v-row dense class="panel-filters-row align-start">
        <v-col class="panel-filters-row__item">
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
            :items="populationOptions"
            item-title="label"
            item-value="value"
            label="Tranche de population"
            density="compact"
            hide-details
          />
        </v-col>
      </v-row>

      <v-expand-transition>
        <div
          v-if="percentile === TIME_SERIES_COMPARE_CUSTOM_SENTINEL"
          class="custom-partition-panel mt-2 pa-3 rounded border"
        >
          <div class="text-body-2 font-weight-medium mb-2">
            Tranche personnalisée
          </div>
          <p class="text-body-2 text-medium-emphasis mb-3">
            Choisissez les bornes de population à comparer entre les pays.
            <br>
            Exemple : 50 % et 90 % → intervalle ]50 %, 90 %].
          </p>

          <v-row dense>
            <v-col cols="12" sm="6">
              <v-select
                v-model="customLo"
                :items="loBoundaryItems"
                item-title="title"
                item-value="value"
                label="Borne basse"
                density="compact"
                hide-details="auto"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                v-model="customHi"
                :items="hiBoundaryItems"
                item-title="title"
                item-value="value"
                label="Borne haute"
                density="compact"
                hide-details="auto"
              />
            </v-col>
          </v-row>

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
        :key="`${variable}-${activePercentileCode ?? percentile}-${countryCodes.join(',')}`"
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
