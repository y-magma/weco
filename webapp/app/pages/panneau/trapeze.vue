<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { countriesError } = useWidCountriesProvider()
</script>

<template>
  <div>
    <PanneauBackLink />

    <v-row class="mb-2">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-1">Approximation par trapèzes et rectangles</h1>
        <p class="text-body-1 text-medium-emphasis mb-0">
          Approximer une courbe WID par des trapèzes et des rectangles conservant la moyenne sur chaque intervalle choisi.
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

    <PanneauTrapeze chart-height="460px" />
  </div>
</template>
