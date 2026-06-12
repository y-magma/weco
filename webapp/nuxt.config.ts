import { fileURLToPath } from 'node:url'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

// https://nuxt.com/docs/api/configuration/nuxt-config
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
    '@src': fileURLToPath(new URL('./src', import.meta.url)),
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
    '/profil': { redirect: '/panneau/population' },
    '/panneau-visualisation': { redirect: '/panneau' },
    '/nuage': { redirect: '/panneau/variables' },
    '/grille-visus': { redirect: '/grille' },
    '/grille-visualisations': { redirect: '/grille' },
  },

  nitro: {
    prerender: {
      routes: [
        '/',
        '/panneau',
        '/panneau/population',
        '/panneau/temps',
        '/panneau/variables',
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
    head: {
      title: 'Boîte à outils de visualisations',
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
