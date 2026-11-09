import { describe, expect, it } from 'vitest'
import { PATCH as updateTasting } from '@/app/api/tastings/[id]/route'
import { PATCH as setCurrent } from '@/app/api/tastings/[id]/current/route'
import { POST as finishBeer } from '@/app/api/tastings/[id]/beers/[beerId]/finish/route'
import { POST as rate } from '@/app/api/tastings/[id]/ratings/route'
import { POST as join } from '@/app/api/tastings/[id]/join/route'
import { GET as analytics } from '@/app/api/tastings/[id]/analytics/route'
import { GET as priceAnalytics } from '@/app/api/tastings/[id]/price-analytics/route'
import { prisma } from '@/lib/prisma'
import { callRoute, createTastingFixture, signInAs } from './helpers'

type Fixture = Awaited<ReturnType<typeof createTastingFixture>>

// Puts a catalog beer behind each tasting beer, so country, ABV and catalog price apply
async function withCatalog(fixture: Fixture, beers: Array<{ country: string; abv?: number; priceISK?: number | null; pricePerLiter?: number | null }>) {
  for (const [index, spec] of beers.entries()) {
    const catalog = await prisma.beer.create({
      data: {
        name: `Catalog ${fixture.tasting.id.slice(0, 6)} ${index}`,
        brewery: 'Brewery',
        country: spec.country,
        abv: spec.abv ?? 5,
        priceISK: spec.priceISK ?? null,
        pricePerLiter: spec.pricePerLiter ?? null,
      },
    })
    await prisma.tastingBeer.update({ where: { id: fixture.beers[index].id }, data: { beerId: catalog.id } })
  }
}

// Pours each beer in turn, everyone rating it the given scores, then finishes it
async function pourAll(fixture: Fixture, scoresPerBeer: number[][]) {
  for (const [index, scores] of scoresPerBeer.entries()) {
    const beerId = fixture.beers[index].id
    signInAs(fixture.leader)
    await callRoute(setCurrent, { method: 'PATCH', params: { id: fixture.tasting.id }, body: { beerId } })
    for (const [participant, score] of scores.entries()) {
      signInAs(fixture.users[participant])
      await callRoute(rate, { method: 'POST', params: { id: fixture.tasting.id }, body: { beerId, score } })
    }
    signInAs(fixture.leader)
    await callRoute(finishBeer, { method: 'POST', params: { id: fixture.tasting.id, beerId } })
  }
}

const close = (fixture: Fixture) => {
  signInAs(fixture.leader)
  return callRoute(updateTasting, { method: 'PATCH', params: { id: fixture.tasting.id }, body: { status: 'closed' } })
}

describe('removed participants', () => {
  it('cannot join again after the leader removed them, though a leader still can', async () => {
    const fixture = await createTastingFixture()
    await prisma.participant.update({ where: { id: fixture.participants[0].id }, data: { active: false } })
    signInAs(fixture.users[0])
    const removed = await callRoute(join, { method: 'POST', params: { id: fixture.tasting.id } })
    expect(removed.status).toBe(403)
    expect(removed.json.code).toBe('REMOVED')
    expect((await prisma.participant.findUniqueOrThrow({ where: { id: fixture.participants[0].id } })).active).toBe(false)

    const leaderParticipant = await prisma.participant.create({
      data: { tastingId: fixture.tasting.id, userId: fixture.leader.id, code: 'LEAD', rejoinToken: 'lead-token', active: false },
    })
    signInAs(fixture.leader)
    expect((await callRoute(join, { method: 'POST', params: { id: fixture.tasting.id } })).status).toBe(200)
    expect((await prisma.participant.findUniqueOrThrow({ where: { id: leaderParticipant.id } })).active).toBe(true)
  })
})

describe('prices on the night', () => {
  it('fills a missing price from the catalog while open, then keeps it when the catalog changes after close', async () => {
    const fixture = await createTastingFixture({ beerCount: 2 })
    // The catalog had no price/L when the beers were added; it got one before the night
    await withCatalog(fixture, [
      { country: 'Ísland', priceISK: 500, pricePerLiter: 1500 },
      { country: 'Ísland', priceISK: 900, pricePerLiter: 2700 },
    ])
    await pourAll(fixture, [[8, 8, 8], [6, 6, 6]])

    const open = (await callRoute(priceAnalytics, { params: { id: fixture.tasting.id } })).json
    expect(open.overview.avgPrice).toBe(2100)

    await close(fixture)
    // Next year's sync
    await prisma.beer.updateMany({ where: { name: { startsWith: `Catalog ${fixture.tasting.id.slice(0, 6)}` } }, data: { pricePerLiter: 9999 } })

    const closed = (await callRoute(priceAnalytics, { params: { id: fixture.tasting.id } })).json
    expect(closed.overview.avgPrice).toBe(2100)
    const stats = (await callRoute(analytics, { params: { id: fixture.tasting.id } })).json
    expect(stats.bestValue).toMatchObject({ pricePerLiter: 1500 })
  })

  it('takes the true median and the best quarter of the beers', async () => {
    const fixture = await createTastingFixture({ beerCount: 4 })
    await prisma.tastingBeer.update({ where: { id: fixture.beers[0].id }, data: { pricePerLiter: 1000 } })
    await prisma.tastingBeer.update({ where: { id: fixture.beers[1].id }, data: { pricePerLiter: 2000 } })
    await prisma.tastingBeer.update({ where: { id: fixture.beers[2].id }, data: { pricePerLiter: 3000 } })
    await prisma.tastingBeer.update({ where: { id: fixture.beers[3].id }, data: { pricePerLiter: 4000 } })
    await withCatalog(fixture, [{ country: 'Ísland' }, { country: 'Ísland' }, { country: 'Ísland' }, { country: 'Ísland' }])
    await pourAll(fixture, [[9, 9, 9], [5, 5, 5], [6, 6, 6], [7, 7, 7]])

    const { overview } = (await callRoute(priceAnalytics, { params: { id: fixture.tasting.id } })).json
    expect(overview.medianPrice).toBe(2500)
    // Top quarter of 4 is the 9-rated beer alone, at 1000 kr/L against a 2500 mean: -60%
    expect(overview.premiumGap).toBe(-60)
  })
})

describe('analytics on an all-Icelandic night', () => {
  it('counts both spellings of Iceland, has nothing to compare, and keeps a 0% beer in the ABV chart', async () => {
    const fixture = await createTastingFixture({ beerCount: 2 })
    await withCatalog(fixture, [{ country: 'Ísland', abv: 0 }, { country: 'Iceland', abv: 6 }])
    await pourAll(fixture, [[7, 7, 7], [8, 8, 8]])

    const stats = (await callRoute(analytics, { params: { id: fixture.tasting.id } })).json
    expect(stats.localVsInternational).toMatchObject({
      comparable: false,
      icelandic: { beersCount: 2 },
      international: { beersCount: 0 },
      difference: 0,
      favoritism: 'Neutral',
    })
    expect(stats.abvVsRating.map((b: { abv: number }) => b.abv)).toEqual([0, 6])
  })
})
