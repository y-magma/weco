<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

// Drawer visibility — togglable on all screen sizes.
const drawerOpen = ref(true)
const route = useRoute()

// True only on the sub-pages of /panneau (not the index listing)
const isPanneauSubPage = computed(() =>
  route.path.startsWith('/panneau/'),
)

// When the nav drawer is collapsed on a panneau sub-page, show filters in sidebar mode
const paramsInSidebar = computed(() => !drawerOpen.value && isPanneauSubPage.value)

provide('paramsInSidebar', paramsInSidebar)

const navItems = [
  { title: 'Home', to: '/', icon: 'mdi-home' },
  { title: 'Cas d\'étude', to: '/panneau', icon: 'mdi-chart-bar' },
  { title: 'Grille de visualisations', to: '/grille', icon: 'mdi-view-grid-plus' },
]

const docItems = [
  { title: 'Spécifications', to: '/spec', icon: 'mdi-file-document-multiple' },
  { title: 'Data Sources', to: '/sources', icon: 'mdi-database' },
  { title: 'CSV Import', to: '/csv', icon: 'mdi-file-delimited' },
]
</script>

<template>
  <v-app>
    <v-navigation-drawer v-model="drawerOpen">
      <v-list-item
        title="Boîte à outils de visualisations"
        subtitle="Distribution des richesses"
        class="py-4"
      />

      <v-divider />

      <v-list nav density="comfortable" open-strategy="multiple">
        <v-list-item
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          rounded="lg"
        />

        <v-list-group value="documentation">
          <template #activator="{ props }">
            <v-list-item
              v-bind="props"
              prepend-icon="mdi-book-open-variant"
              title="Documentation"
              rounded="lg"
            />
          </template>
          <v-list-item
            v-for="item in docItems"
            :key="item.to"
            :to="item.to"
            :prepend-icon="item.icon"
            :title="item.title"
            rounded="lg"
          />
        </v-list-group>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar flat border color="surface">
      <v-app-bar-nav-icon @click="drawerOpen = !drawerOpen" />
      <v-app-bar-title class="text-body-1 font-weight-bold">
        Boîte à outils de visualisations
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
