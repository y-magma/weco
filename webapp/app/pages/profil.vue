<script setup lang="ts">
definePageMeta({ layout: 'default' })

const {
  countryCode,
  variable,
  year,
  age,
  pop,
  chartType,
  logScaleY,
  xScale,
  countries,
  variables,
  ageOptions,
  popOptions,
  years,
  loading,
  error,
  sampleMode,
  profile,
  profileOption,
  load,
} = useWidProfile()

const chartTypes = [
  { value: 'bar', label: 'Bâtons' },
  { value: 'scatter', label: 'Nuage' },
  { value: 'line', label: 'Ligne' },
]

const xScales = [
  { value: 'category', label: 'Rang (catégorie)' },
  { value: 'tail', label: 'Queue haute log(1−p)' },
]
</script>

<template>
  <div>
    <v-row class="mb-2">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-1">Profil par centile</h1>
        <p class="text-body-1 text-medium-emphasis">
          Valeur d'une variable WID (moyenne <code>a…</code> ou seuil <code>t…</code>)
          à travers les 127 g-percentiles, à <strong>pays / année / âge / population</strong> fixés.
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
        <v-col cols="12" md="3">
          <v-select
            v-model="variable"
            :items="variables"
            item-title="label"
            item-value="sixlet"
            label="Variable"
            prepend-inner-icon="mdi-variable"
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
      <v-row dense class="mt-1 align-center">
        <v-col cols="12" md="auto">
          <div class="text-caption text-medium-emphasis mb-1">Type</div>
          <v-btn-toggle v-model="chartType" mandatory density="comfortable" divided>
            <v-btn
              v-for="type in chartTypes"
              :key="type.value"
              :value="type.value"
              size="small"
            >
              {{ type.label }}
            </v-btn>
          </v-btn-toggle>
        </v-col>
        <v-col cols="12" md="auto">
          <div class="text-caption text-medium-emphasis mb-1">Axe X</div>
          <v-btn-toggle v-model="xScale" mandatory density="comfortable" divided>
            <v-btn
              v-for="scale in xScales"
              :key="scale.value"
              :value="scale.value"
              size="small"
            >
              {{ scale.label }}
            </v-btn>
          </v-btn-toggle>
        </v-col>
        <v-col cols="12" md="auto" class="d-flex align-end">
          <v-switch
            v-model="logScaleY"
            label="Échelle log (ordonnée)"
            color="primary"
            density="compact"
            hide-details
            class="mt-4"
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

      <v-expand-transition>
        <p
          v-if="logScaleY"
          class="text-caption text-medium-emphasis mt-2 mb-0"
        >
          <v-icon size="x-small" icon="mdi-information-outline" /> Échelle log : les
          valeurs ≤ 0 (ex. patrimoine net négatif en bas de distribution) sont
          masquées (trou), elles ne peuvent pas être tracées en log.
        </p>
      </v-expand-transition>
    </v-card>

    <v-card variant="outlined" class="pa-4">
      <div class="d-flex flex-wrap ga-2 mb-2">
        <v-chip v-if="profile" size="small" color="primary" variant="tonal">
          Source : WID.world
        </v-chip>
        <v-chip v-if="profile?.unit" size="small" variant="tonal">
          Unité : {{ profile.unit }}
        </v-chip>
        <v-chip v-if="profile" size="small" variant="tonal">
          {{ profile.points.length }} g-percentiles
        </v-chip>
        <v-chip v-if="profile" size="small" variant="tonal">
          {{ profile.kind === 'average' ? 'Moyenne (a…)' : profile.kind === 'threshold' ? 'Seuil (t…)' : 'Autre' }}
        </v-chip>
      </div>
      <EChart
        :option="profileOption"
        :loading="loading"
        :error="error"
        height="460px"
      />
    </v-card>
  </div>
</template>
