<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const features = [
  {
    icon: 'mdi-chart-bar',
    title: 'Exploration des données',
    text: 'Méthodes d\'exploration : séries temporelles et profil d\'inégalité avec approximations.',
    to: '/panneau',
  },
  {
    icon: 'mdi-view-grid-plus',
    title: 'Grille de visualisations',
    text: 'Composez une grille de panneaux de visualisation en parallèle — ajoutez autant de panneaux que nécessaire.',
    to: '/grille',
  },
]
</script>

<template>
  <div>
    <v-row class="mb-8">
      <v-col cols="12" md="7">
        <h1 class="text-h3 font-weight-bold mb-4">
          Explorer la distribution des richesses (WID)
        </h1>
        <p class="text-body-1 text-medium-emphasis mb-6">
          Visualisez les données de
          <a href="https://wid.world/" target="_blank" rel="noopener">WID.world</a>
          sur les 127 g-percentiles : profils, grilles de visualisations
          composables. Construit avec Nuxt, Vuetify et ECharts.
        </p>
        <div class="d-flex flex-wrap ga-3">
          <v-btn color="primary" size="large" to="/panneau">
            Ouvrir l’explorateur
          </v-btn>
          <v-btn variant="outlined" size="large" to="/spec">
            Voir la spécification
          </v-btn>
        </div>
      </v-col>
      <v-col cols="12" md="5">
        <v-card variant="tonal" color="primary" class="pa-6 h-100">
          <v-icon icon="mdi-database-search-outline" size="36" class="mb-4" />
          <h2 class="text-h6 mb-2">Version</h2>
          <p class="text-body-2">
            Données WID.world en direct (clé API). Exploration des données :
            profils moyen ou seuil sur les 127 g-percentiles, vues densité de
            population et de probabilité, échelles lin/log, zoom sur la queue
            de distribution. Grille de visualisations pour composer plusieurs
            panneaux en parallèle.
          </p>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col
        v-for="feature in features"
        :key="feature.title"
        cols="12"
        md="6"
      >
        <v-card
          class="h-100 pa-5"
          variant="outlined"
          :to="feature.to"
          hover
        >
          <v-icon :icon="feature.icon" color="primary" size="32" class="mb-3" />
          <h3 class="text-h6 mb-2">{{ feature.title }}</h3>
          <p class="text-body-2 text-medium-emphasis">{{ feature.text }}</p>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
