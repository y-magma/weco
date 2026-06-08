<script setup lang="ts">
defineProps<{
  title: string
  paragraphs: readonly string[]
  /** Tooltip on the activator before opening the dialog. */
  hint?: string
  /** When set, renders a text button instead of the ? icon. */
  label?: string
}>()

const open = ref(false)
</script>

<template>
  <span class="d-inline-flex align-center">
    <v-btn
      v-if="label"
      variant="text"
      size="small"
      prepend-icon="mdi-calculator-variant-outline"
      class="text-none"
      @click="open = true"
    >
      {{ label }}
      <v-tooltip
        v-if="hint"
        activator="parent"
        location="top"
      >
        {{ hint }}
      </v-tooltip>
    </v-btn>
    <v-btn
      v-else
      icon
      size="x-small"
      variant="text"
      color="medium-emphasis"
      :aria-label="`Aide : ${title}`"
      @click="open = true"
    >
      <v-icon
        size="18"
        icon="mdi-help-circle-outline"
      />
      <v-tooltip
        activator="parent"
        location="top"
      >
        {{ hint ?? title }}
      </v-tooltip>
    </v-btn>

    <v-dialog
      v-model="open"
      max-width="560"
      scrollable
    >
      <v-card>
        <v-card-title class="d-flex align-center ga-2 pt-4">
          <v-icon
            icon="mdi-information-outline"
            color="primary"
          />
          {{ title }}
        </v-card-title>
        <v-card-text class="text-body-2">
          <p
            v-for="(paragraph, index) in paragraphs"
            :key="index"
            :class="{ 'mb-3': index < paragraphs.length - 1 }"
          >
            {{ paragraph }}
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="open = false"
          >
            Fermer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </span>
</template>
