<script setup lang="ts">
definePageMeta({ layout: 'default' })

const {
  countryCode,
  variableX,
  variableY,
  year,
  age,
  pop,
  logScaleX,
  logScaleY,
  countries,
  variables,
  ageOptions,
  popOptions,
  years,
  loading,
  error,
  sampleMode,
  points,
  scatterOption,
  load,
} = useWidScatter()
</script>

<template>
  <div>
    <v-row class="mb-2">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-1">Nuage de 2 variables</h1>
        <p class="text-body-1 text-medium-emphasis">
          Relation entre deux variables WID, <strong>jointes par percentile</strong> :
          un point = un g-percentile, à <strong>pays / année / âge / population</strong>
          fixés (mêmes <code>age</code>/<code>pop</code> pour les deux variables).
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
          <v-select
            v-model="year"
            :items="years"
            label="Année"
            hide-details
          />
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
      </v-row>
      <v-row dense class="mt-1">
        <v-col cols="12" md="4">
          <v-select
            v-model="variableX"
            :items="variables"
            item-title="label"
            item-value="sixlet"
            label="Variable X (abscisse)"
            prepend-inner-icon="mdi-axis-x-arrow"
            hide-details
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-select
            v-model="variableY"
            :items="variables"
            item-title="label"
            item-value="sixlet"
            label="Variable Y (ordonnée)"
            prepend-inner-icon="mdi-axis-y-arrow"
            hide-details
          />
        </v-col>
        <v-col cols="6" md="2" class="d-flex align-center">
          <v-switch
            v-model="logScaleX"
            label="log X"
            color="primary"
            density="compact"
            hide-details
          />
        </v-col>
        <v-col cols="6" md="2" class="d-flex align-center">
          <v-switch
            v-model="logScaleY"
            label="log Y"
            color="primary"
            density="compact"
            hide-details
          />
        </v-col>
      </v-row>
      <v-row dense>
        <v-spacer />
        <v-col cols="12" md="auto" class="d-flex justify-end">
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

    <v-card variant="outlined" class="pa-4">
      <div class="d-flex flex-wrap ga-2 mb-2">
        <v-chip size="small" color="primary" variant="tonal">Source : WID.world</v-chip>
        <v-chip size="small" variant="tonal">{{ points.length }} percentiles joints</v-chip>
      </div>
      <EChart
        :option="scatterOption"
        :loading="loading"
        :error="error"
        height="480px"
      />
    </v-card>
  </div>
</template>
