import { describe, expect, it } from 'vitest'
import { GET as getJoinStatus, POST as join } from '@/app/api/tastings/[id]/join/route'
import { prisma } from '@/lib/prisma'
import { AVATARS, resolveAvatar } from '@/lib/avatars'
import { createParticipant } from '@/lib/participants'
import { callRoute, createAccount, createTastingFixture, signInAs } from './helpers'

describe('POST /api/tastings/[id]/join', () => {
  it('requires a signed-in user', async () => {
    const { tasting } = await createTastingFixture({ participantNames: [] })
    const { status } = await callRoute(join, { method: 'POST', params: { id: tasting.id } })
    expect(status).toBe(401)
  })

  it('creates the user from Clerk on first sign-in and joins them', async () => {
    const { tasting } = await createTastingFixture({ participantNames: [] })
    signInAs({ clerkId: 'clerk_new', name: 'Sigga Jóns', email: 'sigga@example.com' })

    const { status, json } = await callRoute(join, { method: 'POST', params: { id: tasting.id } })

    expect(status).toBe(200)
    expect(json.user.name).toBe('Sigga Jóns')
    expect(json.code).toMatch(/^[A-Z0-9]{4}$/)
    const user = await prisma.user.findUniqueOrThrow({ where: { clerkId: 'clerk_new' } })
    expect(user).toMatchObject({ email: 'sigga@example.com', isLeader: false, isAdmin: false })
  })

  it('joining twice returns the same participant', async () => {
    const { tasting } = await createTastingFixture({ participantNames: [] })
    signInAs({ clerkId: 'clerk_new', name: 'Sigga' })

    const first = await callRoute(join, { method: 'POST', params: { id: tasting.id } })
    const second = await callRoute(join, { method: 'POST', params: { id: tasting.id } })

    expect(second.json.participantId).toBe(first.json.participantId)
    expect(await prisma.participant.count({ where: { tastingId: tasting.id } })).toBe(1)
  })

  it('a double tap joins once instead of failing the second request', async () => {
    const { tasting } = await createTastingFixture({ participantNames: [] })
    signInAs({ clerkId: 'clerk_new', name: 'Sigga' })
    await callRoute(getJoinStatus, { params: { id: tasting.id } }) // the user row exists before the race, as in the app

    const [first, second] = await Promise.all([
      callRoute(join, { method: 'POST', params: { id: tasting.id } }),
      callRoute(join, { method: 'POST', params: { id: tasting.id } }),
    ])

    expect([first.status, second.status]).toEqual([200, 200])
    expect(second.json.participantId).toBe(first.json.participantId)
    expect(await prisma.participant.count({ where: { tastingId: tasting.id } })).toBe(1)
  })

  it('two accounts with the same display name stay separate people', async () => {
    const { tasting } = await createTastingFixture({ participantNames: [] })

    signInAs({ clerkId: 'clerk_jon1', name: 'Jón' })
    const first = await callRoute(join, { method: 'POST', params: { id: tasting.id } })
    signInAs({ clerkId: 'clerk_jon2', name: 'Jón' })
    const second = await callRoute(join, { method: 'POST', params: { id: tasting.id } })

    expect(second.json.participantId).not.toBe(first.json.participantId)
  })

  it('returns 404 for an unknown tasting', async () => {
    signInAs({ clerkId: 'clerk_new', name: 'Sigga' })
    const { status } = await callRoute(join, {
      method: 'POST',
      params: { id: '00000000-0000-0000-0000-000000000000' },
    })
    expect(status).toBe(404)
  })
})

describe('avatars', () => {
  it('gives everyone who joins a picture nobody else in the tasting has', async () => {
    const { tasting } = await createTastingFixture({ participantNames: [] })
    const users = await Promise.all(Array.from({ length: 10 }, (_, i) => createAccount(`guest${i}`)))

    // All at once: the per-tasting lock must stop two people grabbing the same free picture
    await Promise.all(users.map(user => createParticipant(tasting.id, user.id)))

    const avatars = (await prisma.participant.findMany({ where: { tastingId: tasting.id } })).map(p => p.avatar)
    expect(avatars).toHaveLength(10)
    expect(avatars.every(Boolean)).toBe(true)
    expect(new Set(avatars).size).toBe(10)
  })

  it('steers clear of the seeded picture of someone who joined before avatars were stored', async () => {
    const { tasting, participants } = await createTastingFixture({ participantNames: ['anna'] })
    const legacy = resolveAvatar(null, participants[0].id).key
    const users = await Promise.all(Array.from({ length: AVATARS.length - 1 }, (_, i) => createAccount(`guest${i}`)))

    for (const user of users) await createParticipant(tasting.id, user.id)

    const avatars = (await prisma.participant.findMany({ where: { tastingId: tasting.id, avatar: { not: null } } })).map(p => p.avatar)
    expect(avatars).not.toContain(legacy)
  })

  it('keeps a rejoining participant on the same picture', async () => {
    const { tasting } = await createTastingFixture({ participantNames: [] })
    signInAs({ clerkId: 'clerk_new', name: 'Sigga' })

    await callRoute(join, { method: 'POST', params: { id: tasting.id } })
    const before = await prisma.participant.findFirstOrThrow({ where: { tastingId: tasting.id } })
    await callRoute(join, { method: 'POST', params: { id: tasting.id } })

    expect((await prisma.participant.findUniqueOrThrow({ where: { id: before.id } })).avatar).toBe(before.avatar)
  })

  it('allows selecting an available avatar when joining and blocks selecting one already taken', async () => {
    const { tasting } = await createTastingFixture({ participantNames: [] })

    signInAs({ clerkId: 'clerk_1', name: 'Anna' })
    const first = await callRoute(join, {
      method: 'POST',
      params: { id: tasting.id },
      body: { avatar: 'gryla' },
    })
    expect(first.status).toBe(200)
    expect(first.json.avatar).toBe('gryla')

    signInAs({ clerkId: 'clerk_2', name: 'Bjarni' })
    const statusRes = await callRoute(getJoinStatus, {
      method: 'GET',
      params: { id: tasting.id },
    })
    expect(statusRes.status).toBe(200)
    expect(statusRes.json.alreadyJoined).toBe(false)
    expect(statusRes.json.takenAvatars).toContain('gryla')

    const conflict = await callRoute(join, {
      method: 'POST',
      params: { id: tasting.id },
      body: { avatar: 'gryla' },
    })
    expect(conflict.status).toBe(409)

    const second = await callRoute(join, {
      method: 'POST',
      params: { id: tasting.id },
      body: { avatar: 'thvorusleikir' },
    })
    expect(second.status).toBe(200)
    expect(second.json.avatar).toBe('thvorusleikir')

    // Rejoining with a different avatar in the body does not change the participant's locked-in avatar
    const rejoin = await callRoute(join, {
      method: 'POST',
      params: { id: tasting.id },
      body: { avatar: 'bossasveinn' },
    })
    expect(rejoin.status).toBe(200)
    expect(rejoin.json.avatar).toBe('thvorusleikir')
  })
})
