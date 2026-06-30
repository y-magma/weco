<script setup lang="ts">
import type { GridPanelModel } from '~/composables/panneauTypes'
import type { PanelStateSnapshot } from '@application/share/shareSnapshot'

const props = withDefaults(defineProps<{
  panel: GridPanelModel
  panelIndex: number
  perPanelSource?: boolean
  initialSnapshot?: PanelStateSnapshot
}>(), {
  perPanelSource: false,
  initialSnapshot: undefined,
})

const emit = defineEmits<{
  remove: []
  'update:sourceId': [sourceId: string]
}>()

const shareKey = computed(() => `panel-${props.panel.id}`)

const sharedPanelProps = computed(() => ({
  panelIndex: props.panelIndex,
  shareKey: shareKey.value,
  initialSnapshot: props.initialSnapshot,
  collapsible: true,
  layout: 'stacked' as const,
  panelType: props.panel.type,
  defaultFiltersExpanded: false,
  showDataSourceSection: false,
  removable: true,
}))
</script>

<template>
  <PanneauGridCellScoped
    v-if="perPanelSource"
    :panel="panel"
    :panel-index="panelIndex"
    :initial-snapshot="initialSnapshot"
    @remove="emit('remove')"
    @update:source-id="emit('update:sourceId', $event)"
  />
  <PanneauSerieTemporelle
    v-else-if="panel.type === 'temps'"
    v-bind="sharedPanelProps"
    @remove="emit('remove')"
  />
  <PanneauSerieTemporelleCompare
    v-else-if="panel.type === 'temps-compare'"
    v-bind="sharedPanelProps"
    @remove="emit('remove')"
  />
  <PanneauExploration
    v-else-if="panel.type === 'exploration'"
    v-bind="sharedPanelProps"
    @remove="emit('remove')"
  />
</template>
