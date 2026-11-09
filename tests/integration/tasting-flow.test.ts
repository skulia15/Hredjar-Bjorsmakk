import { describe, expect, it } from 'vitest'
import { GET as getTasting, PATCH as updateTasting } from '@/app/api/tastings/[id]/route'
import { PATCH as setCurrent } from '@/app/api/tastings/[id]/current/route'
import { POST as finishBeer } from '@/app/api/tastings/[id]/beers/[beerId]/finish/route'
import { POST as rate } from '@/app/api/tastings/[id]/ratings/route'
import { GET as getScores } from '@/app/api/tastings/[id]/scores/route'
import { GET as getLeaderboard } from '@/app/api/tastings/[id]/leaderboard/route'
import { GET as pendingRaters } from '@/app/api/tastings/[id]/current/pending-raters/route'
import { GET as exportTasting } from '@/app/api/tastings/[id]/export/route'
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

  it('refuses to switch away from a beer people have rated, so its scores stay put', async () => {
    const fixture = await createTastingFixture()
    const { beers } = fixture
    await makeCurrent(fixture, beers[0].id)
    await rateBeer(fixture, 0, beers[0].id, 8)

    const switched = await makeCurrent(fixture, beers[1].id)

    expect(switched.status).toBe(409)
    const statuses = await prisma.tastingBeer.findMany({ where: { tastingId: fixture.tasting.id }, orderBy: { orderIndex: 'asc' } })
    expect(statuses.map((b) => b.status)).toEqual(['current', 'untasted', 'untasted'])
  })

  it('two switches at once leave one beer current', async () => {
    const fixture = await createTastingFixture()
    const { beers } = fixture
    await Promise.all([makeCurrent(fixture, beers[0].id), makeCurrent(fixture, beers[1].id)])

    const current = await prisma.tastingBeer.findMany({ where: { tastingId: fixture.tasting.id, status: 'current' } })
    const tasting = await prisma.tasting.findUniqueOrThrow({ where: { id: fixture.tasting.id } })
    expect(current).toHaveLength(1)
    expect(tasting.currentTastingBeerId).toBe(current[0].id)
  })

  it('ranks only rated beers, and beers on the same average share a place', async () => {
    const fixture = await createTastingFixture({ beerCount: 4 })
    const [a, b, c, unrated] = fixture.beers
    for (const [beer, score] of [[a, 7.5], [b, 7.5], [c, 6]] as const) {
      await makeCurrent(fixture, beer.id)
      await rateBeer(fixture, 0, beer.id, score)
      await finish(fixture, beer.id)
    }
    await makeCurrent(fixture, unrated.id)
    await finish(fixture, unrated.id)

    for (const route of [getScores, getLeaderboard]) {
      const { json } = await callRoute(route, { params: { id: fixture.tasting.id } })
      expect(json.beers.map((beer: { rank: number }) => beer.rank)).toEqual([1, 1, 3])
      expect(json.beers.map((beer: { beerId: string }) => beer.beerId)).not.toContain(unrated.id)
    }
  })

  it('counts only people still in the tasting as having rated the current beer', async () => {
    const fixture = await createTastingFixture()
    const beer = fixture.beers[0]
    await makeCurrent(fixture, beer.id)
    await rateBeer(fixture, 0, beer.id, 8)
    await rateBeer(fixture, 1, beer.id, 6)
    // Removed, ratings kept
    await prisma.participant.update({ where: { id: fixture.participants[1].id }, data: { active: false } })

    const { json } = await callRoute(pendingRaters, { params: { id: fixture.tasting.id } })

    expect(json).toMatchObject({ ratedCount: 1, totalParticipants: 2, pendingCount: 1 })
  })

  it('exports CSV as UTF-8 with typed-in text kept from running as a formula', async () => {
    const fixture = await createTastingFixture()
    const beer = fixture.beers[0]
    await makeCurrent(fixture, beer.id)
    signInAs(fixture.users[0])
    await callRoute(rate, { method: 'POST', params: { id: fixture.tasting.id }, body: { beerId: beer.id, score: 8, note: '=HYPERLINK("http://x","smelltu")' } })
    await rateBeer(fixture, 1, beer.id, 7)

    signInAs(fixture.leader)
    const { response } = await callRoute(exportTasting, { params: { id: fixture.tasting.id }, path: '/?format=csv' })
    const bytes = Buffer.from(await response.arrayBuffer())

    expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf])
    const csv = bytes.toString('utf8')
    expect(csv).toContain(`'=HYPERLINK`)
    expect(csv).not.toMatch(/(^|,)"?=HYPERLINK/m)
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

  it('closing finishes the beer still on, so it stays in the results, and takes no more ratings', async () => {
    const fixture = await createTastingFixture()
    const [first, last] = fixture.beers
    await makeCurrent(fixture, first.id)
    await rateBeer(fixture, 0, first.id, 7)
    await finish(fixture, first.id)
    await makeCurrent(fixture, last.id)
    await rateBeer(fixture, 0, last.id, 9)

    signInAs(fixture.leader)
    await callRoute(updateTasting, { method: 'PATCH', params: { id: fixture.tasting.id }, body: { status: 'closed' } })

    const tasting = await prisma.tasting.findUniqueOrThrow({ where: { id: fixture.tasting.id } })
    expect(tasting.currentTastingBeerId).toBeNull()
    const scores = await callRoute(getScores, { params: { id: fixture.tasting.id } })
    expect(scores.json.beers.map((b: { beerId: string }) => b.beerId).sort()).toEqual([first.id, last.id].sort())

    expect((await rateBeer(fixture, 1, last.id, 5)).status).toBe(409)
    expect((await rateBeer(fixture, 1, first.id, 5)).status).toBe(409)
  })
})
