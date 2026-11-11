import { describe, expect, it } from 'vitest'
import { POST as addBeer } from '@/app/api/tastings/[id]/beers/route'
import { POST as rate } from '@/app/api/tastings/[id]/ratings/route'
import { PATCH as setCurrent } from '@/app/api/tastings/[id]/current/route'
import { prisma } from '@/lib/prisma'
import { callRoute, createTastingFixture, signInAs } from './helpers'

type Fixture = Awaited<ReturnType<typeof createTastingFixture>>

async function add(fixture: Fixture, body: Record<string, unknown>) {
  signInAs(fixture.leader)
  return callRoute(addBeer, { method: 'POST', params: { id: fixture.tasting.id }, body })
}

function catalogBeer() {
  return prisma.beer.create({
    data: { name: `Jólabjór ${crypto.randomUUID().slice(0, 6)}`, brewery: 'Brugghús', priceISK: 500, listedOnVinbudin: true },
  })
}

describe('adding beers mid-tasting', () => {
  it('adds a catalog beer and makes it current in one go', async () => {
    const fixture = await createTastingFixture({ beerCount: 0 })
    const beer = await catalogBeer()

    const added = await add(fixture, { beerId: beer.id, makeCurrent: true })

    expect(added.status).toBe(201)
    expect(added.json.status).toBe('current')
    const tasting = await prisma.tasting.findUniqueOrThrow({ where: { id: fixture.tasting.id } })
    expect(tasting.currentTastingBeerId).toBe(added.json.id)
  })

  it('adds a custom beer and makes it current', async () => {
    const fixture = await createTastingFixture({ beerCount: 0 })

    const added = await add(fixture, { name: 'Heimabrugg', brewery: 'Bílskúrinn', makeCurrent: true })

    expect(added.status).toBe(201)
    expect(added.json.status).toBe('current')
  })

  it('rolls the add back when the current beer is already rated', async () => {
    const fixture = await createTastingFixture({ beerCount: 1 })
    signInAs(fixture.leader)
    await callRoute(setCurrent, { method: 'PATCH', params: { id: fixture.tasting.id }, body: { beerId: fixture.beers[0].id } })
    signInAs(fixture.users[0])
    await callRoute(rate, { method: 'POST', params: { id: fixture.tasting.id }, body: { beerId: fixture.beers[0].id, score: 7 } })
    const beer = await catalogBeer()

    const added = await add(fixture, { beerId: beer.id, makeCurrent: true })

    expect(added.status).toBe(409)
    const beers = await prisma.tastingBeer.findMany({ where: { tastingId: fixture.tasting.id } })
    expect(beers.map((b) => b.status)).toEqual(['current'])
  })

  it('refuses to make a beer current before the tasting starts, without adding it', async () => {
    const fixture = await createTastingFixture({ beerCount: 0 })
    await prisma.tasting.update({ where: { id: fixture.tasting.id }, data: { status: 'draft' } })
    const beer = await catalogBeer()

    const added = await add(fixture, { beerId: beer.id, makeCurrent: true })

    expect(added.status).toBe(409)
    expect(await prisma.tastingBeer.count({ where: { tastingId: fixture.tasting.id } })).toBe(0)
  })

  it('refuses to add beers to a closed tasting', async () => {
    const fixture = await createTastingFixture({ beerCount: 0 })
    await prisma.tasting.update({ where: { id: fixture.tasting.id }, data: { status: 'closed' } })
    const beer = await catalogBeer()

    expect((await add(fixture, { beerId: beer.id })).status).toBe(409)
  })

  it('gives concurrent adds distinct positions', async () => {
    const fixture = await createTastingFixture({ beerCount: 0 })
    const beers = await Promise.all([catalogBeer(), catalogBeer(), catalogBeer()])

    await Promise.all(beers.map((beer) => add(fixture, { beerId: beer.id })))

    const added = await prisma.tastingBeer.findMany({ where: { tastingId: fixture.tasting.id } })
    expect(new Set(added.map((b) => b.orderIndex)).size).toBe(3)
  })
})
