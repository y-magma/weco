<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { sources } = useDataSources()

const sourceStatuses = computed(() =>
  sources.value.map((source) => ({
    ...source.getStatus(),
    usingSampleData: false,
  })),
)
</script>

<template>
  <div>
    <h1 class="text-h4 font-weight-bold mb-2">Data sources</h1>
    <p class="text-body-1 text-medium-emphasis mb-6">
      Pluggable adapters for external economic data. WID.world is enabled by default;
      add new sources by implementing the <code>DataSource</code> interface and
      registering them in the registry.
    </p>

    <v-row>
      <v-col
        v-for="source in sourceStatuses"
        :key="source.id"
        cols="12"
        md="6"
      >
        <v-card variant="outlined" class="pa-4 h-100">
          <div class="d-flex align-center justify-space-between mb-3">
            <h2 class="text-h6">{{ source.label }}</h2>
            <v-chip
              :color="source.enabled ? 'success' : 'default'"
              size="small"
              variant="tonal"
            >
              {{ source.enabled ? 'Enabled' : 'Disabled' }}
            </v-chip>
          </div>

          <p class="text-body-2 text-medium-emphasis mb-4">
            {{ source.description }}
          </p>

          <v-list density="compact" class="bg-transparent">
            <v-list-item prepend-icon="mdi-identifier" :title="`ID: ${source.id}`" />
            <v-list-item
              v-if="source.website"
              prepend-icon="mdi-web"
              :title="source.website"
              :href="source.website"
              target="_blank"
            />
            <v-list-item
              prepend-icon="mdi-clock-outline"
              :title="source.lastFetchAt ? `Last fetch: ${source.lastFetchAt}` : 'Last fetch: not yet'"
            />
            <v-list-item
              v-if="source.usingSampleData"
              prepend-icon="mdi-flask-outline"
              title="Using sample data (local WID dump unavailable)"
            />
            <v-list-item
              v-if="source.lastError"
              prepend-icon="mdi-alert-circle-outline"
              :title="`Last error: ${source.lastError}`"
            />
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <v-card variant="tonal" color="primary" class="mt-6 pa-5">
      <h3 class="text-h6 mb-2">Adding a new source</h3>
      <ol class="text-body-2 pl-4">
        <li>Create a module under <code>src/data-sources/&lt;name&gt;/</code></li>
        <li>Implement the <code>DataSource</code> interface</li>
        <li>Register it in <code>src/data-sources/registry.ts</code></li>
        <li>Expose indicators via <code>searchIndicators()</code> and series via <code>fetchSeries()</code></li>
      </ol>
    </v-card>
  </div>
</template>
