<script setup lang="ts">
definePageMeta({ layout: 'default' })

const {
  countryCode,
  year,
  age,
  pop,
  logScaleY,
  panelCount,
  panelVariables,
  maxPanels,
  colSpan,
  countries,
  variables,
  ageOptions,
  popOptions,
  years,
  loading,
  error,
  sampleMode,
  panels,
  setPanelVariable,
  load,
} = useWidPanels()

const panelCounts = Array.from({ length: maxPanels }, (_, i) => i + 1)
</script>

<template>
  <div>
    <v-row class="mb-2">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-1">Multi-panneaux</h1>
        <p class="text-body-1 text-medium-emphasis">
          Plusieurs profils en parallèle, à <strong>pays / année / âge / population</strong>
          partagés. Choisissez le nombre de graphes et la variable de chaque panneau.
        </p>
      </v-col>
    </v-row>

    <v-alert
      v-if="sampleMode"
      type="info"
      variant="tonal"
      density="comfortable"
      class="mb-4"
      icon="mdi-flask-outline"
    >
      Données d'exemple (hors-ligne). Renseignez <code>NUXT_PUBLIC_WID_API_KEY</code>
      dans <code>.env</code> pour activer les données live WID.world.
    </v-alert>

    <v-card variant="outlined" class="mb-6 pa-4">
      <v-row dense>
        <v-col cols="12" md="3">
          <v-select
            v-model="countryCode"
            :items="countries"
            item-title="label"
            item-value="code"
            label="Pays"
            prepend-inner-icon="mdi-earth"
            hide-details
          />
        </v-col>
        <v-col cols="6" md="2">
          <v-select v-model="year" :items="years" label="Année" hide-details />
        </v-col>
        <v-col cols="6" md="2">
          <v-select
            v-model="age"
            :items="ageOptions"
            item-title="label"
            item-value="value"
            label="Âge"
            hide-details
          />
        </v-col>
        <v-col cols="6" md="2">
          <v-select
            v-model="pop"
            :items="popOptions"
            item-title="label"
            item-value="value"
            label="Population"
            hide-details
          />
        </v-col>
        <v-col cols="6" md="3">
          <v-select
            v-model.number="panelCount"
            :items="panelCounts"
            label="Nombre de panneaux"
            prepend-inner-icon="mdi-view-grid-plus"
            hide-details
          />
        </v-col>
      </v-row>
      <v-row dense class="mt-1 align-center">
        <v-col cols="12" md="auto" class="d-flex align-end">
          <v-switch
            v-model="logScaleY"
            label="Échelle log (ordonnée) — tous les panneaux"
            color="primary"
            density="compact"
            hide-details
            class="mt-2"
          />
        </v-col>
        <v-spacer />
        <v-col cols="12" md="auto" class="d-flex justify-end align-end">
          <v-btn
            color="primary"
            variant="tonal"
            :loading="loading"
            prepend-icon="mdi-refresh"
            @click="load"
          >
            Rafraîchir
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </v-alert>

    <v-row>
      <v-col
        v-for="(panel, index) in panels"
        :key="index"
        cols="12"
        :md="colSpan"
      >
        <v-card variant="outlined" class="pa-4 h-100">
          <v-select
            :model-value="panelVariables[index]"
            :items="variables"
            item-title="label"
            item-value="sixlet"
            label="Variable du panneau"
            density="compact"
            hide-details
            class="mb-3"
            @update:model-value="(value) => setPanelVariable(index, value)"
          />
          <EChart
            :option="panel.option"
            :loading="loading"
            height="340px"
          />
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
