<script setup lang="ts">
import { buildActiveCalculationHelp, PROFILE_HELP } from '@src/charts/profileHelp'

definePageMeta({ layout: 'default' })

const {
  countryCode,
  variable,
  year,
  age,
  pop,
  chartType,
  logScaleY,
  logScaleX,
  populationDensity,
  probabilityDensity,
  countries,
  variables,
  ageOptions,
  popOptions,
  years,
  loading,
  error,
  sampleMode,
  valueZoomRange,
  valueZoomStep,
  profileValueExtent,
  drillLevel,
  drillBreadcrumb,
  currentDrillableCode,
  canDrillDown,
  showAllPercentiles,
  drillTo,
  drillDownTop,
  handleChartClick,
  profile,
  profileOption,
  load,
} = useWidProfile()

function formatValue(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 0 })
}

const chartTypes = [
  { value: 'bar', label: 'Bâtons' },
  { value: 'scatter', label: 'Nuage' },
  { value: 'line', label: 'Ligne' },
]

const activeCalculationHelp = computed(() => buildActiveCalculationHelp({
  chartType: chartType.value,
  logScaleX: logScaleX.value,
  logScaleY: logScaleY.value,
  populationDensity: populationDensity.value,
  probabilityDensity: probabilityDensity.value,
  profile: profile.value,
}))
</script>

<template>
  <div>
    <v-row class="mb-2">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-1">Boite à outils de visus</h1>
        <p class="text-body-1 text-medium-emphasis">
          Valeur d'une variable WID (moyenne <code>a…</code> ou seuil <code>t…</code>)
          à travers les 127 g-percentiles, à <strong>pays / année / âge / population</strong> fixés.
          En mode <strong>Bâtons</strong>, chaque tranche <code>pᵢpₖ</code> est une bande
          sur l'intervalle <code>]i %, k %]</code>.
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
          <div class="d-flex align-center ga-1 mb-1">
            <span class="text-caption text-medium-emphasis">Type</span>
            <ProfileHelpButton
              :title="PROFILE_HELP.chartType.title"
              :paragraphs="PROFILE_HELP.chartType.paragraphs"
            />
          </div>
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

        <v-col cols="12" md="auto" class="d-flex align-center">
          <v-switch
            v-model="populationDensity"
            label="Densité de population"
            color="primary"
            density="compact"
            hide-details
            class="mt-4"
          />
          <ProfileHelpButton
            class="mt-4"
            :title="PROFILE_HELP.populationDensity.title"
            :paragraphs="PROFILE_HELP.populationDensity.paragraphs"
          />
        </v-col>

        <v-col cols="12" md="auto" class="d-flex align-center">
          <v-switch
            v-model="probabilityDensity"
            label="Densité de probabilité"
            color="primary"
            density="compact"
            hide-details
            class="mt-4"
          />
          <ProfileHelpButton
            class="mt-4"
            :title="PROFILE_HELP.probabilityDensity.title"
            :paragraphs="PROFILE_HELP.probabilityDensity.paragraphs"
          />
        </v-col>

        <v-col cols="12" md="auto" class="d-flex align-center">
          <v-switch
            v-model="logScaleX"
            label="Échelle log (abscisse)"
            color="primary"
            density="compact"
            hide-details
            class="mt-4"
          />
          <ProfileHelpButton
            class="mt-4"
            :title="PROFILE_HELP.logScaleX.title"
            :paragraphs="PROFILE_HELP.logScaleX.paragraphs"
          />
        </v-col>

        <v-col cols="12" md="auto" class="d-flex align-center">
          <v-switch
            v-model="logScaleY"
            label="Échelle log (ordonnée)"
            color="primary"
            density="compact"
            hide-details
            class="mt-4"
          />
          <ProfileHelpButton
            class="mt-4"
            :title="PROFILE_HELP.logScaleY.title"
            :paragraphs="PROFILE_HELP.logScaleY.paragraphs"
          />
        </v-col>

        <v-spacer />

        <v-col cols="12" md="auto" class="d-flex align-center justify-end ga-2 mt-4">
          <ProfileHelpButton
            :title="activeCalculationHelp.title"
            :paragraphs="activeCalculationHelp.paragraphs"
            label="Comment sont calculées mes données ?"
            hint="Récapitulatif selon les options actives"
          />
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

      <v-row v-if="profileValueExtent" dense class="mt-2">
        <v-col cols="12">
          <p class="text-body-2 font-weight-medium mb-2">Plage de valeurs affichée</p>
          <v-range-slider
            v-model="valueZoomRange"
            :min="profileValueExtent.min"
            :max="profileValueExtent.max"
            :step="valueZoomStep"
            color="primary"
            track-color="grey-lighten-2"
            track-fill-color="primary"
            thumb-label="always"
            hide-details
            class="value-zoom-slider"
          >
            <template #thumb-label="{ modelValue }">
              {{ formatValue(modelValue) }}
            </template>
          </v-range-slider>
        </v-col>
      </v-row>
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

      <div class="d-flex flex-wrap align-center justify-space-between ga-2 mb-3">
        <div v-if="!showAllPercentiles" class="d-flex align-center flex-wrap ga-1">
          <template v-for="(crumb, idx) in drillBreadcrumb" :key="crumb.level">
            <v-icon v-if="idx > 0" size="x-small" icon="mdi-chevron-right" class="text-medium-emphasis" />
            <v-chip
              size="small"
              :color="crumb.level === drillLevel ? 'primary' : undefined"
              :variant="crumb.level === drillLevel ? 'flat' : 'text'"
              @click="drillTo(crumb.level)"
            >
              {{ crumb.label }}
            </v-chip>
          </template>
        </div>
        <div v-else class="text-body-2 font-weight-medium">
          Vue détaillée — 127 g-percentiles
        </div>

        <div class="d-flex align-center ga-2">
          <v-btn
            v-if="canDrillDown"
            size="small"
            variant="tonal"
            color="primary"
            prepend-icon="mdi-magnify-plus-outline"
            @click="drillDownTop"
          >
            Zoomer sur {{ currentDrillableCode }}
          </v-btn>
          <v-switch
            v-model="showAllPercentiles"
            label="127 g-percentiles"
            color="primary"
            density="compact"
            hide-details
          />
        </div>
      </div>

      <p v-if="showAllPercentiles" class="text-caption text-medium-emphasis mb-2">
        Les 127 g-percentiles WID sont affichés d'un coup. Décochez « 127 g-percentiles »
        pour revenir à la vue agrégée avec zoom progressif sur le sommet.
      </p>
      <p v-else-if="canDrillDown" class="text-caption text-medium-emphasis mb-2">
        Cliquez sur la tranche du sommet (<code>{{ currentDrillableCode }}</code>, vers 100 %)
        pour la re-découper en tranches plus fines. Le fil d'Ariane ci-dessus permet de revenir en arrière.
      </p>
      <p v-else class="text-caption text-medium-emphasis mb-2">
        Niveau le plus fin atteint : tranches de la queue de distribution affichées telles quelles.
      </p>

      <EChart
        :key="`${populationDensity}-${probabilityDensity}-${chartType}-${valueZoomRange[0]}-${valueZoomRange[1]}-${drillLevel}-${showAllPercentiles}`"
        :option="profileOption"
        :loading="loading"
        :error="error"
        height="460px"
        @chart-click="handleChartClick"
      />
    </v-card>
  </div>
</template>

<style scoped>
.value-zoom-slider :deep(.v-slider-track__fill),
.value-zoom-slider :deep(.v-slider-track__background) {
  height: 10px;
  border-radius: 5px;
}

.value-zoom-slider :deep(.v-slider-thumb__surface) {
  border-width: 2px;
}
</style>
