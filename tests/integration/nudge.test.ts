import { describe, expect, it } from 'vitest'
import { GET as getNudge, POST as sendNudge } from '@/app/api/tastings/[id]/nudge/route'
import { prisma } from '@/lib/prisma'
import { callRoute, createTastingFixture, signInAs } from './helpers'

describe('/api/tastings/[id]/nudge', () => {
  it('starts with no nudge', async () => {
    const { tasting } = await createTastingFixture()
    const { json } = await callRoute(getNudge, { params: { id: tasting.id } })
    expect(json).toEqual({ nudgedAt: null, pendingParticipantIds: [] })
  })

  it('records only active participants who have not rated the current beer', async () => {
    const fixture = await createTastingFixture()
    const { tasting, participants, beers } = fixture
    const [anna, bjarni, gunna] = participants
    await prisma.tasting.update({ where: { id: tasting.id }, data: { currentTastingBeerId: beers[0].id } })
    await prisma.tastingBeer.update({ where: { id: beers[0].id }, data: { status: 'current' } })
    await prisma.rating.create({ data: { tastingId: tasting.id, tastingBeerId: beers[0].id, participantId: anna.id, score: 7 } })
    await prisma.participant.update({ where: { id: gunna.id }, data: { active: false } })

    signInAs(fixture.users[0])
    const sent = await callRoute(sendNudge, { method: 'POST', params: { id: tasting.id } })
    expect(sent.json.nudgedCount).toBe(1)

    const { json } = await callRoute(getNudge, { params: { id: tasting.id } })
    expect(json.pendingParticipantIds).toEqual([bjarni.id])
    expect(new Date(json.nudgedAt).getTime()).toBeGreaterThan(Date.now() - 10_000)
  })

  it('each nudge gets a new timestamp so clients fire again', async () => {
    const { tasting, beers, leader } = await createTastingFixture()
    await prisma.tasting.update({ where: { id: tasting.id }, data: { currentTastingBeerId: beers[0].id } })
    signInAs(leader)

    await callRoute(sendNudge, { method: 'POST', params: { id: tasting.id } })
    const first = (await callRoute(getNudge, { params: { id: tasting.id } })).json.nudgedAt
    await new Promise((resolve) => setTimeout(resolve, 5))
    await callRoute(sendNudge, { method: 'POST', params: { id: tasting.id } })
    const second = (await callRoute(getNudge, { params: { id: tasting.id } })).json.nudgedAt

    expect(second).not.toBe(first)
  })

  it('refuses to nudge without a current beer', async () => {
    const { tasting, leader } = await createTastingFixture()
    signInAs(leader)
    const { status } = await callRoute(sendNudge, { method: 'POST', params: { id: tasting.id } })
    expect(status).toBe(400)
  })

  it('returns 404 for an unknown tasting', async () => {
    const { status } = await callRoute(getNudge, { params: { id: '00000000-0000-0000-0000-000000000000' } })
    expect(status).toBe(404)
  })
})
