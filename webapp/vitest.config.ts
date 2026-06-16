import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@application': fileURLToPath(new URL('./lib/application', import.meta.url)),
      '@domain': fileURLToPath(new URL('./lib/domain', import.meta.url)),
      '@infrastructure': fileURLToPath(new URL('./lib/infrastructure', import.meta.url)),
      '~': fileURLToPath(new URL('./app', import.meta.url)),
      '~/visualization': fileURLToPath(new URL('./app/visualization', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['test/**/*.spec.ts'],
    fileParallelism: false,
    pool: 'threads',
  },
})
