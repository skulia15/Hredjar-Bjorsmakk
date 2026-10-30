import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // CLI (migrate) needs Neon's direct, non-pooled URL; runtime uses pooled DATABASE_URL.
    // process.env (not env()) so `prisma generate` works without a database configured
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  },
})
