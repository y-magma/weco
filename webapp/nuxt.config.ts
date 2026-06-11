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

  nitro: {
    prerender: {
      routes: ['/', '/profil', '/nuage', '/panneaux', '/spec', '/dashboard', '/sources', '/csv'],
    },
  },

  runtimeConfig: {
    // Server-only: directory holding the local WID.world dump
    // (`WID_data_<AREA>.csv`). Defaults to `webapp/data/WID_DATA` (a symlink to
    // the full dump). Override with the `WID_DATA_DIR` env var.
    widDataDir: process.env.WID_DATA_DIR || '',
    public: {},
  },

  app: {
    head: {
      title: 'Economic Stress Dashboard',
      meta: [
        {
          name: 'description',
          content:
            'Compare economic inequality and stress hypothesis indicators from WID.world and other sources.',
        },
      ],
    },
  },
})
