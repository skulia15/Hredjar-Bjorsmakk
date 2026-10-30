import { describe, expect, it } from 'vitest'
import { PATCH as updateTasting } from '@/app/api/tastings/[id]/route'
import { PATCH as setCurrent } from '@/app/api/tastings/[id]/current/route'
import { POST as finishBeer } from '@/app/api/tastings/[id]/beers/[beerId]/finish/route'
import { POST as addBeer } from '@/app/api/tastings/[id]/beers/route'
import { DELETE as deleteTastingBeer } from '@/app/api/tastings/[id]/beers/[beerId]/route'
import { POST as rate } from '@/app/api/tastings/[id]/ratings/route'
import { GET as exportTasting } from '@/app/api/tastings/[id]/export/route'
import { POST as sendNudge } from '@/app/api/tastings/[id]/nudge/route'
import { DELETE as removeParticipant } from '@/app/api/tastings/[id]/participants/[participantId]/route'
import { POST as createTasting } from '@/app/api/tastings/route'
import { DELETE as deleteCatalogBeer, PATCH as editCatalogBeer } from '@/app/api/beers/[id]/route'
import { POST as updateImages } from '@/app/api/beers/update-images/route'
import { GET as listUsers } from '@/app/api/admin/users/route'
import { GET as adminTastings } from '@/app/api/admin/tastings/route'
import { prisma } from '@/lib/prisma'
import { callRoute, createAccount, createTastingFixture, signInAs, signOut } from './helpers'

async function setupWithCurrentBeer() {
  const fixture = await createTastingFixture()
  await prisma.tastingBeer.update({ where: { id: fixture.beers[0].id }, data: { status: 'current' } })
  await prisma.tasting.update({ where: { id: fixture.tasting.id }, data: { currentTastingBeerId: fixture.beers[0].id } })
  return fixture
}

describe('identity comes from the session, not the request', () => {
  it('a "userName" in the body grants nothing (the old leader bypass)', async () => {
    const { tasting, beers, users } = await createTastingFixture()
    signInAs(users[0])

    const { status } = await callRoute(setCurrent, {
      method: 'PATCH',
      params: { id: tasting.id },
      body: { beerId: beers[0].id, userName: 'skúli' },
    })

    expect(status).toBe(403)
  })

  it('a participantId in the body cannot rate on behalf of someone else', async () => {
    const { tasting, beers, users, participants } = await setupWithCurrentBeer()
    const [, bjarni] = participants
    signInAs(users[0])

    await callRoute(rate, {
      method: 'POST',
      params: { id: tasting.id },
      body: { beerId: beers[0].id, participantId: bjarni.id, score: 1 },
    })

    const ratings = await prisma.rating.findMany({ select: { participantId: true } })
    expect(ratings).toEqual([{ participantId: participants[0].id }])
  })

  it('signed-out requests get 401', async () => {
    const { tasting, beers } = await setupWithCurrentBeer()
    signOut()

    expect((await callRoute(rate, { method: 'POST', params: { id: tasting.id }, body: { beerId: beers[0].id, score: 5 } })).status).toBe(401)
    expect((await callRoute(sendNudge, { method: 'POST', params: { id: tasting.id } })).status).toBe(401)
    expect((await callRoute(createTasting, { method: 'POST', params: {}, body: { title: 'x' } })).status).toBe(401)
  })

  it('an account that has not joined the tasting cannot rate or nudge', async () => {
    const { tasting, beers } = await setupWithCurrentBeer()
    signInAs(await createAccount('stranger'))

    expect((await callRoute(rate, { method: 'POST', params: { id: tasting.id }, body: { beerId: beers[0].id, score: 5 } })).status).toBe(403)
    expect((await callRoute(sendNudge, { method: 'POST', params: { id: tasting.id } })).status).toBe(403)
  })

  it('a removed participant cannot keep rating', async () => {
    const { tasting, beers, users, participants } = await setupWithCurrentBeer()
    await prisma.participant.update({ where: { id: participants[0].id }, data: { active: false } })
    signInAs(users[0])

    const { status } = await callRoute(rate, { method: 'POST', params: { id: tasting.id }, body: { beerId: beers[0].id, score: 5 } })
    expect(status).toBe(403)
  })
})

describe('leader-only actions reject participants', () => {
  it.each([
    ['set current beer', (f: Awaited<ReturnType<typeof createTastingFixture>>) =>
      callRoute(setCurrent, { method: 'PATCH', params: { id: f.tasting.id }, body: { beerId: f.beers[1].id } })],
    ['finish beer', (f: Awaited<ReturnType<typeof createTastingFixture>>) =>
      callRoute(finishBeer, { method: 'POST', params: { id: f.tasting.id, beerId: f.beers[0].id } })],
    ['close tasting', (f: Awaited<ReturnType<typeof createTastingFixture>>) =>
      callRoute(updateTasting, { method: 'PATCH', params: { id: f.tasting.id }, body: { status: 'closed' } })],
    ['add beer', (f: Awaited<ReturnType<typeof createTastingFixture>>) =>
      callRoute(addBeer, { method: 'POST', params: { id: f.tasting.id }, body: { name: 'X', brewery: 'Y' } })],
    ['delete tasting beer', (f: Awaited<ReturnType<typeof createTastingFixture>>) =>
      callRoute(deleteTastingBeer, { method: 'DELETE', params: { id: f.tasting.id, beerId: f.beers[2].id } })],
    ['export', (f: Awaited<ReturnType<typeof createTastingFixture>>) =>
      callRoute(exportTasting, { params: { id: f.tasting.id }, path: `/x?format=csv` })],
    ['remove participant', (f: Awaited<ReturnType<typeof createTastingFixture>>) =>
      callRoute(removeParticipant, { method: 'DELETE', params: { id: f.tasting.id, participantId: f.participants[1].id } })],
    ['create tasting', () =>
      callRoute(createTasting, { method: 'POST', params: {}, body: { title: 'Mine now' } })],
    ['refresh catalog images', () =>
      callRoute(updateImages as never, { method: 'POST', params: {} })],
  ])('%s', async (_name, action) => {
    const fixture = await setupWithCurrentBeer()
    signInAs(fixture.users[0])

    const { status } = await action(fixture)

    expect(status).toBe(403)
  })

  it('the same actions work for a leader', async () => {
    const fixture = await setupWithCurrentBeer()
    signInAs(fixture.leader)

    expect((await callRoute(exportTasting, { params: { id: fixture.tasting.id }, path: '/x?format=csv' })).status).toBe(200)
    expect((await callRoute(createTasting, { method: 'POST', params: {}, body: { title: 'New' } })).status).toBe(201)
  })
})

describe('ids from another tasting are rejected', () => {
  it('rating, setting current and finishing a beer from a different tasting return 404', async () => {
    const mine = await setupWithCurrentBeer()
    const other = await setupWithCurrentBeer()

    signInAs(mine.users[0])
    expect((await callRoute(rate, { method: 'POST', params: { id: mine.tasting.id }, body: { beerId: other.beers[0].id, score: 5 } })).status).toBe(404)

    signInAs(mine.leader)
    expect((await callRoute(setCurrent, { method: 'PATCH', params: { id: mine.tasting.id }, body: { beerId: other.beers[1].id } })).status).toBe(404)
    expect((await callRoute(finishBeer, { method: 'POST', params: { id: mine.tasting.id, beerId: other.beers[0].id } })).status).toBe(404)
    expect((await callRoute(deleteTastingBeer, { method: 'DELETE', params: { id: mine.tasting.id, beerId: other.beers[2].id } })).status).toBe(404)
  })
})

describe('catalog and admin endpoints', () => {
  it('editing the catalog needs a leader; deleting from it needs an admin', async () => {
    const beer = await prisma.beer.create({ data: { name: 'Gull', brewery: 'Ölgerðin', styles: [] } })
    const participant = await createAccount('pat')
    const leader = await createAccount('lea', { isLeader: true })
    const admin = await createAccount('adm', { isAdmin: true })

    signInAs(participant)
    expect((await callRoute(editCatalogBeer, { method: 'PATCH', params: { id: beer.id }, body: { name: 'Gull Lite' } })).status).toBe(403)

    signInAs(leader)
    expect((await callRoute(deleteCatalogBeer, { method: 'DELETE', params: { id: beer.id } })).status).toBe(403)

    signInAs(admin)
    expect((await callRoute(deleteCatalogBeer, { method: 'DELETE', params: { id: beer.id } })).status).toBe(200)
  })

  it('admin lists are closed to leaders and anonymous users', async () => {
    signOut()
    expect((await callRoute(listUsers as never, { params: {} })).status).toBe(401)
    expect((await callRoute(adminTastings as never, { params: {} })).status).toBe(401)

    signInAs(await createAccount('lea', { isLeader: true }))
    expect((await callRoute(listUsers as never, { params: {} })).status).toBe(403)
    expect((await callRoute(adminTastings as never, { params: {} })).status).toBe(403)
  })
})
