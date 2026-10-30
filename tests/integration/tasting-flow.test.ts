import { describe, expect, it } from 'vitest'
import { GET as getTasting, PATCH as updateTasting } from '@/app/api/tastings/[id]/route'
import { PATCH as setCurrent } from '@/app/api/tastings/[id]/current/route'
import { POST as finishBeer } from '@/app/api/tastings/[id]/beers/[beerId]/finish/route'
import { POST as rate } from '@/app/api/tastings/[id]/ratings/route'
import { GET as getScores } from '@/app/api/tastings/[id]/scores/route'
import { prisma } from '@/lib/prisma'
import { callRoute, createTastingFixture, signInAs } from './helpers'

type Fixture = Awaited<ReturnType<typeof createTastingFixture>>

async function makeCurrent(fixture: Fixture, beerId: string) {
  signInAs(fixture.leader)
  return callRoute(setCurrent, { method: 'PATCH', params: { id: fixture.tasting.id }, body: { beerId } })
}

async function finish(fixture: Fixture, beerId: string) {
  signInAs(fixture.leader)
  return callRoute(finishBeer, { method: 'POST', params: { id: fixture.tasting.id, beerId } })
}

// Rates as the given participant's account
async function rateBeer(fixture: Fixture, participantIndex: number, beerId: string, score: number) {
  signInAs(fixture.users[participantIndex])
  return callRoute(rate, { method: 'POST', params: { id: fixture.tasting.id }, body: { beerId, score } })
}

describe('tasting flow', () => {
  it('runs current -> rate -> finish -> scores end to end', async () => {
    const fixture = await createTastingFixture()
    const { tasting, beers } = fixture

    expect((await makeCurrent(fixture, beers[0].id)).status).toBe(200)
    expect((await rateBeer(fixture, 0, beers[0].id, 8)).status).toBe(200)
    expect((await rateBeer(fixture, 1, beers[0].id, 6.5)).status).toBe(200)

    const finished = await finish(fixture, beers[0].id)
    expect(finished.status).toBe(200)
    expect(finished.json).toMatchObject({ status: 'finished', average: 7.25, count: 2 })

    const tastingAfter = await callRoute(getTasting, { params: { id: tasting.id } })
    expect(tastingAfter.json.currentBeerId).toBeNull()
    expect(tastingAfter.json.beers[0]).toMatchObject({ status: 'finished', averageRating: 7.25, ratingCount: 2 })

    const scores = await callRoute(getScores, { params: { id: tasting.id } })
    expect(scores.status).toBe(200)
    expect(JSON.stringify(scores.json)).toContain('Beer 1')
  })

  it('switching current beer puts the previous current beer back to untasted', async () => {
    const fixture = await createTastingFixture()
    const { tasting, beers } = fixture

    await makeCurrent(fixture, beers[0].id)
    const switched = await makeCurrent(fixture, beers[1].id)

    expect(switched.json.currentBeerId).toBe(beers[1].id)
    const statuses = await prisma.tastingBeer.findMany({ where: { tastingId: tasting.id }, orderBy: { orderIndex: 'asc' } })
    expect(statuses.map((b) => b.status)).toEqual(['untasted', 'current', 'untasted'])
  })

  it('increments the tasting version on each state change', async () => {
    const fixture = await createTastingFixture()

    const first = await makeCurrent(fixture, fixture.beers[0].id)
    const second = await makeCurrent(fixture, fixture.beers[1].id)

    expect(second.json.version).toBe(first.json.version + 1)
  })

  it('re-rating updates the existing rating instead of adding one', async () => {
    const fixture = await createTastingFixture()
    const { beers } = fixture
    await makeCurrent(fixture, beers[0].id)

    await rateBeer(fixture, 0, beers[0].id, 5)
    await rateBeer(fixture, 0, beers[0].id, 9)

    const ratings = await prisma.rating.findMany({ where: { tastingBeerId: beers[0].id } })
    expect(ratings.map((r) => r.score)).toEqual([9])
  })

  it('rejects ratings for untasted beers and invalid scores', async () => {
    const fixture = await createTastingFixture()
    const { beers } = fixture

    expect((await rateBeer(fixture, 0, beers[0].id, 8)).status).toBe(400)

    await makeCurrent(fixture, beers[0].id)
    expect((await rateBeer(fixture, 0, beers[0].id, 7.3)).status).toBe(400)
    expect(await prisma.rating.count()).toBe(0)
  })

  it('only allows untasted beers to become current and current beers to finish', async () => {
    const fixture = await createTastingFixture()
    const { beers } = fixture
    await makeCurrent(fixture, beers[0].id)
    await finish(fixture, beers[0].id)

    expect((await makeCurrent(fixture, beers[0].id)).status).toBe(400)
    expect((await finish(fixture, beers[1].id)).status).toBe(400)
  })

  it('leader can close the tasting', async () => {
    const fixture = await createTastingFixture()
    signInAs(fixture.leader)

    const close = await callRoute(updateTasting, {
      method: 'PATCH',
      params: { id: fixture.tasting.id },
      body: { status: 'closed' },
    })

    expect(close.json.status).toBe('closed')
  })
})
