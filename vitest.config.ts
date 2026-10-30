import path from 'node:path'
import { defineConfig } from 'vitest/config'

// Unit tests: pure logic and hooks, no database
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
  },
})
