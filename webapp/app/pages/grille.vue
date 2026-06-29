<script setup lang="ts">
import type { PanneauType } from '~/composables/panneauTypes'
import { EXPLORATION_DISABLED_SOURCE_IDS } from '~/composables/usePanneauDataSource'

definePageMeta({ layout: 'default' })

interface GridPanel {
  id: number
  type: PanneauType
}

let nextPanelId = 1

const panels = ref<GridPanel[]>([])
const { sourceId } = usePanneauDataSourceProvider()
const { countriesError } = useCountriesProvider()

function addPanel(type: PanneauType) {
  panels.value.push({ id: nextPanelId++, type })
}

function removePanel(id: number) {
  panels.value = panels.value.filter((panel) => panel.id !== id)
}

const hasExplorationPanel = computed(() =>
  panels.value.some((panel) => panel.type === 'exploration'),
)

const hasTimeSeriesPanel = computed(() =>
  panels.value.some((panel) => panel.type === 'temps' || panel.type === 'temps-compare'),
)

/** OECD réservé aux séries temporelles tant que le profil décile n'est pas prêt. */
const disabledSourceIds = computed(() =>
  hasExplorationPanel.value && !hasTimeSeriesPanel.value
    ? EXPLORATION_DISABLED_SOURCE_IDS
    : [],
)
</script>

<template>
  <div>
    <v-row class="mb-4">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-1">Grille de visualisations</h1>
        <p class="text-body-1 text-medium-emphasis mb-0">
          Composez plusieurs explorations en parallèle — séries temporelles
          (un pays ou comparaison multi-pays) et profil d'inégalité avec approximations.
        </p>
      </v-col>
    </v-row>

    <v-alert
      v-if="countriesError"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ countriesError }}
    </v-alert>

    <PanneauDataSourceSection
      v-model="sourceId"
      :disabled-source-ids="disabledSourceIds"
      class="mb-4"
    />

    <div
      v-if="panels.length === 0"
      class="empty-grid d-flex align-center justify-center"
    >
      <div class="empty-grid__slot">
        <PanneauAddTile @add="addPanel" />
      </div>
    </div>

    <v-row v-else class="panneau-grid">
      <v-col
        v-for="(panel, index) in panels"
        :key="panel.id"
        cols="12"
        md="6"
        class="panneau-grid__cell"
      >
        <PanneauSerieTemporelle
          v-if="panel.type === 'temps'"
          :panel-index="index"
          collapsible
          layout="stacked"
          :panel-type="panel.type"
          :default-filters-expanded="false"
          :show-data-source-section="false"
          removable
          @remove="removePanel(panel.id)"
        />
        <PanneauSerieTemporelleCompare
          v-else-if="panel.type === 'temps-compare'"
          :panel-index="index"
          collapsible
          layout="stacked"
          :panel-type="panel.type"
          :default-filters-expanded="false"
          :show-data-source-section="false"
          removable
          @remove="removePanel(panel.id)"
        />
        <PanneauExploration
          v-else-if="panel.type === 'exploration'"
          :panel-index="index"
          collapsible
          layout="stacked"
          :panel-type="panel.type"
          :default-filters-expanded="false"
          :show-data-source-section="false"
          removable
          @remove="removePanel(panel.id)"
        />
      </v-col>

      <v-col cols="12" md="6" class="panneau-grid__cell">
        <PanneauAddTile @add="addPanel" />
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.empty-grid {
  min-height: 60vh;
}

.empty-grid__slot {
  width: 100%;
  max-width: 420px;
  padding: 0 16px;
}

.panneau-grid__cell {
  display: flex;
  flex-direction: column;
}

.panneau-grid__cell :deep(.add-panel-tile) {
  flex: 1;
}
</style>
