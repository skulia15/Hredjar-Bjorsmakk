import { describe, expect, it } from 'vitest'
import { POST as join } from '@/app/api/tastings/[id]/join/route'
import { prisma } from '@/lib/prisma'
import { callRoute, createTastingFixture, getCookie } from './helpers'

describe('POST /api/tastings/[id]/join', () => {
  it('creates a user and participant and sets the session cookie', async () => {
    const { tasting } = await createTastingFixture({ participantNames: [] })

    const { status, json } = await callRoute(join, { method: 'POST', params: { id: tasting.id }, body: { name: 'Sigga' } })

    expect(status).toBe(200)
    expect(json.user.name).toBe('sigga')
    expect(json.code).toMatch(/^[A-Z0-9]{4}$/)
    expect(getCookie('bt_participant')).toBe(json.rejoinToken)
    expect(await prisma.participant.count({ where: { tastingId: tasting.id } })).toBe(1)
  })

  it('rejoining with the same name in another case returns the same participant', async () => {
    const { tasting } = await createTastingFixture({ participantNames: [] })

    const first = await callRoute(join, { method: 'POST', params: { id: tasting.id }, body: { name: 'Sigga' } })
    const second = await callRoute(join, { method: 'POST', params: { id: tasting.id }, body: { name: '  SIGGA ' } })

    expect(second.json.participantId).toBe(first.json.participantId)
    expect(await prisma.participant.count({ where: { tastingId: tasting.id } })).toBe(1)
  })

  it('returns 404 for an unknown tasting', async () => {
    const { status } = await callRoute(join, {
      method: 'POST',
      params: { id: '00000000-0000-0000-0000-000000000000' },
      body: { name: 'Sigga' },
    })
    expect(status).toBe(404)
  })

  it('returns 400 for an empty name', async () => {
    const { tasting } = await createTastingFixture({ participantNames: [] })
    const { status } = await callRoute(join, { method: 'POST', params: { id: tasting.id }, body: { name: '' } })
    expect(status).toBe(400)
  })
})
