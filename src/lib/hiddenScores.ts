import { prisma } from '@/lib/prisma'

/**
 * The tasting beer whose scores are hidden right now, or null.
 * With hideScoresUntilAllRated on, the current beer's scores stay hidden from everyone
 * (leaders included) until every active, unpaused participant has rated it, so nobody anchors on the group.
 */
export async function getHiddenTastingBeerId(tastingId: string): Promise<string | null> {
  const tasting = await prisma.tasting.findUnique({
    where: { id: tastingId },
    select: { status: true, hideScoresUntilAllRated: true, currentTastingBeerId: true },
  })
  if (!tasting?.hideScoresUntilAllRated || tasting.status === 'closed' || !tasting.currentTastingBeerId) return null

  const currentTastingBeerId = tasting.currentTastingBeerId
  const pendingCount = await prisma.participant.count({
    // Paused participants have stepped away; waiting on them would hide the scores indefinitely
    where: { tastingId, active: true, pausedAt: null, ratings: { none: { tastingBeerId: currentTastingBeerId } } },
  })
  return pendingCount > 0 ? currentTastingBeerId : null
}

/**
 * Whether ratings for a tasting beer can no longer change, locking them now if every active,
 * unpaused participant has rated it: that's when its scores come out, hidden or not.
 * Once locked it stays locked, even if someone joins or comes back later. Finished beers are locked too.
 */
export async function lockRatingsIfAllRated(tastingId: string, tastingBeerId: string): Promise<boolean> {
  const tastingBeer = await prisma.tastingBeer.findUnique({
    where: { id: tastingBeerId },
    select: { status: true, ratingsLockedAt: true },
  })
  if (!tastingBeer) return false
  if (tastingBeer.ratingsLockedAt || tastingBeer.status === 'finished') return true

  const [pendingCount, ratedCount] = await Promise.all([
    prisma.participant.count({
      where: { tastingId, active: true, pausedAt: null, ratings: { none: { tastingBeerId } } },
    }),
    prisma.rating.count({ where: { tastingBeerId } }),
  ])
  if (pendingCount > 0 || ratedCount === 0) return false

  await prisma.tastingBeer.updateMany({
    where: { id: tastingBeerId, ratingsLockedAt: null },
    data: { ratingsLockedAt: new Date() },
  })
  return true
}
