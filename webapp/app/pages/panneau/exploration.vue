<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { sourceId } = usePanneauDataSourceProvider()
const { countriesError } = useCountriesProvider()
</script>

<template>
  <div>
    <PanneauBackLink />

    <v-row class="mb-2">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-1">Profil d'inégalité et approximations</h1>
        <p class="text-body-1 text-medium-emphasis mb-0">
          Visualiser la répartition dans la population et approximer la courbe par des trapèzes et des rectangles conservant la moyenne sur chaque intervalle choisi.
        </p>
      </v-col>
    </v-row>

    <v-alert
      v-if="countriesError"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ countriesError }}
    </v-alert>

    <PanneauDataSourceSection v-model="sourceId" class="mb-4" />

    <PanneauExploration
      chart-height="460px"
      :show-data-source-section="false"
    />
  </div>
</template>
