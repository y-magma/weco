<script setup lang="ts">
defineProps<{
  message?: string | null
}>()
</script>

<template>
  <div v-if="message" class="param-adjustment-hint">
    <v-tooltip :text="message" location="bottom" max-width="320">
      <template #activator="{ props: tooltipProps }">
        <span
          v-bind="tooltipProps"
          class="param-adjustment-hint__mark"
          role="img"
          aria-label="Paramètre ajusté automatiquement"
        >!</span>
      </template>
    </v-tooltip>
  </div>
</template>

<style scoped>
.param-adjustment-hint {
  margin-top: 2px;
  line-height: 1;
}

.param-adjustment-hint__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background: rgb(var(--v-theme-warning));
  color: rgb(var(--v-theme-on-warning));
  font-size: 0.7rem;
  font-weight: 700;
  cursor: help;
}
</style>
