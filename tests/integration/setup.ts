import { afterAll, beforeEach, vi } from 'vitest'
import { prisma } from '@/lib/prisma'
import { cookieStore, resetCookies } from './helpers'

// Route handlers read cookies via next/headers, which needs a Next request scope
vi.mock('next/headers', () => ({
  cookies: async () => cookieStore,
}))

beforeEach(async () => {
  resetCookies()
  await prisma.$executeRawUnsafe(
    'TRUNCATE "Rating", "TastingBeer", "Participant", "Tasting", "Beer", "User", "admin_auth" CASCADE'
  )
})

afterAll(async () => {
  await prisma.$disconnect()
})
