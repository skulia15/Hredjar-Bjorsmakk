import { describe, expect, it } from 'vitest'
import { GET as getTasting, PATCH as updateTasting } from '@/app/api/tastings/[id]/route'
import { PATCH as setCurrent } from '@/app/api/tastings/[id]/current/route'
import { GET as pendingRaters } from '@/app/api/tastings/[id]/current/pending-raters/route'
import { POST as finishBeer } from '@/app/api/tastings/[id]/beers/[beerId]/finish/route'
import { GET as ownRating, POST as rate } from '@/app/api/tastings/[id]/ratings/route'
import { GET as ratingsDetail } from '@/app/api/tastings/[id]/ratings-detail/route'
import { GET as analytics } from '@/app/api/tastings/[id]/analytics/route'
import { prisma } from '@/lib/prisma'
import { callRoute, createTastingFixture, signInAs } from './helpers'

type Fixture = Awaited<ReturnType<typeof createTastingFixture>>

async function hideScores(fixture: Fixture, hideScoresUntilAllRated = true) {
  signInAs(fixture.leader)
  return callRoute(updateTasting, { method: 'PATCH', params: { id: fixture.tasting.id }, body: { hideScoresUntilAllRated } })
}

async function makeCurrent(fixture: Fixture, beerId: string) {
  signInAs(fixture.leader)
  return callRoute(setCurrent, { method: 'PATCH', params: { id: fixture.tasting.id }, body: { beerId } })
}

async function finish(fixture: Fixture, beerId: string) {
  signInAs(fixture.leader)
  return callRoute(finishBeer, { method: 'POST', params: { id: fixture.tasting.id, beerId } })
}

async function rateAs(fixture: Fixture, participantIndex: number, body: Record<string, unknown>) {
  signInAs(fixture.users[participantIndex])
  return callRoute(rate, { method: 'POST', params: { id: fixture.tasting.id }, body })
}

const pending = (fixture: Fixture) => callRoute(pendingRaters, { params: { id: fixture.tasting.id } })
const tastingJson = async (fixture: Fixture) => (await callRoute(getTasting, { params: { id: fixture.tasting.id } })).json

describe('hide scores until everyone has rated', () => {
  it('hides the current beer’s scores from everyone until the last active participant rates', async () => {
    const fixture = await createTastingFixture()
    const beer = fixture.beers[0]
    expect((await hideScores(fixture)).json.hideScoresUntilAllRated).toBe(true)
    await makeCurrent(fixture, beer.id)

    await rateAs(fixture, 0, { beerId: beer.id, score: 8 })
    await rateAs(fixture, 1, { beerId: beer.id, score: 6 })

    // Leaders don't get to peek either
    signInAs(fixture.leader)
    const hidden = await pending(fixture)
    expect(hidden.json).toMatchObject({ scoresHidden: true, ratedCount: 2, pendingCount: 1 })
    expect(hidden.json.rated.every((r: { score: number | null }) => r.score === null)).toBe(true)
    const hiddenBeer = (await tastingJson(fixture)).beers[0]
    expect(hiddenBeer).toMatchObject({ scoresHidden: true, averageRating: null, ratingCount: 2 })
    const hiddenAnalytics = (await callRoute(analytics, { params: { id: fixture.tasting.id } })).json
    expect(hiddenAnalytics.overview.totalRatings).toBe(0)

    await rateAs(fixture, 2, { beerId: beer.id, score: 7 })

    const revealed = await pending(fixture)
    expect(revealed.json.scoresHidden).toBe(false)
    expect(revealed.json.rated.map((r: { score: number }) => r.score).sort()).toEqual([6, 7, 8])
    expect((await tastingJson(fixture)).beers[0]).toMatchObject({ scoresHidden: false, averageRating: 7 })
  })

  it('ignores removed participants and never hides on a closed tasting', async () => {
    const fixture = await createTastingFixture()
    const beer = fixture.beers[0]
    await hideScores(fixture)
    await makeCurrent(fixture, beer.id)
    await rateAs(fixture, 0, { beerId: beer.id, score: 8 })
    await rateAs(fixture, 1, { beerId: beer.id, score: 6 })

    // Gunna left: everyone still active has rated
    await prisma.participant.update({ where: { id: fixture.participants[2].id }, data: { active: false } })
    expect((await pending(fixture)).json.scoresHidden).toBe(false)

    await prisma.participant.update({ where: { id: fixture.participants[2].id }, data: { active: true } })
    expect((await pending(fixture)).json.scoresHidden).toBe(true)
    await prisma.tasting.update({ where: { id: fixture.tasting.id }, data: { status: 'closed' } })
    expect((await pending(fixture)).json.scoresHidden).toBe(false)
  })

  it('is off by default, and only leaders can turn it on', async () => {
    const fixture = await createTastingFixture()
    expect((await tastingJson(fixture)).hideScoresUntilAllRated).toBe(false)

    signInAs(fixture.users[0])
    const denied = await callRoute(updateTasting, {
      method: 'PATCH',
      params: { id: fixture.tasting.id },
      body: { hideScoresUntilAllRated: true },
    })
    expect(denied.status).toBe(403)
  })
})

describe('flavor tags and notes', () => {
  it('saves tags and a note, returns them as your own rating, and keeps them when only the score changes', async () => {
    const fixture = await createTastingFixture()
    const beer = fixture.beers[0]
    await makeCurrent(fixture, beer.id)

    const saved = await rateAs(fixture, 0, { beerId: beer.id, score: 8, tags: ['hoppy', 'citrus', 'hoppy'], note: '  Sítrónubomba  ' })
    expect(saved.json).toMatchObject({ score: 8, tags: ['hoppy', 'citrus'], note: 'Sítrónubomba' })

    await rateAs(fixture, 0, { beerId: beer.id, score: 9 })
    const own = await callRoute(ownRating, { params: { id: fixture.tasting.id }, path: `/?beerId=${beer.id}` })
    expect(own.json).toEqual({ score: 9, tags: ['hoppy', 'citrus'], note: 'Sítrónubomba', groupGuess: null })

    // Someone who hasn't rated gets null, not someone else's rating
    signInAs(fixture.users[1])
    const none = await callRoute(ownRating, { params: { id: fixture.tasting.id }, path: `/?beerId=${beer.id}` })
    expect(none.json).toBeNull()
  })

  it('rejects unknown tags and notes over 280 characters', async () => {
    const fixture = await createTastingFixture()
    const beer = fixture.beers[0]
    await makeCurrent(fixture, beer.id)

    expect((await rateAs(fixture, 0, { beerId: beer.id, score: 8, tags: ['delicious'] })).status).toBe(400)
    expect((await rateAs(fixture, 0, { beerId: beer.id, score: 8, note: 'x'.repeat(281) })).status).toBe(400)
  })

  it('shows tag counts on the current beer even while scores are hidden, and notes once it is finished', async () => {
    const fixture = await createTastingFixture()
    const beer = fixture.beers[0]
    await hideScores(fixture)
    await makeCurrent(fixture, beer.id)
    await rateAs(fixture, 0, { beerId: beer.id, score: 8, tags: ['hoppy', 'bitter'], note: 'Beiskur!' })
    await rateAs(fixture, 1, { beerId: beer.id, score: 6, tags: ['hoppy'] })

    const live = await pending(fixture)
    expect(live.json.scoresHidden).toBe(true)
    expect(live.json.tags).toEqual([{ tag: 'hoppy', count: 2 }, { tag: 'bitter', count: 1 }])

    // Notes only surface on finished beers
    expect((await callRoute(ratingsDetail, { params: { id: fixture.tasting.id } })).json.beers).toEqual([])
    await finish(fixture, beer.id)
    const detail = (await callRoute(ratingsDetail, { params: { id: fixture.tasting.id } })).json.beers[0]
    expect(detail.tags).toEqual([{ tag: 'hoppy', count: 2 }, { tag: 'bitter', count: 1 }])
    expect(detail.notes).toEqual([{ participantId: fixture.participants[0].id, userName: 'anna', note: 'Beiskur!' }])
  })
})

describe('guess the group average', () => {
  it('takes guesses only while the beer’s scores are hidden', async () => {
    const fixture = await createTastingFixture()
    const beer = fixture.beers[0]
    await hideScores(fixture)
    await makeCurrent(fixture, beer.id)

    expect((await rateAs(fixture, 0, { beerId: beer.id, score: 8, groupGuess: 7.04 })).json.groupGuess).toBe(7)
    // While hidden, the guesses aren't exposed either
    expect((await pending(fixture)).json.rated[0].groupGuess).toBeNull()

    await rateAs(fixture, 1, { beerId: beer.id, score: 6, groupGuess: 6.5 })
    // The last rater's guess still counts: it's checked before their rating reveals the scores
    expect((await rateAs(fixture, 2, { beerId: beer.id, score: 7, groupGuess: 7.2 })).json.groupGuess).toBe(7.2)

    // Revealed now, so a changed guess is dropped but the new score is kept
    const late = await rateAs(fixture, 0, { beerId: beer.id, score: 9, groupGuess: 7.7 })
    expect(late.json).toMatchObject({ score: 9, groupGuess: 7 })

    const revealed = await pending(fixture)
    expect(revealed.json.rated.map((r: { groupGuess: number }) => r.groupGuess).sort()).toEqual([6.5, 7, 7.2])
  })

  it('drops guesses when the tasting doesn’t hide scores', async () => {
    const fixture = await createTastingFixture()
    const beer = fixture.beers[0]
    await makeCurrent(fixture, beer.id)
    expect((await rateAs(fixture, 0, { beerId: beer.id, score: 8, groupGuess: 8 })).json.groupGuess).toBeNull()
  })

  it('ranks guessers, and picks best value from snapshotted prices, in analytics', async () => {
    const fixture = await createTastingFixture()
    const [first, second] = fixture.beers
    await prisma.tastingBeer.update({ where: { id: first.id }, data: { priceISK: 450, pricePerLiter: 1360 } })
    await prisma.tastingBeer.update({ where: { id: second.id }, data: { priceISK: 990, pricePerLiter: 3000 } })
    await hideScores(fixture)

    // Beer 1 average 7: anna guesses 7 (spot on), bjarni 5 (2 off)
    await makeCurrent(fixture, first.id)
    await rateAs(fixture, 0, { beerId: first.id, score: 8, groupGuess: 7 })
    await rateAs(fixture, 1, { beerId: first.id, score: 6, groupGuess: 5 })
    await rateAs(fixture, 2, { beerId: first.id, score: 7 })
    await finish(fixture, first.id)

    // Beer 2 average 8: anna guesses 7.5 (0.5 off)
    await makeCurrent(fixture, second.id)
    await rateAs(fixture, 0, { beerId: second.id, score: 8, groupGuess: 7.5 })
    await rateAs(fixture, 1, { beerId: second.id, score: 8 })
    await rateAs(fixture, 2, { beerId: second.id, score: 8 })
    await finish(fixture, second.id)

    const json = (await callRoute(analytics, { params: { id: fixture.tasting.id } })).json
    expect(json.guessAccuracy).toEqual([
      { participantId: fixture.participants[0].id, userName: 'anna', meanError: 0.25, guesses: 2 },
      { participantId: fixture.participants[1].id, userName: 'bjarni', meanError: 2, guesses: 1 },
    ])
    // 7 for 1360 kr/L beats 8 for 3000 kr/L
    expect(json.bestValue).toEqual({ name: 'Beer 1', average: 7, pricePerLiter: 1360 })

    const detail = (await callRoute(ratingsDetail, { params: { id: fixture.tasting.id } })).json
    const firstDetail = detail.beers.find((b: { beerId: string }) => b.beerId === first.id)
    expect(firstDetail.guesses).toHaveLength(2)
  })
})

describe('projector lobby', () => {
  it('lists active participants with names and avatars, oldest first', async () => {
    const fixture = await createTastingFixture()
    await prisma.user.update({ where: { id: fixture.users[0].id }, data: { imageUrl: 'https://img.clerk.test/anna.png' } })
    await prisma.participant.update({ where: { id: fixture.participants[1].id }, data: { active: false } })

    const { participants } = await tastingJson(fixture)
    expect(participants).toEqual([
      { id: fixture.participants[0].id, name: 'anna', imageUrl: 'https://img.clerk.test/anna.png' },
      { id: fixture.participants[2].id, name: 'gunna', imageUrl: null },
    ])
  })
})
