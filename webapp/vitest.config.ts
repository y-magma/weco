import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@src': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['test/**/*.spec.ts'],
    // Conformance tests mix heavy CSV reads and live API calls — run sequentially.
    fileParallelism: false,
    pool: 'threads',
  },
})
