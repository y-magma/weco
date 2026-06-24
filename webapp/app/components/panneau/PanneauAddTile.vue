<script setup lang="ts">
import { PANNEAU_TYPES, type PanneauType } from '~/composables/panneauTypes'

const emit = defineEmits<{ add: [type: PanneauType] }>()

const dialogOpen = ref(false)

function openDialog() {
  dialogOpen.value = true
}

function chooseType(type: PanneauType) {
  dialogOpen.value = false
  emit('add', type)
}
</script>

<template>
  <v-card
    variant="outlined"
    class="add-panel-tile d-flex flex-column align-center justify-center text-center pa-6"
    role="button"
    tabindex="0"
    aria-label="Ajouter un panneau de visualisation"
    @click="openDialog"
    @keydown.enter="openDialog"
    @keydown.space.prevent="openDialog"
  >
    <v-icon size="56" color="primary" icon="mdi-plus" />
    <p class="text-body-1 text-medium-emphasis mt-4 mb-0">
      Ajouter un panneau
    </p>
  </v-card>

  <v-dialog
    v-model="dialogOpen"
    max-width="480"
  >
    <v-card title="Choisir un type de panneau">
      <v-card-text class="pb-0">
        <v-list density="comfortable" class="py-0">
          <v-list-item
            v-for="panel in PANNEAU_TYPES"
            :key="panel.id"
            :prepend-icon="panel.icon"
            rounded="lg"
            @click="chooseType(panel.id)"
          >
            <v-list-item-title>{{ panel.title }}</v-list-item-title>
            <v-list-item-subtitle>{{ panel.subtitle }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="dialogOpen = false">
          Annuler
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.add-panel-tile {
  min-height: 280px;
  cursor: pointer;
  border-style: dashed !important;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.add-panel-tile:hover,
.add-panel-tile:focus-visible {
  border-color: rgb(var(--v-theme-primary)) !important;
  background-color: rgba(var(--v-theme-primary), 0.04);
}
</style>
