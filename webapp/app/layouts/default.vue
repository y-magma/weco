<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDisplay } from 'vuetify'

const { mdAndUp } = useDisplay()

// Mobile-only drawer state. On desktop, keep the drawer always visible.
const mobileDrawer = ref(false)

const drawerModel = computed<boolean>({
  get() {
    return mdAndUp.value ? true : mobileDrawer.value
  },
  set(value) {
    if (!mdAndUp.value) mobileDrawer.value = value
  },
})

const navItems = [
  { title: 'Home', to: '/', icon: 'mdi-home' },
  { title: 'Cas d\'étude', to: '/panneau', icon: 'mdi-chart-bar' },
  { title: 'Grille de visualisations', to: '/grille', icon: 'mdi-view-grid-plus' },
  { title: 'Spécifications', to: '/spec', icon: 'mdi-file-document-multiple' },
  { title: 'Data Sources', to: '/sources', icon: 'mdi-database' },
  { title: 'CSV Import', to: '/csv', icon: 'mdi-file-delimited' },
]
</script>

<template>
  <v-app>
    <v-navigation-drawer
      v-model="drawerModel"
      :temporary="!mdAndUp"
      :permanent="mdAndUp"
    >
      <v-list-item
        title="Études de visualisation"
        subtitle="Distribution des richesses"
        class="py-4"
      />

      <v-divider />

      <v-list nav density="comfortable">
        <v-list-item
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          rounded="lg"
        />
      </v-list>
    </v-navigation-drawer>

    <v-app-bar flat border color="surface">
      <v-app-bar-nav-icon
        class="d-md-none"
        @click="mobileDrawer = !mobileDrawer"
      />
      <v-app-bar-title class="text-body-1 font-weight-bold">
        Études de visualisation
      </v-app-bar-title>
      <v-spacer />
      <v-btn
        href="https://wid.world/"
        target="_blank"
        rel="noopener"
        variant="text"
        prepend-icon="mdi-open-in-new"
      >
        WID.world
      </v-btn>
    </v-app-bar>

    <v-main class="bg-background">
      <v-container fluid class="page-container py-6">
        <slot />
      </v-container>
    </v-main>

    <v-footer app border class="text-caption text-medium-emphasis">
      Visualisation des données WID.world — panneaux et grilles de graphiques
    </v-footer>
  </v-app>
</template>
