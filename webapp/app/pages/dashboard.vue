<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const {
  hypothesis,
  countryCode,
  yearFrom,
  yearTo,
  countries,
  loading,
  error,
  timeSeriesOption,
  distributionOption,
  scatterOption,
  loadDashboardData,
} = useDashboard()
</script>

<template>
  <div>
    <v-row class="mb-4">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-2">Dashboard</h1>
        <p class="text-body-1 text-medium-emphasis">
          {{ hypothesis.description }}
        </p>
      </v-col>
    </v-row>

    <v-card variant="outlined" class="mb-6 pa-4">
      <v-row dense>
        <v-col cols="12" md="3">
          <v-select
            v-model="countryCode"
            :items="countries"
            item-title="label"
            item-value="code"
            label="Country"
            prepend-inner-icon="mdi-earth"
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            v-model.number="yearFrom"
            type="number"
            label="Year from"
            min="1900"
            max="2100"
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            v-model.number="yearTo"
            type="number"
            label="Year to"
            min="1900"
            max="2100"
          />
        </v-col>
        <v-col cols="12" md="3" class="d-flex align-center">
          <v-btn
            color="primary"
            :loading="loading"
            block
            @click="loadDashboardData"
          >
            Refresh
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ error }}
    </v-alert>

    <v-row>
      <v-col cols="12">
        <v-card variant="outlined" class="pa-4">
          <v-card-title class="px-0 pt-0">
            {{ hypothesis.chartDefaults.timeSeriesTitle }}
          </v-card-title>
          <EChart
            :option="timeSeriesOption"
            :loading="loading"
            :error="error"
            height="420px"
          />
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card variant="outlined" class="pa-4 h-100">
          <v-card-title class="px-0 pt-0">Income distribution</v-card-title>
          <EChart
            :option="distributionOption"
            :loading="loading"
            height="360px"
          />
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card variant="outlined" class="pa-4 h-100">
          <v-card-title class="px-0 pt-0">
            {{ hypothesis.chartDefaults.scatterTitle }}
          </v-card-title>
          <EChart
            :option="scatterOption"
            :loading="loading"
            height="360px"
          />
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
