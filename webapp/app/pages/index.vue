<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const features = [
  {
    icon: 'mdi-chart-timeline-variant',
    title: 'Compare indicators',
    text: 'Overlay inequality metrics and stress proxies on interactive time-series charts.',
  },
  {
    icon: 'mdi-earth',
    title: 'Plug external APIs',
    text: 'Start with WID.world and extend the registry with World Bank, OECD, or custom endpoints.',
  },
  {
    icon: 'mdi-file-delimited',
    title: 'Import CSV data',
    text: 'Use the CSV reader factory to load local datasets and map columns to chart fields.',
  },
]
</script>

<template>
  <div>
    <v-row class="mb-8">
      <v-col cols="12" md="7">
        <h1 class="text-h3 font-weight-bold mb-4">
          Compare economic data & stress hypotheses
        </h1>
        <p class="text-body-1 text-medium-emphasis mb-6">
          A public dashboard skeleton built with Nuxt, Vuetify, and ECharts.
          Explore income inequality from
          <a href="https://wid.world/" target="_blank" rel="noopener">WID.world</a>,
          test stress hypothesis scenarios, and import your own CSV datasets.
        </p>
        <div class="d-flex flex-wrap ga-3">
          <v-btn color="primary" size="large" to="/dashboard">
            Open dashboard
          </v-btn>
          <v-btn variant="outlined" size="large" to="/csv">
            Import CSV
          </v-btn>
        </div>
      </v-col>
      <v-col cols="12" md="5">
        <v-card variant="tonal" color="primary" class="pa-6 h-100">
          <v-icon icon="mdi-lightbulb-on-outline" size="36" class="mb-4" />
          <h2 class="text-h6 mb-2">Stress hypothesis</h2>
          <p class="text-body-2">
            Test whether rising top-income shares correlate with social stress
            proxies. Configure hypotheses as data, not hard-coded UI logic.
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
        <v-card class="h-100 pa-5" variant="outlined">
          <v-icon :icon="feature.icon" color="primary" size="32" class="mb-3" />
          <h3 class="text-h6 mb-2">{{ feature.title }}</h3>
          <p class="text-body-2 text-medium-emphasis">{{ feature.text }}</p>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
