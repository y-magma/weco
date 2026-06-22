<script setup lang="ts">
import type { CountryOption } from '@domain/entities'

const sourceId = defineModel<string>({ default: 'wid' })

const runtimeConfig = useRuntimeConfig()
const { sources, defaultSource } = useDataSources()

const sourceItems = computed(() =>
  sources.value.map((source) => ({
    title: source.label,
    value: source.id,
    props: { subtitle: source.description },
  })),
)

const onlyOneSource = computed(() => sourceItems.value.length <= 1)

const selectedSource = computed(() =>
  sources.value.find((source) => source.id === sourceId.value) ?? defaultSource.value,
)

const countries = inject<Ref<CountryOption[]>>('widCountries', ref([]))
const countriesError = inject<Ref<string | null>>('widCountriesError', ref(null))

const connectionStatus = computed(() => {
  if (countriesError.value) {
    return { label: 'Non connecté', color: 'error' as const }
  }
  if (sourceId.value === 'wid') {
    if (countries.value.length > 0) {
      return { label: 'Connecté', color: 'success' as const }
    }
    if (!runtimeConfig.public.widApiKey) {
      return { label: 'Clé API absente', color: 'warning' as const }
    }
    return { label: 'Connexion…', color: 'default' as const }
  }
  return { label: 'Connecté', color: 'success' as const }
})

const sourceHelpParagraphs = computed(() => [
  selectedSource.value.description,
  'En V1, seule WID.world est disponible. D\'autres sources (OECD, Eurostat, import CSV…) seront ajoutées ultérieurement.',
  'Changer de source réinitialisera les paramètres pays, variable, année, âge et population.',
])
</script>

<template>
  <div class="panneau-data-source-section pa-3 rounded border mb-3">
    <div class="d-flex align-center ga-1 mb-2">
      <span class="text-body-2 font-weight-medium">Source de données</span>
      <ProfileHelpButton
        title="Source de données"
        :paragraphs="sourceHelpParagraphs"
        hint="Choisir la base de données alimentant le graphique"
      />
    </div>

    <v-row dense align="center">
      <v-col cols="12" sm="8" md="6">
        <v-select
          v-model="sourceId"
          :items="sourceItems"
          item-title="title"
          item-value="value"
          label="Source"
          prepend-inner-icon="mdi-database-outline"
          density="compact"
          hide-details
          :disabled="onlyOneSource"
        />
      </v-col>
      <v-col cols="auto">
        <v-chip
          size="small"
          variant="tonal"
          :color="connectionStatus.color"
          prepend-icon="mdi-circle-medium"
        >
          {{ connectionStatus.label }}
        </v-chip>
      </v-col>
      <v-col cols="auto">
        <v-tooltip location="top">
          <template #activator="{ props: tooltipProps }">
            <span v-bind="tooltipProps">
              <v-btn
                size="small"
                variant="outlined"
                prepend-icon="mdi-file-upload-outline"
                disabled
              >
                Importer CSV
              </v-btn>
            </span>
          </template>
          Import CSV — bientôt disponible
        </v-tooltip>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.panneau-data-source-section {
  border-color: rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
