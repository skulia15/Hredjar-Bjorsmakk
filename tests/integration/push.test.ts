import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { DELETE as unsubscribe, POST as subscribe } from '@/app/api/push/subscriptions/route'
import { POST as sendNudge } from '@/app/api/tastings/[id]/nudge/route'
import { prisma } from '@/lib/prisma'
import { callRoute, createAccount, createTastingFixture, signInAs } from './helpers'

const sendNotification = vi.hoisted(() => vi.fn())
vi.mock('web-push', () => ({
  default: { setVapidDetails: vi.fn(), sendNotification },
}))

const keys = { p256dh: 'BPub', auth: 'secret' }
const endpointFor = (name: string) => `https://fcm.googleapis.com/fcm/send/${name}`

beforeAll(() => {
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'public'
  process.env.VAPID_PRIVATE_KEY = 'private'
  process.env.VAPID_SUBJECT = 'mailto:test@example.com'
})

beforeEach(() => {
  sendNotification.mockReset()
  sendNotification.mockResolvedValue({ statusCode: 201 })
})

describe('/api/push/subscriptions', () => {
  it('needs a signed-in user', async () => {
    const { status } = await callRoute(subscribe, {
      method: 'POST', params: {}, body: { endpoint: endpointFor('a'), keys },
    })
    expect(status).toBe(401)
  })

  it('refuses endpoints that are not a push service', async () => {
    signInAs(await createAccount('anna'))
    const { status } = await callRoute(subscribe, {
      method: 'POST', params: {}, body: { endpoint: 'https://169.254.169.254/latest', keys },
    })
    expect(status).toBe(400)
    expect(await prisma.pushSubscription.count()).toBe(0)
  })

  it('saves once per device and moves it to whoever signs in on it', async () => {
    const anna = await createAccount('anna')
    const bjarni = await createAccount('bjarni')
    const body = { endpoint: endpointFor('shared'), keys }

    signInAs(anna)
    await callRoute(subscribe, { method: 'POST', params: {}, body })
    await callRoute(subscribe, { method: 'POST', params: {}, body })
    signInAs(bjarni)
    await callRoute(subscribe, { method: 'POST', params: {}, body })

    const rows = await prisma.pushSubscription.findMany()
    expect(rows).toHaveLength(1)
    expect(rows[0].userId).toBe(bjarni.id)
  })

  it("can't delete someone else's subscription", async () => {
    const anna = await createAccount('anna')
    signInAs(anna)
    await callRoute(subscribe, { method: 'POST', params: {}, body: { endpoint: endpointFor('anna'), keys } })

    signInAs(await createAccount('bjarni'))
    await callRoute(unsubscribe, { method: 'DELETE', params: {}, body: { endpoint: endpointFor('anna') } })
    expect(await prisma.pushSubscription.count()).toBe(1)

    signInAs(anna)
    await callRoute(unsubscribe, { method: 'DELETE', params: {}, body: { endpoint: endpointFor('anna') } })
    expect(await prisma.pushSubscription.count()).toBe(0)
  })
})

describe('nudge push', () => {
  async function nudgeFixture() {
    const fixture = await createTastingFixture()
    const { tasting, beers, users, participants } = fixture
    await prisma.tasting.update({ where: { id: tasting.id }, data: { currentTastingBeerId: beers[0].id } })
    await prisma.tastingBeer.update({ where: { id: beers[0].id }, data: { status: 'current' } })
    // anna has rated; bjarni and gunna haven't
    await prisma.rating.create({
      data: { tastingId: tasting.id, tastingBeerId: beers[0].id, participantId: participants[0].id, score: 7 },
    })
    for (const user of users) {
      await prisma.pushSubscription.create({ data: { userId: user.id, endpoint: endpointFor(user.name), ...keys } })
    }
    return fixture
  }

  it('pushes only to devices of participants who still have to rate', async () => {
    const { tasting, leader } = await nudgeFixture()
    signInAs(leader)
    await callRoute(sendNudge, { method: 'POST', params: { id: tasting.id } })

    const endpoints = sendNotification.mock.calls.map(([subscription]) => subscription.endpoint).sort()
    expect(endpoints).toEqual([endpointFor('bjarni'), endpointFor('gunna')])
    const payload = JSON.parse(sendNotification.mock.calls[0][1])
    expect(payload).toMatchObject({ url: `/t/${tasting.id}/rate`, tag: `nudge-${tasting.id}` })
    expect(payload.body).toContain('Beer 1')
  })

  it('drops subscriptions the push service says are gone, and still nudges', async () => {
    const { tasting, leader } = await nudgeFixture()
    sendNotification.mockImplementation(async ({ endpoint }: { endpoint: string }) => {
      if (endpoint === endpointFor('bjarni')) throw Object.assign(new Error('Gone'), { statusCode: 410 })
      if (endpoint === endpointFor('gunna')) throw Object.assign(new Error('Busy'), { statusCode: 503 })
      return { statusCode: 201 }
    })

    signInAs(leader)
    const { status, json } = await callRoute(sendNudge, { method: 'POST', params: { id: tasting.id } })
    expect(status).toBe(200)
    expect(json.nudgedCount).toBe(2)

    const remaining = (await prisma.pushSubscription.findMany()).map(s => s.endpoint).sort()
    // 410 removed; a temporary 503 keeps the subscription
    expect(remaining).toEqual([endpointFor('anna'), endpointFor('gunna')])
  })
})
