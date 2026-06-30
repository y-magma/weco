<script setup lang="ts">
import type { GridPanelModel, PanneauType } from '~/composables/panneauTypes'
import { EXPLORATION_DISABLED_SOURCE_IDS } from '~/composables/usePanneauDataSource'
import { useGrilleGlobalParamsProvider } from '~/composables/useGrilleGlobalParams'
import type {
  GridPanelSnapshot,
  PanelStateSnapshot,
  ShareSourceMode,
} from '@application/share/shareSnapshot'

definePageMeta({ layout: 'default' })

type SourceMode = ShareSourceMode

let nextPanelId = 1

const route = useRoute()
const initialShare = decodeRouteShareSnapshot(route.query, 'grille')

function createPanelFromSnapshot(entry: GridPanelSnapshot): GridPanelModel {
  return {
    id: nextPanelId++,
    type: entry.type as PanneauType,
    sourceId: entry.sourceId,
  }
}

const initialPanels = initialShare?.page === 'grille' && initialShare.panels
  ? initialShare.panels.map(createPanelFromSnapshot)
  : []

const initialPanelSnapshots: PanelStateSnapshot[] = initialShare?.page === 'grille' && initialShare.panels
  ? initialShare.panels.map((entry) => entry.state)
  : []

const panels = ref<GridPanelModel[]>(initialPanels)
const sourceMode = ref<SourceMode>(
  initialShare?.page === 'grille' && initialShare.sourceMode
    ? initialShare.sourceMode
    : 'shared',
)
const isSharedSource = computed(() => sourceMode.value === 'shared')

const sharedSourceId = initialShare?.page === 'grille' && sourceMode.value === 'shared'
  ? initialShare.sourceId
  : undefined

const { sourceId } = usePanneauDataSourceProvider(sharedSourceId)
const { countriesError } = useCountriesProvider({ enabled: isSharedSource })
useGrilleGlobalParamsProvider()

function addPanel(type: PanneauType) {
  panels.value.push({
    id: nextPanelId++,
    type,
    sourceId: sourceId.value,
  })
}

function removePanel(id: number) {
  panels.value = panels.value.filter((panel) => panel.id !== id)
}

function movePanel(fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex) return
  if (fromIndex < 0 || toIndex < 0) return
  if (fromIndex >= panels.value.length || toIndex >= panels.value.length) return

  const next = [...panels.value]
  const [moved] = next.splice(fromIndex, 1)
  if (!moved) return
  next.splice(toIndex, 0, moved)
  panels.value = next
}

const draggedIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

function onDragStart(index: number, event: DragEvent) {
  draggedIndex.value = index
  event.dataTransfer?.setData('text/plain', String(index))
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

function onDragOver(index: number, event: DragEvent) {
  event.preventDefault()
  dragOverIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

function onDragLeave(index: number) {
  if (dragOverIndex.value === index) {
    dragOverIndex.value = null
  }
}

function onDrop(targetIndex: number, event: DragEvent) {
  event.preventDefault()
  const fromIndex = draggedIndex.value
  draggedIndex.value = null
  dragOverIndex.value = null
  if (fromIndex === null || fromIndex === targetIndex) return
  movePanel(fromIndex, targetIndex)
}

function onDragEnd() {
  draggedIndex.value = null
  dragOverIndex.value = null
}

function updatePanelSourceId(id: number, panelSourceId: string) {
  const panel = panels.value.find((item) => item.id === id)
  if (panel) {
    panel.sourceId = panelSourceId
  }
}

function onSourceModeChange(mode: SourceMode) {
  if (mode === 'per-panel') {
    for (const panel of panels.value) {
      panel.sourceId ??= sourceId.value
    }
    return
  }

  const firstPanelSource = panels.value.find((panel) => panel.sourceId)?.sourceId
  if (firstPanelSource) {
    sourceId.value = firstPanelSource
  }
}

watch(sourceMode, onSourceModeChange)

const hasExplorationPanel = computed(() =>
  panels.value.some((panel) => panel.type === 'exploration'),
)

const hasTimeSeriesPanel = computed(() =>
  panels.value.some((panel) => panel.type === 'temps' || panel.type === 'temps-compare'),
)

/** OECD réservé aux séries temporelles tant que le profil décile n'est pas prêt. */
const disabledSourceIds = computed(() =>
  isSharedSource.value && hasExplorationPanel.value && !hasTimeSeriesPanel.value
    ? EXPLORATION_DISABLED_SOURCE_IDS
    : [],
)

const sourceModeItems = [
  { title: 'Source unique', value: 'shared' as const, icon: 'mdi-database-sync-outline' },
  { title: 'Source par graphique', value: 'per-panel' as const, icon: 'mdi-view-grid-outline' },
]

useShareableUrlProvider({
  page: 'grille',
  buildSnapshot: (shareRegistry) => ({
    v: 1,
    page: 'grille',
    sourceId: sourceId.value,
    sourceMode: sourceMode.value,
    panels: panels.value.map((panel) => ({
      type: panel.type,
      sourceId: sourceMode.value === 'per-panel' ? panel.sourceId : undefined,
      state: shareRegistry.getSnapshot(`panel-${panel.id}`) ?? {},
    })),
  }),
  watchSources: [sourceId, sourceMode, panels],
})
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

    <v-row class="mb-4" align="center">
      <v-col cols="12" md="auto">
        <v-btn-toggle
          v-model="sourceMode"
          mandatory
          density="compact"
          color="primary"
          variant="outlined"
          divided
        >
          <v-btn
            v-for="item in sourceModeItems"
            :key="item.value"
            :value="item.value"
            :prepend-icon="item.icon"
          >
            {{ item.title }}
          </v-btn>
        </v-btn-toggle>
      </v-col>
      <v-col cols="12" md>
        <p class="text-body-2 text-medium-emphasis mb-0">
          <template v-if="isSharedSource">
            Tous les graphiques utilisent la même source de données.
          </template>
          <template v-else>
            Chaque graphique peut utiliser une source différente (WID, OECD, World Bank).
          </template>
        </p>
      </v-col>
    </v-row>

    <v-alert
      v-if="isSharedSource && countriesError"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ countriesError }}
    </v-alert>

    <PanneauDataSourceSection
      v-if="isSharedSource"
      v-model="sourceId"
      :disabled-source-ids="disabledSourceIds"
      class="mb-4"
    />

    <GrilleGlobalParamsPanel
      v-if="panels.length > 0"
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
        :class="{
          'panneau-grid__cell--dragging': draggedIndex === index,
          'panneau-grid__cell--drag-over': dragOverIndex === index && draggedIndex !== index,
        }"
        @dragover="onDragOver(index, $event)"
        @dragleave="onDragLeave(index)"
        @drop="onDrop(index, $event)"
      >
        <div class="panneau-grid__reorder-bar d-flex align-center ga-1 mb-2">
          <v-btn
            icon="mdi-drag"
            variant="text"
            size="x-small"
            draggable="true"
            aria-label="Déplacer ce panneau par glisser-déposer"
            class="panneau-grid__drag-handle"
            @dragstart="onDragStart(index, $event)"
            @dragend="onDragEnd"
          />
          <v-btn
            icon="mdi-chevron-up"
            variant="text"
            size="x-small"
            :disabled="index === 0"
            aria-label="Monter ce panneau"
            @click="movePanel(index, index - 1)"
          />
          <v-btn
            icon="mdi-chevron-down"
            variant="text"
            size="x-small"
            :disabled="index === panels.length - 1"
            aria-label="Descendre ce panneau"
            @click="movePanel(index, index + 1)"
          />
          <span class="text-caption text-medium-emphasis ms-1">
            Panneau {{ index + 1 }}
          </span>
        </div>
        <PanneauGridCell
          :panel="panel"
          :panel-index="index"
          :per-panel-source="!isSharedSource"
          :initial-snapshot="initialPanelSnapshots[index]"
          @remove="removePanel(panel.id)"
          @update:source-id="updatePanelSourceId(panel.id, $event)"
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
  transition: opacity 0.15s ease;
}

.panneau-grid__cell--dragging {
  opacity: 0.45;
}

.panneau-grid__cell--drag-over {
  outline: 2px dashed rgb(var(--v-theme-primary));
  outline-offset: 4px;
  border-radius: 8px;
}

.panneau-grid__drag-handle {
  cursor: grab;
}

.panneau-grid__drag-handle:active {
  cursor: grabbing;
}

.panneau-grid__cell :deep(.add-panel-tile) {
  flex: 1;
}
</style>
