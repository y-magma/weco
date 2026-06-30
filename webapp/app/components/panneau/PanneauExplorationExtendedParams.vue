<script setup lang="ts">
import { PROFILE_HELP } from '~/visualization/profileHelp'
import { PANNEAU_EXPLORATION_EXTENDED_KEY } from '~/composables/panneauExplorationExtendedContext'

withDefaults(defineProps<{
  showScalesSection?: boolean
  scalesOnly?: boolean
}>(), {
  showScalesSection: true,
  scalesOnly: false,
})

const ctx = inject(PANNEAU_EXPLORATION_EXTENDED_KEY)
if (!ctx) {
  throw new Error('PanneauExplorationExtendedParams requires a panneauExplorationExtended provider')
}

const {
  state,
  customBreakpointInput,
  customBreakpointError,
  showIntervalVisibilityPanel,
  selectableBoundaries,
  selectableBoundaryItems,
  customPartitionReadyHint,
  nextBoundaryHint,
  onCustomBoundarySelected,
  removeLastCustomBreakpoint,
  resetCustomBreakpoints,
  toggleLorenzCurve,
  toggleEmpiricalCdf,
  toggleEmpiricalPdf,
  anyDensityActive,
  visibleApproxIntervalCount,
} = ctx

const {
  profile,
  method,
  approxPartitionMode,
  customBreakpoints,
  customPartitionValidation,
  customPartitionReady,
  partitionViewOptions,
  approxReady,
  approxIntervalLabels,
  isApproxIntervalVisible,
  toggleApproxIntervalVisibility,
  methodOptions,
  activeMethodHint,
  lorenzCurve,
  empiricalCdf,
  empiricalPdf,
  showEmpiricalDistribution,
  showSmoothDistribution,
  logRichZoom,
  logScaleX,
  logScaleY,
  showHistogram,
  showTrapezoids,
  derivedViewActive,
} = state
</script>

<template>
  <v-expansion-panels v-if="!scalesOnly" variant="accordion" density="compact" class="mb-3">
    <v-expansion-panel>
      <v-expansion-panel-title class="text-body-2 py-2">
        Analyses dérivées
      </v-expansion-panel-title>
      <v-expansion-panel-text>
        <div class="d-flex align-center ga-2 mb-2">
          <v-btn
            size="small"
            :color="lorenzCurve ? 'primary' : undefined"
            :variant="lorenzCurve ? 'flat' : 'outlined'"
            prepend-icon="mdi-chart-bell-curve-cumulative"
            :disabled="!profile || anyDensityActive"
            @click="toggleLorenzCurve"
          >
            Integrale
          </v-btn>
          <ProfileHelpButton
            :title="PROFILE_HELP.lorenzCurve.title"
            :paragraphs="PROFILE_HELP.lorenzCurve.paragraphs"
          />
        </div>
        <div class="d-flex align-center ga-2 mb-2">
          <v-btn
            size="small"
            :color="empiricalCdf ? 'primary' : undefined"
            :variant="empiricalCdf ? 'flat' : 'outlined'"
            prepend-icon="mdi-chart-areaspline"
            :disabled="!profile || lorenzCurve"
            @click="toggleEmpiricalCdf"
          >
            CDF
          </v-btn>
          <ProfileHelpButton
            :title="PROFILE_HELP.empiricalCdf.title"
            :paragraphs="PROFILE_HELP.empiricalCdf.paragraphs"
          />
        </div>
        <div class="d-flex align-center ga-2">
          <v-btn
            size="small"
            :color="empiricalPdf ? 'primary' : undefined"
            :variant="empiricalPdf ? 'flat' : 'outlined'"
            prepend-icon="mdi-chart-histogram"
            :disabled="!profile || lorenzCurve"
            @click="toggleEmpiricalPdf"
          >
            PDF
          </v-btn>
          <ProfileHelpButton
            :title="PROFILE_HELP.empiricalPdf.title"
            :paragraphs="PROFILE_HELP.empiricalPdf.paragraphs"
          />
        </div>
        <div
          v-if="empiricalCdf || empiricalPdf"
          class="d-flex flex-wrap ga-2 mt-3 align-center"
        >
          <v-btn
            size="small"
            :color="showEmpiricalDistribution ? 'primary' : undefined"
            :variant="showEmpiricalDistribution ? 'flat' : 'outlined'"
            @click="showEmpiricalDistribution = !showEmpiricalDistribution"
          >
            Empirique
          </v-btn>
          <v-btn
            size="small"
            :color="showSmoothDistribution ? 'primary' : undefined"
            :variant="showSmoothDistribution ? 'flat' : 'outlined'"
            @click="showSmoothDistribution = !showSmoothDistribution"
          >
            Lissée
          </v-btn>
          <ProfileHelpButton
            :title="PROFILE_HELP.smoothDistribution.title"
            :paragraphs="PROFILE_HELP.smoothDistribution.paragraphs"
          />
        </div>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>

  <div v-if="!scalesOnly && profile" class="d-flex flex-wrap align-center ga-2 mb-3 overlay-toggles">
    <v-switch
      v-model="showHistogram"
      label="Hist"
      color="primary"
      density="compact"
      hide-details
      :disabled="!approxReady || derivedViewActive"
    />
    <v-switch
      v-model="showTrapezoids"
      label="Trapèzes"
      color="primary"
      density="compact"
      hide-details
      :disabled="!approxReady || derivedViewActive"
    />
  </div>

  <div v-if="!scalesOnly" class="custom-partition-panel mt-3 pa-3 rounded border">
    <div class="d-flex align-center ga-1 mb-2">
      <span class="text-body-2 font-weight-medium">Intervalles d'approximation</span>
      <ProfileHelpButton
        title="Intervalles d'approximation"
        :paragraphs="[
          'Choisissez les tranches de population servant d\'intervalles d\'approximation : tranches fines (127 g-percentiles), pas fixe (1 %, 10 %, 25 %), tranche 50 % - 90 % - 99 % - 99,9 % - 100 % ou personnalisées.',
          'En mode personnalisé, choisissez les bornes de fin de chaque intervalle parmi les pourcentages disponibles. Il n\'est pas nécessaire d\'aller jusqu\'à 100 %.',
          'Cliquez sur un intervalle dans « Visibilité des intervalles » pour le masquer ou l\'afficher sur le graphique.',
        ]"
      />
    </div>

    <v-select
      v-model="approxPartitionMode"
      :items="partitionViewOptions"
      item-title="label"
      item-value="value"
      label="Tranches de population"
      density="compact"
      hide-details
    />

    <template v-if="approxPartitionMode === 'custom'">
      <v-row dense align="center" class="mt-1">
        <v-col cols="12">
          <v-select
            v-model="customBreakpointInput"
            :items="selectableBoundaryItems"
            item-title="title"
            item-value="value"
            :label="nextBoundaryHint"
            :error-messages="customBreakpointError ? [customBreakpointError] : []"
            :disabled="selectableBoundaries.length === 0"
            density="compact"
            hide-details="auto"
            clearable
            @update:model-value="onCustomBoundarySelected"
          />
        </v-col>
        <v-col cols="12" class="custom-partition-actions d-flex flex-wrap ga-1">
          <v-btn
            size="small"
            variant="text"
            :disabled="customBreakpoints.length === 0"
            @click="removeLastCustomBreakpoint"
          >
            Annuler dernière
          </v-btn>
          <v-btn
            size="small"
            variant="text"
            :disabled="customBreakpoints.length === 0"
            @click="resetCustomBreakpoints"
          >
            Réinitialiser
          </v-btn>
        </v-col>
      </v-row>

      <v-alert
        v-if="customBreakpoints.length > 0 && customPartitionValidation.error"
        type="warning"
        density="compact"
        variant="tonal"
        class="mt-3"
      >
        {{ customPartitionValidation.error }}
      </v-alert>
      <v-alert
        v-else-if="profile && !customPartitionReady"
        type="info"
        density="compact"
        variant="tonal"
        class="mt-3"
      >
        Choisissez au moins une borne de fin pour afficher l'approximation.
      </v-alert>
    </template>

    <div v-if="approxReady" class="mt-3 d-flex align-center justify-space-between ga-2">
      <v-btn
        size="x-small"
        variant="text"
        class="px-0"
        :prepend-icon="showIntervalVisibilityPanel ? 'mdi-chevron-up' : 'mdi-chevron-down'"
        @click="showIntervalVisibilityPanel = !showIntervalVisibilityPanel"
      >
        Visibilité des intervalles
        ({{ visibleApproxIntervalCount }}/{{ approxIntervalLabels.length }})
      </v-btn>
      <v-tooltip
        v-if="approxPartitionMode === 'custom' && customPartitionReady"
        location="top"
        :disabled="!customPartitionReadyHint"
        :text="customPartitionReadyHint"
      >
        <template #activator="{ props: tooltipProps }">
          <v-icon
            v-bind="tooltipProps"
            icon="mdi-check-circle"
            color="success"
            size="small"
            aria-label="Découpage prêt"
          />
        </template>
      </v-tooltip>
    </div>
    <v-expand-transition>
      <div
        v-if="approxReady && showIntervalVisibilityPanel"
        class="d-flex flex-wrap ga-1 mt-2"
      >
        <v-chip
          v-for="(label, idx) in approxIntervalLabels"
          :key="idx"
          size="small"
          :variant="isApproxIntervalVisible(idx) ? 'tonal' : 'outlined'"
          :color="isApproxIntervalVisible(idx) ? 'primary' : 'default'"
          :prepend-icon="isApproxIntervalVisible(idx) ? 'mdi-eye' : 'mdi-eye-off'"
          class="interval-visibility-chip"
          @click="toggleApproxIntervalVisibility(idx)"
        >
          {{ label }}
        </v-chip>
      </div>
    </v-expand-transition>
  </div>

  <div v-if="!scalesOnly" class="mt-3">
    <div class="text-body-2 font-weight-medium mb-2">
      Méthode de calage (y₀)
    </div>
    <v-btn-toggle
      v-model="method"
      mandatory
      divided
      color="primary"
      variant="outlined"
      density="compact"
      class="method-toggle flex-wrap"
    >
      <v-btn
        v-for="opt in methodOptions"
        :key="opt.value"
        :value="opt.value"
        size="small"
      >
        {{ opt.label }}
      </v-btn>
    </v-btn-toggle>
    <p v-if="activeMethodHint" class="text-caption text-medium-emphasis mt-2 mb-0">
      {{ activeMethodHint }}
    </p>
  </div>

  <v-expansion-panels
    v-if="(showScalesSection || scalesOnly) && profile"
    variant="accordion"
    density="compact"
    :class="scalesOnly ? 'mt-3' : 'mt-2'"
  >
    <v-expansion-panel>
      <v-expansion-panel-title class="text-body-2 py-2">
        Échelles
      </v-expansion-panel-title>
      <v-expansion-panel-text>
        <div class="d-flex align-center mb-1">
          <v-switch
            v-model="logScaleX"
            label="logX"
            color="primary"
            density="compact"
            hide-details
            :disabled="lorenzCurve"
          />
          <ProfileHelpButton
            title="Échelle log (abscisse)"
            :paragraphs="[
              'Échelle logarithmique native ECharts sur le rang percentile (abscisse).',
              'Seuls les rangs strictement positifs sont affichés ; rang 0 % masqué (trou dans la courbe).',
            ]"
          />
        </div>
        <div class="d-flex align-center mb-1">
          <v-switch
            v-model="logScaleY"
            label="logY"
            color="primary"
            density="compact"
            hide-details
            :disabled="lorenzCurve"
          />
          <ProfileHelpButton
            :title="PROFILE_HELP.logScaleY.title"
            :paragraphs="[
              ...PROFILE_HELP.logScaleY.paragraphs.slice(0, 1),
              'Trapèzes : échelle logarithmique native sur la richesse — seules les valeurs strictement positives sont affichées (trou dans la courbe si ≤ 0).',
            ]"
          />
        </div>
        <div class="d-flex align-center">
          <v-switch
            v-model="logRichZoom"
            label="log zoom sur les riches"
            color="primary"
            density="compact"
            hide-details
            :disabled="lorenzCurve"
          />
          <ProfileHelpButton
            title="Log zoom sur les riches"
            :paragraphs="[
              'Espacement logarithmique depuis le 100 % : les points sont placés en −log₁₀(100 − rang), graduations en rang % réel (0 % à gauche, 100 % à droite).',
              'Permet de zoomer visuellement sur la queue haute de la distribution (ultra-riches) tout en gardant le sens d’affichage des axes.',
            ]"
          />
        </div>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<style scoped>
.custom-partition-panel {
  border-color: rgba(var(--v-border-color), var(--v-border-opacity));
}

.custom-partition-actions {
  padding-top: 0;
}

.interval-visibility-chip {
  cursor: pointer;
}

.method-toggle :deep(.v-btn) {
  font-size: 0.75rem;
  letter-spacing: 0;
}

.overlay-toggles :deep(.v-switch) {
  flex: 0 1 auto;
}
</style>
