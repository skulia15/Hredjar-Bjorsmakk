import { afterAll, beforeEach, vi } from 'vitest'
import { prisma } from '@/lib/prisma'
import { clerkInstanceUserIds, clerkSession, signOut } from './helpers'

// Stand-in for Clerk: route handlers see whoever the test signed in via helpers.signInAs
vi.mock('@clerk/nextjs/server', () => ({
  auth: async () => ({ userId: clerkSession.user?.id ?? null }),
  currentUser: async () => clerkSession.user,
  // Only logins a test signed in with exist in this Clerk instance; anything else 404s like Clerk does
  clerkClient: async () => ({
    users: {
      getUser: async (id: string) => {
        if (clerkInstanceUserIds.has(id)) return { id }
        throw Object.assign(new Error('Not Found'), { status: 404 })
      },
    },
  }),
}))

beforeEach(async () => {
  signOut()
  clerkInstanceUserIds.clear()
  delete process.env.ADMIN_EMAILS
  await prisma.$executeRawUnsafe(
    'TRUNCATE "Rating", "TastingBeer", "Participant", "Tasting", "Beer", "User", "admin_auth" CASCADE'
  )
})

afterAll(async () => {
  await prisma.$disconnect()
})
