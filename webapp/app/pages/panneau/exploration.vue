<script setup lang="ts">
import { EXPLORATION_DISABLED_SOURCE_IDS } from '~/composables/usePanneauDataSource'
import type { ExplorationPanelSnapshot } from '@application/share/shareSnapshot'

definePageMeta({ layout: 'default' })

const route = useRoute()
const initialShare = decodeRouteShareSnapshot(route.query, 'exploration')

const { sourceId } = usePanneauDataSourceProvider(initialShare?.sourceId)
const { countriesError } = useCountriesProvider()

const explorationInitial = initialShare?.page === 'exploration'
  ? initialShare.exploration
  : undefined

useShareableUrlProvider({
  page: 'exploration',
  buildSnapshot: (shareRegistry) => ({
    v: 1,
    page: 'exploration',
    sourceId: sourceId.value,
    exploration: (shareRegistry.getSnapshot('exploration') ?? {}) as ExplorationPanelSnapshot,
  }),
  watchSources: [sourceId],
})
</script>

<template>
  <div>
    <PanneauBackLink />

    <v-row class="mb-2">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-1">Profil d'inégalité et approximations</h1>
        <p class="text-body-1 text-medium-emphasis mb-0">
          Visualiser la répartition dans la population et approximer la courbe par des trapèzes et des rectangles conservant la moyenne sur chaque intervalle choisi.
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

    <PanneauDataSourceSection
      v-model="sourceId"
      :disabled-source-ids="EXPLORATION_DISABLED_SOURCE_IDS"
      class="mb-4"
    />

    <PanneauExploration
      share-key="exploration"
      :initial-snapshot="explorationInitial"
      chart-height="460px"
      :show-data-source-section="false"
    />
  </div>
</template>
