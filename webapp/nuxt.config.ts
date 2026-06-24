import { fileURLToPath } from 'node:url'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  ssr: false,

  modules: ['@nuxt/eslint'],

  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],

  css: ['~/assets/main.scss'],

  alias: {
    '@application': fileURLToPath(new URL('./lib/application', import.meta.url)),
    '@domain': fileURLToPath(new URL('./lib/domain', import.meta.url)),
    '@infrastructure': fileURLToPath(new URL('./lib/infrastructure', import.meta.url)),
  },

  build: {
    transpile: ['vuetify'],
  },

  vite: {
    plugins: [vuetify({ autoImport: true })],
    vue: {
      template: {
        transformAssetUrls,
      },
    },
    optimizeDeps: {
      include: ['@vue/devtools-core', '@vue/devtools-kit'],
    },
    server: {
      fs: {
        strict: false,
      },
    },
  },

  routeRules: {
    '/profil': { redirect: '/panneau/exploration' },
    '/panneau/trapeze': { redirect: '/panneau/exploration' },
    '/panneau-visualisation': { redirect: '/panneau' },
    '/nuage': { redirect: '/panneau' },
    '/grille-visus': { redirect: '/grille' },
    '/grille-visualisations': { redirect: '/grille' },
  },

  nitro: {
    prerender: {
      routes: [
        '/',
        '/panneau',
        '/panneau/exploration',
        '/panneau/temps',
        '/grille',
        '/spec',
        '/sources',
        '/csv',
      ],
    },
  },

  runtimeConfig: {
    public: {
      widApiKey: process.env.NUXT_PUBLIC_WID_API_KEY || '',
      widApiBaseUrl:
        process.env.NUXT_PUBLIC_WID_API_BASE_URL
        || 'https://rfap9nitz6.execute-api.eu-west-1.amazonaws.com/prod',
    },
  },

  app: {
    // GitHub Pages project site: set NUXT_APP_BASE_URL=/samuel-gscop-26/ in CI
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      title: 'Études de visualisation',
      meta: [
        {
          name: 'description',
          content:
            'Visualisez les distributions WID.world sur les 127 g-percentiles : profils, grilles et import CSV.',
        },
      ],
    },
  },
})
