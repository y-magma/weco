<script setup lang="ts">
import type { GridPanelModel } from '~/composables/panneauTypes'
import type { PanelStateSnapshot } from '@application/share/shareSnapshot'

const props = defineProps<{
  panel: GridPanelModel
  panelIndex: number
  initialSnapshot?: PanelStateSnapshot
}>()

const emit = defineEmits<{
  remove: []
  'update:sourceId': [sourceId: string]
}>()

const { sourceId } = usePanneauDataSourceProvider(props.panel.sourceId)
useCountriesProvider()

watch(sourceId, (id) => {
  emit('update:sourceId', id)
}, { immediate: true })

const shareKey = computed(() => `panel-${props.panelIndex}`)

const panelProps = computed(() => ({
  panelIndex: props.panelIndex,
  shareKey: shareKey.value,
  initialSnapshot: props.initialSnapshot,
  collapsible: true,
  layout: 'stacked' as const,
  panelType: props.panel.type,
  defaultFiltersExpanded: false,
  showDataSourceSection: true,
  removable: true,
}))
</script>

<template>
  <PanneauSerieTemporelle
    v-if="panel.type === 'temps'"
    v-bind="panelProps"
    @remove="emit('remove')"
  />
  <PanneauSerieTemporelleCompare
    v-else-if="panel.type === 'temps-compare'"
    v-bind="panelProps"
    @remove="emit('remove')"
  />
  <PanneauExploration
    v-else-if="panel.type === 'exploration'"
    v-bind="panelProps"
    @remove="emit('remove')"
  />
</template>
