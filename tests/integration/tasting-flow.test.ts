import { describe, expect, it } from 'vitest'
import { GET as getTasting, PATCH as updateTasting } from '@/app/api/tastings/[id]/route'
import { PATCH as setCurrent } from '@/app/api/tastings/[id]/current/route'
import { POST as finishBeer } from '@/app/api/tastings/[id]/beers/[beerId]/finish/route'
import { POST as rate } from '@/app/api/tastings/[id]/ratings/route'
import { GET as getScores } from '@/app/api/tastings/[id]/scores/route'
import { prisma } from '@/lib/prisma'
import { callRoute, createTastingFixture } from './helpers'

const LEADER = 'leader'

async function makeCurrent(tastingId: string, beerId: string, userName = LEADER) {
  return callRoute(setCurrent, { method: 'PATCH', params: { id: tastingId }, body: { beerId, userName } })
}

async function rateBeer(tastingId: string, beerId: string, participantId: string, score: number) {
  return callRoute(rate, { method: 'POST', params: { id: tastingId }, body: { beerId, participantId, score } })
}

describe('tasting flow', () => {
  it('runs current -> rate -> finish -> scores end to end', async () => {
    const { tasting, participants, beers } = await createTastingFixture()
    const [anna, bjarni] = participants

    expect((await makeCurrent(tasting.id, beers[0].id)).status).toBe(200)
    await rateBeer(tasting.id, beers[0].id, anna.id, 8)
    await rateBeer(tasting.id, beers[0].id, bjarni.id, 6.5)

    const finished = await callRoute(finishBeer, {
      method: 'POST',
      params: { id: tasting.id, beerId: beers[0].id },
      body: { userName: LEADER },
    })
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
    const { tasting, beers } = await createTastingFixture()

    await makeCurrent(tasting.id, beers[0].id)
    const switched = await makeCurrent(tasting.id, beers[1].id)

    expect(switched.json.currentBeerId).toBe(beers[1].id)
    const statuses = await prisma.tastingBeer.findMany({ where: { tastingId: tasting.id }, orderBy: { orderIndex: 'asc' } })
    expect(statuses.map((b) => b.status)).toEqual(['untasted', 'current', 'untasted'])
  })

  it('increments the tasting version on each state change', async () => {
    const { tasting, beers } = await createTastingFixture()

    const first = await makeCurrent(tasting.id, beers[0].id)
    const second = await makeCurrent(tasting.id, beers[1].id)

    expect(second.json.version).toBe(first.json.version + 1)
  })

  it('re-rating updates the existing rating instead of adding one', async () => {
    const { tasting, participants, beers } = await createTastingFixture()
    await makeCurrent(tasting.id, beers[0].id)

    await rateBeer(tasting.id, beers[0].id, participants[0].id, 5)
    await rateBeer(tasting.id, beers[0].id, participants[0].id, 9)

    const ratings = await prisma.rating.findMany({ where: { tastingBeerId: beers[0].id } })
    expect(ratings.map((r) => r.score)).toEqual([9])
  })

  it('rejects ratings for untasted beers and invalid scores', async () => {
    const { tasting, participants, beers } = await createTastingFixture()

    expect((await rateBeer(tasting.id, beers[0].id, participants[0].id, 8)).status).toBe(400)

    await makeCurrent(tasting.id, beers[0].id)
    expect((await rateBeer(tasting.id, beers[0].id, participants[0].id, 7.3)).status).toBe(400)
    expect(await prisma.rating.count()).toBe(0)
  })

  it('only allows untasted beers to become current and current beers to finish', async () => {
    const { tasting, beers } = await createTastingFixture()
    await makeCurrent(tasting.id, beers[0].id)
    await callRoute(finishBeer, { method: 'POST', params: { id: tasting.id, beerId: beers[0].id }, body: { userName: LEADER } })

    expect((await makeCurrent(tasting.id, beers[0].id)).status).toBe(400)
    const finishUntasted = await callRoute(finishBeer, {
      method: 'POST',
      params: { id: tasting.id, beerId: beers[1].id },
      body: { userName: LEADER },
    })
    expect(finishUntasted.status).toBe(400)
  })

  it('rejects leader actions from non-leaders', async () => {
    const { tasting, beers } = await createTastingFixture()

    expect((await makeCurrent(tasting.id, beers[0].id, 'anna')).status).toBe(403)
    const close = await callRoute(updateTasting, {
      method: 'PATCH',
      params: { id: tasting.id },
      body: { status: 'closed', userName: 'anna' },
    })
    expect(close.status).toBe(403)
  })

  it('leader can close the tasting', async () => {
    const { tasting } = await createTastingFixture()

    const close = await callRoute(updateTasting, {
      method: 'PATCH',
      params: { id: tasting.id },
      body: { status: 'closed', userName: LEADER },
    })

    expect(close.json.status).toBe('closed')
  })
})
