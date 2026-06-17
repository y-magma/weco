<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { countriesError } = useWidCountriesProvider()
</script>

<template>
  <div>
    <PanneauBackLink />

    <v-row class="mb-2">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-1">Série temporelle</h1>
        <p class="text-body-1 text-medium-emphasis mb-0">
          Suivre un indicateur année après année.
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

    <PanneauSerieTemporelle chart-height="420px" />

    <v-divider class="my-6" />

    <v-row class="mb-2">
      <v-col cols="12">
        <h2 class="text-h5 font-weight-bold mb-1">Comparaison multi-pays</h2>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Comparer la même tranche de population sur plusieurs pays.
        </p>
      </v-col>
    </v-row>

    <PanneauSerieTemporelleCompare chart-height="420px" />
  </div>
</template>
