import { execSync } from 'node:child_process'

// Bring the test database schema up to date once per run.
// TEST_DATABASE_URL was already checked to be local by vitest.integration.config.ts
export default function setup() {
  const url = process.env.TEST_DATABASE_URL
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
  })
}
