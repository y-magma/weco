<script setup lang="ts">
import type {
  TimeSeriesComparePanelSnapshot,
  TimeSeriesPanelSnapshot,
} from '@application/share/shareSnapshot'

definePageMeta({ layout: 'default' })

const route = useRoute()
const initialShare = decodeRouteShareSnapshot(route.query, 'temps')

const { sourceId } = usePanneauDataSourceProvider(initialShare?.sourceId)
const { countriesError } = useCountriesProvider()

const timeSeriesInitial = initialShare?.page === 'temps'
  ? initialShare.timeSeries
  : undefined
const compareInitial = initialShare?.page === 'temps'
  ? initialShare.compare
  : undefined

useShareableUrlProvider({
  page: 'temps',
  buildSnapshot: (shareRegistry) => ({
    v: 1,
    page: 'temps',
    sourceId: sourceId.value,
    timeSeries: (shareRegistry.getSnapshot('timeSeries') ?? {}) as TimeSeriesPanelSnapshot,
    compare: (shareRegistry.getSnapshot('compare') ?? {}) as TimeSeriesComparePanelSnapshot,
  }),
  watchSources: [sourceId],
})
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

    <PanneauDataSourceSection v-model="sourceId" class="mb-4" />

    <PanneauSerieTemporelle
      share-key="timeSeries"
      :initial-snapshot="timeSeriesInitial"
      chart-height="420px"
      :show-data-source-section="false"
    />

    <v-divider class="my-6" />

    <v-row class="mb-2">
      <v-col cols="12">
        <h2 class="text-h5 font-weight-bold mb-1">Comparaison multi-pays</h2>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Comparer la même tranche de population sur plusieurs pays.
        </p>
      </v-col>
    </v-row>

    <PanneauSerieTemporelleCompare
      share-key="compare"
      :initial-snapshot="compareInitial"
      chart-height="420px"
      :show-data-source-section="false"
    />
  </div>
</template>
