import type { ApplicationContainer } from '@application/bootstrap/container'

declare module '#app' {
  interface NuxtApp {
    $application: ApplicationContainer
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $application: ApplicationContainer
  }
}

export {}
