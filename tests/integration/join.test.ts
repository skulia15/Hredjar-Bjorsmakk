import { describe, expect, it } from 'vitest'
import { POST as join } from '@/app/api/tastings/[id]/join/route'
import { prisma } from '@/lib/prisma'
import { callRoute, createTastingFixture, signInAs } from './helpers'

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
