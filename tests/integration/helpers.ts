import { randomUUID } from 'node:crypto'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

// The subset of Clerk's backend User that src/lib/auth.ts reads
interface FakeClerkUser {
  id: string
  fullName: string | null
  username: string | null
  imageUrl: string
  primaryEmailAddress: { emailAddress: string; verification: { status: string } | null } | null
}

export const clerkSession: { user: FakeClerkUser | null } = { user: null }

// Clerk ids that exist in the fake Clerk instance: everyone a test has signed in as
export const clerkInstanceUserIds = new Set<string>()

export function signOut() {
  clerkSession.user = null
}

/**
 * Sign in as a Clerk user. Pass an existing DB user (with clerkId) or a new Clerk identity.
 */
export function signInAs(
  who: { clerkId: string | null; name?: string; email?: string | null },
  { emailVerified = true }: { emailVerified?: boolean } = {}
) {
  if (!who.clerkId) throw new Error('signInAs needs a user with a clerkId')
  clerkInstanceUserIds.add(who.clerkId)
  clerkSession.user = {
    id: who.clerkId,
    fullName: who.name ?? null,
    username: null,
    imageUrl: `https://img.clerk.test/${who.clerkId}.png`,
    primaryEmailAddress: who.email
      ? { emailAddress: who.email, verification: { status: emailVerified ? 'verified' : 'unverified' } }
      : null,
  }
}

type Handler<P> = (request: NextRequest, context: { params: Promise<P> }) => Promise<Response>

/**
 * Invoke a route handler the way Next does and return status + parsed JSON
 */
export async function callRoute<P extends Record<string, string>>(
  handler: Handler<P>,
  { params, body, method = 'GET', path = '/' }: { params: P; body?: unknown; method?: string; path?: string }
) {
  const request = new NextRequest(new URL(path, 'http://localhost'), {
    method,
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const response = await handler(request, { params: Promise.resolve(params) })
  const contentType = response.headers.get('content-type') ?? ''
  const json = contentType.includes('application/json') ? await response.json() : null
  return { status: response.status, json, response }
}

export function createAccount(name: string, roles: { isLeader?: boolean; isAdmin?: boolean } = {}) {
  return prisma.user.create({
    data: { name, clerkId: `clerk_${name}`, email: `${name}@example.com`, ...roles },
  })
}

/**
 * An active tasting with a leader account, joined participant accounts and untasted beers
 */
export async function createTastingFixture({
  participantNames = ['anna', 'bjarni', 'gunna'],
  beerCount = 3,
}: { participantNames?: string[]; beerCount?: number } = {}) {
  const leader = await createAccount(`leader${randomUUID().slice(0, 6)}`, { isLeader: true })
  const tasting = await prisma.tasting.create({
    data: { title: 'Test tasting', status: 'active', createdBy: leader.id },
  })

  const participants = []
  const users = []
  for (const [index, name] of participantNames.entries()) {
    const user =
      (await prisma.user.findUnique({ where: { clerkId: `clerk_${name}` } })) ?? (await createAccount(name))
    users.push(user)
    participants.push(
      await prisma.participant.create({
        data: { tastingId: tasting.id, userId: user.id, code: `P${index}00`, rejoinToken: randomUUID() },
      })
    )
  }

  const beers = []
  for (let index = 0; index < beerCount; index++) {
    beers.push(
      await prisma.tastingBeer.create({
        data: { tastingId: tasting.id, customName: `Beer ${index + 1}`, customBrewery: 'Brewery', orderIndex: index },
      })
    )
  }

  return { leader, tasting, participants, users, beers }
}
