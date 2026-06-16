<script setup lang="ts">
import type { CountryOption } from '@domain/entities'
import type { PanneauType } from '~/composables/panneauTypes'

definePageMeta({ layout: 'default' })

interface GridPanel {
  id: number
  type: PanneauType
}

let nextPanelId = 1

const app = useApplication()
const panels = ref<GridPanel[]>([])
const countries = ref<CountryOption[]>([])
const countriesError = ref<string | null>(null)

function addPanel(type: PanneauType) {
  panels.value.push({ id: nextPanelId++, type })
}

function removePanel(id: number) {
  panels.value = panels.value.filter((panel) => panel.id !== id)
}

provide('widCountries', countries)

onMounted(async () => {
  try {
    countries.value = await app.listCountries.execute()
  } catch (err) {
    countriesError.value = err instanceof Error ? err.message : 'Échec du chargement des pays'
  }
})
</script>

<template>
  <div>
    <v-row class="mb-4">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-1">Grille de visualisations</h1>
        <p class="text-body-1 text-medium-emphasis mb-0">
          Composez plusieurs études en parallèle — série temporelle,
          relation entre deux indicateurs ou inégalités et profil.
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
          :panel-type="panel.type"
          :default-filters-expanded="false"
          removable
          @remove="removePanel(panel.id)"
        />
        <PanneauNuageVariables
          v-else-if="panel.type === 'variables'"
          :panel-index="index"
          collapsible
          :panel-type="panel.type"
          :default-filters-expanded="false"
          removable
          @remove="removePanel(panel.id)"
        />
        <PanneauVisualisation
          v-else
          :panel-index="index"
          collapsible
          :panel-type="panel.type"
          :default-filters-expanded="false"
          removable
          :show-panel-title="false"
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
