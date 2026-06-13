<script setup lang="ts">
import type { CountryOption } from '@domain/entities'

definePageMeta({ layout: 'default' })

const app = useApplication()
const countries = ref<CountryOption[]>([])
const countriesError = ref<string | null>(null)

provide('widCountries', countries)

onMounted(async () => {
  try {
    countries.value = await app.listCountries.execute()
  } catch (err) {
    countriesError.value = err instanceof Error ? err.message : 'Échec du chargement des pays'
  }
})
</script>

<template>
  <div>
    <PanneauBackLink />

    <v-row class="mb-2">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-1">Variable vs population</h1>
        <p class="text-body-1 text-medium-emphasis mb-0">
          Profil WID sur les 127 g-percentiles : distribution d’une variable par part de population.
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

    <PanneauVisualisation chart-height="460px" />
  </div>
</template>
