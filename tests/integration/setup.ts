import { afterAll, beforeEach, vi } from 'vitest'
import { prisma } from '@/lib/prisma'
import { clerkSession, signOut } from './helpers'

// Stand-in for Clerk: route handlers see whoever the test signed in via helpers.signInAs
vi.mock('@clerk/nextjs/server', () => ({
  auth: async () => ({ userId: clerkSession.user?.id ?? null }),
  currentUser: async () => clerkSession.user,
}))

beforeEach(async () => {
  signOut()
  delete process.env.ADMIN_EMAILS
  await prisma.$executeRawUnsafe(
    'TRUNCATE "Rating", "TastingBeer", "Participant", "Tasting", "Beer", "User", "admin_auth" CASCADE'
  )
})

afterAll(async () => {
  await prisma.$disconnect()
})
