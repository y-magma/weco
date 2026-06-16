<script setup lang="ts">
import { findPanneauType, type PanneauType } from '~/composables/panneauTypes'

const props = withDefaults(defineProps<{
  collapsible?: boolean
  panelType?: PanneauType
  removable?: boolean
  defaultExpanded?: boolean
}>(), {
  collapsible: false,
  panelType: undefined,
  removable: false,
  defaultExpanded: true,
})

const emit = defineEmits<{ remove: [] }>()

const expanded = ref(props.defaultExpanded)

const typeMeta = computed(() =>
  props.panelType ? findPanneauType(props.panelType) : null,
)

const showHeader = computed(() =>
  props.collapsible || props.removable || Boolean(typeMeta.value),
)

function toggleExpanded() {
  expanded.value = !expanded.value
}
</script>

<template>
  <v-card variant="outlined" class="mb-4 pa-3 panneau-filters-shell">
    <div
      v-if="showHeader"
      class="panneau-filters-shell__header d-flex align-center ga-2"
      :class="{ 'panneau-filters-shell__header--clickable': collapsible }"
      @click="collapsible ? toggleExpanded() : undefined"
    >
      <v-btn
        v-if="collapsible"
        :icon="expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
        variant="text"
        size="small"
        :aria-label="expanded ? 'Replier les filtres' : 'Déplier les filtres'"
        @click.stop="toggleExpanded"
      />

      <template v-if="typeMeta">
        <v-icon :icon="typeMeta.icon" size="small" color="primary" class="flex-shrink-0" />
        <span class="text-subtitle-2 font-weight-medium text-truncate">
          {{ typeMeta.title }}
        </span>
      </template>

      <v-spacer />

      <v-btn
        v-if="removable"
        icon="mdi-close"
        variant="text"
        size="small"
        aria-label="Retirer ce panneau"
        @click.stop="emit('remove')"
      />
    </div>

    <v-expand-transition>
      <div
        v-show="!collapsible || expanded"
        class="panneau-filters-shell__body"
        :class="{ 'mt-2': showHeader }"
      >
        <slot />
      </div>
    </v-expand-transition>
  </v-card>
</template>

<style scoped>
.panneau-filters-shell__header--clickable {
  cursor: pointer;
  user-select: none;
}

.panneau-filters-shell__header--clickable:hover {
  opacity: 0.85;
}
</style>
