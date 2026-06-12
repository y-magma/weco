<script setup lang="ts">
import { PANNEAU_TYPES } from '~/composables/panneauTypes'
</script>

<template>
  <div>
    <v-row class="mb-4">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-1">Panneau de visualisations</h1>
        <p class="text-body-1 text-medium-emphasis mb-0">
          Choisissez un type de boîte à outils pour explorer les données WID.world.
        </p>
      </v-col>
    </v-row>

    <v-row>
      <v-col
        v-for="panel in PANNEAU_TYPES"
        :key="panel.id"
        cols="12"
        md="4"
      >
        <v-card
          class="h-100 pa-5"
          variant="outlined"
          :to="panel.route"
          hover
        >
          <v-icon :icon="panel.icon" color="primary" size="36" class="mb-3" />
          <h2 class="text-h6 mb-1">{{ panel.title }}</h2>
          <p class="text-caption text-medium-emphasis mb-2">{{ panel.subtitle }}</p>
          <p class="text-body-2 text-medium-emphasis mb-0">{{ panel.text }}</p>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
