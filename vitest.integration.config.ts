import path from 'node:path'
import { defineConfig } from 'vitest/config'

// Integration tests: route handlers against a real, disposable Postgres.
// Every test truncates all tables, so this refuses anything but a local database, and reads
// TEST_DATABASE_URL (never DATABASE_URL) so a prod URL in .env can't be picked up by accident.
const testDatabaseUrl = process.env.TEST_DATABASE_URL
if (!testDatabaseUrl) {
  throw new Error(
    'TEST_DATABASE_URL is not set. Start a throwaway Postgres, e.g.\n' +
      '  docker run -d --rm -e POSTGRES_PASSWORD=pw -p 55432:5432 postgres:17\n' +
      '  TEST_DATABASE_URL=postgresql://postgres:pw@localhost:55432/postgres npm run test:integration'
  )
}
const { hostname } = new URL(testDatabaseUrl)
if (!['localhost', '127.0.0.1', '[::1]'].includes(hostname)) {
  throw new Error(`Refusing to run integration tests against non-local database host "${hostname}"`)
}

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  test: {
    include: ['tests/integration/**/*.test.ts'],
    environment: 'node',
    // DIRECT_URL too: prisma.config.ts prefers it, and dotenv never overrides set vars
    env: { DATABASE_URL: testDatabaseUrl, DIRECT_URL: testDatabaseUrl },
    globalSetup: ['tests/integration/global-setup.ts'],
    setupFiles: ['tests/integration/setup.ts'],
    // One shared database, so files must not run concurrently
    fileParallelism: false,
    hookTimeout: 60_000,
  },
})
