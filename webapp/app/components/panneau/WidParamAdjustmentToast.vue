<script setup lang="ts">
defineProps<{
  message: string
}>()

const visible = defineModel<boolean>({ required: true })
</script>

<template>
  <v-snackbar
    v-model="visible"
    :timeout="5000"
    color="warning"
    location="top"
    variant="tonal"
  >
    {{ message }}
  </v-snackbar>
</template>
