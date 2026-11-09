import { describe, expect, it } from 'vitest'
import { GET as getTasting, PATCH as updateTasting } from '@/app/api/tastings/[id]/route'
import { PATCH as setCurrent } from '@/app/api/tastings/[id]/current/route'
import { GET as pendingRaters } from '@/app/api/tastings/[id]/current/pending-raters/route'
import { POST as finishBeer } from '@/app/api/tastings/[id]/beers/[beerId]/finish/route'
import { GET as ownRating, POST as rate } from '@/app/api/tastings/[id]/ratings/route'
import { GET as ratingsDetail } from '@/app/api/tastings/[id]/ratings-detail/route'
import { PUT as putFlavorTags } from '@/app/api/tastings/[id]/flavor-tags/route'
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

async function tagAs(fixture: Fixture, participantIndex: number, body: Record<string, unknown>) {
  signInAs(fixture.users[participantIndex])
  return callRoute(putFlavorTags, { method: 'PUT', params: { id: fixture.tasting.id }, body })
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

    expect((await pending(fixture)).json.scoresHidden).toBe(true)
    await prisma.tasting.update({ where: { id: fixture.tasting.id }, data: { status: 'closed' } })
    expect((await pending(fixture)).json.scoresHidden).toBe(false)
    await prisma.tasting.update({ where: { id: fixture.tasting.id }, data: { status: 'active' } })

    // Gunna left: everyone still active has rated
    await prisma.participant.update({ where: { id: fixture.participants[2].id }, data: { active: false } })
    expect((await pending(fixture)).json.scoresHidden).toBe(false)

    // Out is out: her coming back doesn't hide them again
    await prisma.participant.update({ where: { id: fixture.participants[2].id }, data: { active: true } })
    expect((await pending(fixture)).json.scoresHidden).toBe(false)
  })

  it('locks ratings once everyone has rated, and keeps them locked if someone joins later', async () => {
    const fixture = await createTastingFixture()
    const beer = fixture.beers[0]
    await makeCurrent(fixture, beer.id)
    await rateAs(fixture, 0, { beerId: beer.id, score: 8 })
    // Still open: anyone can change their mind before the last rating is in
    expect((await rateAs(fixture, 0, { beerId: beer.id, score: 9, note: 'Betri' })).status).toBe(200)
    await rateAs(fixture, 1, { beerId: beer.id, score: 6 })
    expect((await pending(fixture)).json.ratingsLocked).toBe(false)

    await rateAs(fixture, 2, { beerId: beer.id, score: 7 })
    expect((await pending(fixture)).json.ratingsLocked).toBe(true)
    expect((await rateAs(fixture, 0, { beerId: beer.id, score: 10 })).status).toBe(409)
    expect((await rateAs(fixture, 2, { beerId: beer.id, score: 7, note: 'Seinna' })).status).toBe(409)

    // Gunna comes back from a break: still locked for everyone who already rated
    await prisma.participant.update({ where: { id: fixture.participants[2].id }, data: { pausedAt: new Date() } })
    await prisma.participant.update({ where: { id: fixture.participants[2].id }, data: { pausedAt: null } })
    expect((await rateAs(fixture, 1, { beerId: beer.id, score: 9 })).status).toBe(409)
    const scores = await prisma.rating.findMany({ where: { tastingBeerId: beer.id }, select: { score: true } })
    expect(scores.map(r => r.score).sort()).toEqual([6, 7, 9])
  })

  it('keeps revealed scores out when someone joins or comes back, and takes no late guess', async () => {
    const fixture = await createTastingFixture()
    const beer = fixture.beers[0]
    await hideScores(fixture)
    await makeCurrent(fixture, beer.id)
    await rateAs(fixture, 0, { beerId: beer.id, score: 8 })
    await rateAs(fixture, 1, { beerId: beer.id, score: 6 })
    await prisma.participant.update({ where: { id: fixture.participants[2].id }, data: { pausedAt: new Date() } })
    expect((await pending(fixture)).json).toMatchObject({ scoresHidden: false, ratingsLocked: true })

    // Gunna comes back after the average has been on the projector
    await prisma.participant.update({ where: { id: fixture.participants[2].id }, data: { pausedAt: null } })
    expect((await pending(fixture)).json.scoresHidden).toBe(false)
    expect((await tastingJson(fixture)).beers[0]).toMatchObject({ scoresHidden: false, averageRating: 7 })

    expect((await rateAs(fixture, 2, { beerId: beer.id, score: 5, groupGuess: 7 })).status).toBe(200)
    const late = await prisma.rating.findFirstOrThrow({ where: { tastingBeerId: beer.id, participantId: fixture.participants[2].id } })
    expect(late.groupGuess).toBeNull()
  })

  it('takes no edit that races the last rating in', async () => {
    const fixture = await createTastingFixture()
    const beer = fixture.beers[0]
    await makeCurrent(fixture, beer.id)
    await rateAs(fixture, 0, { beerId: beer.id, score: 8 })
    await rateAs(fixture, 1, { beerId: beer.id, score: 6 })

    // Anna's edit and Gunna's last rating land together: either the edit got in first, or it's refused
    const [edit] = await Promise.all([
      rateAs(fixture, 0, { beerId: beer.id, score: 2 }),
      rateAs(fixture, 2, { beerId: beer.id, score: 7 }),
    ])
    const anna = await prisma.rating.findFirstOrThrow({ where: { tastingBeerId: beer.id, participantId: fixture.participants[0].id } })
    const locked = await prisma.tastingBeer.findUniqueOrThrow({ where: { id: beer.id } })
    expect(locked.ratingsLockedAt).not.toBeNull()
    if (edit.status === 200) expect(anna.updatedAt.getTime()).toBeLessThanOrEqual(locked.ratingsLockedAt!.getTime())
    else expect(anna.score).toBe(8)
  })

  it('still takes a first rating after the lock, and locks when the last one left pauses', async () => {
    const fixture = await createTastingFixture()
    const beer = fixture.beers[0]
    await makeCurrent(fixture, beer.id)
    await rateAs(fixture, 0, { beerId: beer.id, score: 8 })
    await rateAs(fixture, 1, { beerId: beer.id, score: 6 })

    // Gunna steps away: everyone left has rated, so the poll locks it
    await prisma.participant.update({ where: { id: fixture.participants[2].id }, data: { pausedAt: new Date() } })
    expect((await pending(fixture)).json.ratingsLocked).toBe(true)
    expect((await rateAs(fixture, 1, { beerId: beer.id, score: 7 })).status).toBe(409)

    // Back and rating it for the first time counts, but then it's locked for her too
    expect((await rateAs(fixture, 2, { beerId: beer.id, score: 5 })).status).toBe(200)
    expect((await rateAs(fixture, 2, { beerId: beer.id, score: 6 })).status).toBe(409)
  })

  it('locks ratings once the beer is finished', async () => {
    const fixture = await createTastingFixture()
    const beer = fixture.beers[0]
    await makeCurrent(fixture, beer.id)
    await rateAs(fixture, 0, { beerId: beer.id, score: 8 })
    await finish(fixture, beer.id)
    expect((await rateAs(fixture, 0, { beerId: beer.id, score: 9 })).status).toBe(409)
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
  it('saves tags apart from the rating, returns both as your own, and keeps tags when the score changes', async () => {
    const fixture = await createTastingFixture()
    const beer = fixture.beers[0]
    await makeCurrent(fixture, beer.id)

    const tagged = await tagAs(fixture, 0, { beerId: beer.id, tags: ['hoppy', 'citrus', 'hoppy'] })
    expect(tagged.json).toEqual({ beerId: beer.id, tags: ['hoppy', 'citrus'] })

    // Tagged but not rated: tags come back, the score doesn't
    const ownTagsOnly = await callRoute(ownRating, { params: { id: fixture.tasting.id }, path: `/?beerId=${beer.id}` })
    expect(ownTagsOnly.json).toEqual({ score: null, tags: ['hoppy', 'citrus'], note: null, groupGuess: null })

    const saved = await rateAs(fixture, 0, { beerId: beer.id, score: 8, note: '  Sítrónubomba  ' })
    expect(saved.json).toMatchObject({ score: 8, note: 'Sítrónubomba' })

    await rateAs(fixture, 0, { beerId: beer.id, score: 9 })
    const own = await callRoute(ownRating, { params: { id: fixture.tasting.id }, path: `/?beerId=${beer.id}` })
    expect(own.json).toEqual({ score: 9, tags: ['hoppy', 'citrus'], note: 'Sítrónubomba', groupGuess: null })

    // Untapping the last tag clears them
    await tagAs(fixture, 0, { beerId: beer.id, tags: [] })
    const cleared = await callRoute(ownRating, { params: { id: fixture.tasting.id }, path: `/?beerId=${beer.id}` })
    expect(cleared.json.tags).toEqual([])

    // Someone who hasn't rated or tagged gets null, not someone else's
    signInAs(fixture.users[1])
    const none = await callRoute(ownRating, { params: { id: fixture.tasting.id }, path: `/?beerId=${beer.id}` })
    expect(none.json).toBeNull()
  })

  it('tagging alone never counts as rating', async () => {
    const fixture = await createTastingFixture()
    const beer = fixture.beers[0]
    await makeCurrent(fixture, beer.id)
    await tagAs(fixture, 0, { beerId: beer.id, tags: ['hoppy'] })

    const live = await pending(fixture)
    expect(live.json.ratedCount).toBe(0)
    expect(live.json.tags).toEqual([{ tag: 'hoppy', count: 1 }])
    expect(await prisma.rating.count({ where: { tastingBeerId: beer.id } })).toBe(0)
  })

  it('stores custom tags normalized, and rejects too many of them and notes over 280 characters', async () => {
    const fixture = await createTastingFixture()
    const beer = fixture.beers[0]
    await makeCurrent(fixture, beer.id)

    const saved = await tagAs(fixture, 0, { beerId: beer.id, tags: [' negull', 'hoppy'] })
    expect(saved.status).toBe(200)
    expect(saved.json.tags).toEqual(['Negull', 'hoppy'])
    expect((await tagAs(fixture, 0, { beerId: beer.id, tags: ['a', 'b', 'c', 'd'] })).status).toBe(400)
    expect((await rateAs(fixture, 0, { beerId: beer.id, score: 8, note: 'x'.repeat(281) })).status).toBe(400)
  })

  it('only tags beers in the tasting that have been poured', async () => {
    const fixture = await createTastingFixture()
    expect((await tagAs(fixture, 0, { beerId: fixture.beers[0].id, tags: ['hoppy'] })).status).toBe(400)
    const other = await createTastingFixture()
    await makeCurrent(other, other.beers[0].id)
    expect((await tagAs(fixture, 0, { beerId: other.beers[0].id, tags: ['hoppy'] })).status).toBe(404)
  })

  it('shows tag counts on the current beer even while scores are hidden, and notes once it is finished', async () => {
    const fixture = await createTastingFixture()
    const beer = fixture.beers[0]
    await hideScores(fixture)
    await makeCurrent(fixture, beer.id)
    await tagAs(fixture, 0, { beerId: beer.id, tags: ['hoppy', 'bitter'] })
    await rateAs(fixture, 0, { beerId: beer.id, score: 8, note: 'Beiskur!' })
    await tagAs(fixture, 1, { beerId: beer.id, tags: ['hoppy'] })
    await rateAs(fixture, 1, { beerId: beer.id, score: 6 })

    const live = await pending(fixture)
    expect(live.json.scoresHidden).toBe(true)
    expect(live.json.tags).toEqual([{ tag: 'hoppy', count: 2 }, { tag: 'bitter', count: 1 }])

    // Notes only surface on finished beers
    expect((await callRoute(ratingsDetail, { params: { id: fixture.tasting.id } })).json.beers).toEqual([])
    await finish(fixture, beer.id)
    const detail = (await callRoute(ratingsDetail, { params: { id: fixture.tasting.id } })).json.beers[0]
    expect(detail.tags).toEqual([{ tag: 'hoppy', count: 2 }, { tag: 'bitter', count: 1 }])
    expect(detail.notes).toEqual([{ participantId: fixture.participants[0].id, userName: 'anna', avatar: null, note: 'Beiskur!' }])
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

    // Revealed now, so neither the score nor the guess can change
    expect((await rateAs(fixture, 0, { beerId: beer.id, score: 9, groupGuess: 7.7 })).status).toBe(409)

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
      { id: fixture.participants[0].id, name: 'anna', avatar: null, imageUrl: 'https://img.clerk.test/anna.png' },
      { id: fixture.participants[2].id, name: 'gunna', avatar: null, imageUrl: null },
    ])
  })
})
