import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { GET as session, PATCH as patchSession } from '@/app/api/session/route'
import { POST as join } from '@/app/api/tastings/[id]/join/route'
import { GET as listUsers } from '@/app/api/admin/users/route'
import { DELETE as deleteUser, PATCH as updateUser } from '@/app/api/admin/users/[userId]/route'
import { POST as linkUser } from '@/app/api/admin/users/[userId]/link/route'
import { prisma } from '@/lib/prisma'
import { callRoute, createAccount, createTastingFixture, signInAs } from './helpers'

const getSession = () => callRoute(session as never, { params: {} })

describe('first sign-in and ADMIN_EMAILS', () => {
  it('makes a verified ADMIN_EMAILS address admin on first sign-in', async () => {
    process.env.ADMIN_EMAILS = 'boss@example.com, other@example.com'
    signInAs({ clerkId: 'clerk_boss', name: 'Boss', email: 'Boss@Example.com' })

    const { json } = await getSession()

    expect(json).toMatchObject({ hasSession: true, name: 'Boss', isAdmin: true, isLeader: true })
  })

  it('does not trust an unverified email for admin', async () => {
    process.env.ADMIN_EMAILS = 'boss@example.com'
    signInAs({ clerkId: 'clerk_boss', name: 'Boss', email: 'boss@example.com' }, { emailVerified: false })

    const { json } = await getSession()

    expect(json.isAdmin).toBe(false)
    expect((await prisma.user.findUniqueOrThrow({ where: { clerkId: 'clerk_boss' } })).email).toBeNull()
  })

  it('promotes an existing user once their email is added to ADMIN_EMAILS', async () => {
    const user = await createAccount('later')
    signInAs(user)
    expect((await getSession()).json.isAdmin).toBe(false)

    process.env.ADMIN_EMAILS = 'later@example.com'
    expect((await getSession()).json.isAdmin).toBe(true)
  })

  it('keeps the same user when the account moves to a new Clerk instance (same verified email)', async () => {
    const original = await createAccount('mover', { isLeader: true })

    signInAs({ clerkId: 'clerk_prod_mover', name: 'Mover', email: 'mover@example.com' })
    const { json } = await getSession()

    expect(json.userId).toBe(original.id)
    expect(json.isLeader).toBe(true)
    expect(await prisma.user.count()).toBe(1)
  })

  it('never auto-claims a legacy name-only user, even with a matching name', async () => {
    await prisma.user.create({ data: { name: 'skúli', isAdmin: true, isLeader: true } })

    signInAs({ clerkId: 'clerk_imposter', name: 'skúli', email: 'imposter@example.com' })
    const { json } = await getSession()

    expect(json).toMatchObject({ name: 'skúli', isAdmin: false, isLeader: false })
    expect(await prisma.user.count()).toBe(2)
  })
})

describe('admin user management', () => {
  async function signedInAdmin() {
    const admin = await createAccount('admin', { isAdmin: true })
    signInAs(admin)
    return admin
  }

  it('lists accounts and legacy users with rating counts', async () => {
    await signedInAdmin()
    const { participants } = await createTastingFixture({ participantNames: ['anna'] })
    const legacy = await prisma.user.create({ data: { name: 'old timer' } })
    const tastingBeer = await prisma.tastingBeer.findFirstOrThrow()
    await prisma.rating.create({
      data: { tastingId: tastingBeer.tastingId, tastingBeerId: tastingBeer.id, participantId: participants[0].id, score: 8 },
    })

    const { json } = await callRoute(listUsers as never, { params: {} })

    const byName = Object.fromEntries(json.users.map((u: { name: string }) => [u.name, u]))
    expect(byName.anna).toMatchObject({ hasAccount: true, ratingCount: 1, tastingCount: 1 })
    expect(byName['old timer']).toMatchObject({ hasAccount: false, ratingCount: 0 })
    expect(legacy.clerkId).toBeNull()
  })

  it('promotes and demotes leaders', async () => {
    await signedInAdmin()
    const user = await createAccount('pat')

    const promoted = await callRoute(updateUser, { method: 'PATCH', params: { userId: user.id }, body: { isLeader: true } })
    expect(promoted.json.user.isLeader).toBe(true)

    const demoted = await callRoute(updateUser, { method: 'PATCH', params: { userId: user.id }, body: { isLeader: false } })
    expect(demoted.json.user.isLeader).toBe(false)
  })

  it('refuses to remove your own admin role or delete yourself', async () => {
    const admin = await signedInAdmin()

    expect((await callRoute(updateUser, { method: 'PATCH', params: { userId: admin.id }, body: { isAdmin: false } })).status).toBe(400)
    expect((await callRoute(deleteUser, { method: 'DELETE', params: { userId: admin.id } })).status).toBe(400)
    expect((await prisma.user.findUniqueOrThrow({ where: { id: admin.id } })).isAdmin).toBe(true)
  })

  it('refuses to demote an ADMIN_EMAILS admin', async () => {
    await signedInAdmin()
    process.env.ADMIN_EMAILS = 'boss@example.com'
    const boss = await prisma.user.create({ data: { name: 'Boss', clerkId: 'clerk_boss', email: 'boss@example.com', isAdmin: true } })

    const { status } = await callRoute(updateUser, { method: 'PATCH', params: { userId: boss.id }, body: { isAdmin: false } })

    expect(status).toBe(400)
  })

  it('non-admins cannot change roles', async () => {
    const leader = await createAccount('lea', { isLeader: true })
    signInAs(leader)

    const { status } = await callRoute(updateUser, { method: 'PATCH', params: { userId: leader.id }, body: { isAdmin: true } })

    expect(status).toBe(403)
  })
})

describe('linking an account to a legacy user', () => {
  async function legacyWithHistory() {
    const fixture = await createTastingFixture({ participantNames: [] })
    const legacy = await prisma.user.create({ data: { name: 'jón gamli', isLeader: true } })
    const participant = await prisma.participant.create({
      data: { tastingId: fixture.tasting.id, userId: legacy.id, code: 'OLD1', rejoinToken: randomUUID() },
    })
    await prisma.rating.create({
      data: { tastingId: fixture.tasting.id, tastingBeerId: fixture.beers[0].id, participantId: participant.id, score: 9 },
    })
    return { ...fixture, legacy, legacyParticipant: participant }
  }

  it('moves the login onto the legacy user, keeping their history, name and roles', async () => {
    const admin = await createAccount('admin', { isAdmin: true })
    const { legacy, legacyParticipant, tasting } = await legacyWithHistory()
    const account = await createAccount('jon')
    const other = await createTastingFixture({ participantNames: ['jon'] })

    signInAs(admin)
    const { status } = await callRoute(linkUser, { method: 'POST', params: { userId: account.id }, body: { legacyUserId: legacy.id } })

    expect(status).toBe(200)
    const linked = await prisma.user.findUniqueOrThrow({ where: { id: legacy.id }, include: { participations: true } })
    expect(linked).toMatchObject({ clerkId: 'clerk_jon', email: 'jon@example.com', name: 'jón gamli', isLeader: true })
    expect(linked.participations.map((p) => p.tastingId).sort()).toEqual([tasting.id, other.tasting.id].sort())
    expect(await prisma.user.findUnique({ where: { id: account.id } })).toBeNull()
    expect(await prisma.rating.count({ where: { participantId: legacyParticipant.id } })).toBe(1)

    // The person now signs in straight into their old history
    signInAs(account)
    expect((await getSession()).json.userId).toBe(legacy.id)
  })

  it('refuses when both users joined the same tasting', async () => {
    const admin = await createAccount('admin', { isAdmin: true })
    const { legacy, tasting } = await legacyWithHistory()
    const account = await createAccount('jon')
    await prisma.participant.create({ data: { tastingId: tasting.id, userId: account.id, code: 'NEW1', rejoinToken: randomUUID() } })

    signInAs(admin)
    const { status, json } = await callRoute(linkUser, { method: 'POST', params: { userId: account.id }, body: { legacyUserId: legacy.id } })

    expect(status).toBe(409)
    expect(json.tastingIds).toEqual([tasting.id])
    expect(await prisma.user.count({ where: { id: account.id } })).toBe(1)
  })

  it('refuses to link onto a user that already has an account', async () => {
    const admin = await createAccount('admin', { isAdmin: true })
    const first = await createAccount('one')
    const second = await createAccount('two')

    signInAs(admin)
    const { status } = await callRoute(linkUser, { method: 'POST', params: { userId: first.id }, body: { legacyUserId: second.id } })

    expect(status).toBe(400)
  })

  it('only admins can link', async () => {
    const { legacy } = await legacyWithHistory()
    const account = await createAccount('jon', { isLeader: true })

    signInAs(account)
    const { status } = await callRoute(linkUser, { method: 'POST', params: { userId: account.id }, body: { legacyUserId: legacy.id } })

    expect(status).toBe(403)
    expect((await prisma.user.findUniqueOrThrow({ where: { id: legacy.id } })).clerkId).toBeNull()
  })
})

describe('choosing a nickname', () => {
  const rename = (name: unknown) => callRoute(patchSession as never, { method: 'PATCH', params: {}, body: { name } })

  it('a first-timer has not joined before, and has once they join a tasting', async () => {
    signInAs({ clerkId: 'clerk_new', name: 'Sigga Jóns' })
    expect((await getSession()).json).toMatchObject({ name: 'Sigga Jóns', hasJoinedBefore: false })

    const { tasting } = await createTastingFixture({ participantNames: [] })
    await callRoute(join, { method: 'POST', params: { id: tasting.id } })

    expect((await getSession()).json.hasJoinedBefore).toBe(true)
  })

  it('lets the signed-in user rename themselves', async () => {
    const user = await createAccount('anna')
    signInAs(user)

    const { status, json } = await rename('  Bjórbangsi ')

    expect(status).toBe(200)
    expect(json.name).toBe('Bjórbangsi')
    expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).name).toBe('Bjórbangsi')
  })

  it('rejects a blank name', async () => {
    const user = await createAccount('anna')
    signInAs(user)

    expect((await rename('   ')).status).toBe(400)
    expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).name).toBe('anna')
  })

  it('requires a signed-in user', async () => {
    expect((await rename('Bjórbangsi')).status).toBe(401)
  })
})
