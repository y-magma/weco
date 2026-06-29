<script setup lang="ts">
const { canShare, copyShareUrl } = useShareableUrl()

const snackbarVisible = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref<'success' | 'warning' | 'error'>('success')

async function onShare() {
  const result = await copyShareUrl()
  if (result.ok) {
    snackbarMessage.value = result.tooLong
      ? 'Lien copié — attention : URL longue, certains navigateurs peuvent la tronquer.'
      : 'Lien copié dans le presse-papier.'
    snackbarColor.value = result.tooLong ? 'warning' : 'success'
    snackbarVisible.value = true
    return
  }

  snackbarMessage.value = 'Impossible de copier le lien.'
  snackbarColor.value = 'error'
  snackbarVisible.value = true
}
</script>

<template>
  <div>
    <v-btn
      variant="text"
      prepend-icon="mdi-share-variant"
      :disabled="!canShare"
      @click="onShare"
    >
      Partager
    </v-btn>

    <v-snackbar
      v-model="snackbarVisible"
      :timeout="5000"
      :color="snackbarColor"
      location="top"
      variant="tonal"
    >
      {{ snackbarMessage }}
    </v-snackbar>
  </div>
</template>
