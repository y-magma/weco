import { getApplicationContainer } from '@application/bootstrap/container'

export default defineNuxtPlugin(() => {
  const runtimeConfig = useRuntimeConfig()
  const application = getApplicationContainer({
    defaultSourceId: 'wid',
    wid: {
      apiKey: runtimeConfig.public.widApiKey || undefined,
      baseUrl: runtimeConfig.public.widApiBaseUrl || undefined,
    },
  })

  return { provide: { application } }
})
