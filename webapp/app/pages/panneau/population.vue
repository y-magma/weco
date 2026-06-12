<script setup lang="ts">
import type { CountryOption } from '@src/domain/types'
import type { WidDataSource } from '@src/data-sources/wid/widSource'

definePageMeta({ layout: 'default' })

const { defaultSource } = useDataSources()
const countries = ref<CountryOption[]>([])
const countriesError = ref<string | null>(null)

const widSource = () => defaultSource.value as WidDataSource

provide('widCountries', countries)

onMounted(async () => {
  try {
    countries.value = await widSource().listCountries()
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
          Profil d’une variable WID sur les 127 g-percentiles, à pays et année fixés.
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

    <PanneauVisualisation
      :show-panel-title="false"
      chart-height="460px"
    />
  </div>
</template>
