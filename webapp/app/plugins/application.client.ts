import { getApplicationContainer } from '@application/bootstrap/container'

export default defineNuxtPlugin(() => {
  const runtimeConfig = useRuntimeConfig()
  const application = getApplicationContainer({
    widApiKey: runtimeConfig.public.widApiKey || undefined,
    widApiBaseUrl: runtimeConfig.public.widApiBaseUrl || undefined,
  })

  return { provide: { application } }
})
