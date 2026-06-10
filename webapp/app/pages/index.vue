<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const features = [
  {
    icon: 'mdi-chart-bar',
    title: 'Boie à outils de visus',
    text: 'Valeur d’une variable WID (moyenne a… ou seuil t…) à travers les 127 g-percentiles, avec bascule lin/log et zoom queue haute.',
    to: '/profil',
  },
  {
    icon: 'mdi-chart-scatter-plot',
    title: 'Nuage 2 variables',
    text: 'Relation entre deux variables jointes par percentile : un point = un g-percentile, mêmes age/pop.',
    to: '/nuage',
  },
  {
    icon: 'mdi-view-grid',
    title: 'Multi-panneaux',
    text: 'Plusieurs profils en parallèle pour comparer variables, pays ou années d’un coup d’œil.',
    to: '/panneaux',
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
          sur les 127 g-percentiles : profils moyens et seuils, nuages joints par
          percentile et comparaisons multi-panneaux. Construit avec Nuxt, Vuetify
          et ECharts.
        </p>
        <div class="d-flex flex-wrap ga-3">
          <v-btn color="primary" size="large" to="/profil">
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
          <h2 class="text-h6 mb-2">Version 1</h2>
          <p class="text-body-2">
            Source unique WID.world, filtres age/pop obligatoires, tri des
            g-percentiles par rang, échelles lin/log avec garde-fou sur les
            valeurs négatives. Données d’exemple hors-ligne, live via clé API.
          </p>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col
        v-for="feature in features"
        :key="feature.title"
        cols="12"
        md="4"
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
