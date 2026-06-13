import type { ApplicationContainer } from '@application/bootstrap/container'

export function useApplication(): ApplicationContainer {
  const nuxtApp = useNuxtApp()
  if (!nuxtApp.$application) {
    throw new Error('Application container is not initialized')
  }
  return nuxtApp.$application as ApplicationContainer
}

export function useDataSources() {
  const app = useApplication()
  const sources = computed(() => app.listDataSources())
  const defaultSource = computed(() => app.getDefaultSource())
  return { sources, defaultSource }
}
