import type { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'

// Inside a transaction, pass it so the reads see its writes and don't take a second connection
type Db = Prisma.TransactionClient

/**
 * The tasting beer whose scores are hidden right now, or null.
 * With hideScoresUntilAllRated on, the current beer's scores stay hidden from everyone
 * (leaders included) until every active, unpaused participant has rated it, so nobody anchors on the group.
 */
export async function getHiddenTastingBeerId(tastingId: string, db: Db = prisma): Promise<string | null> {
  return hiddenUntilAllRated(tastingId, 'hideScoresUntilAllRated', db)
}

/**
 * The tasting beer whose rating notes are hidden right now, or null. Its own setting
 * (hideNotesUntilAllRated), so a tasting can hide scores but show notes as they come in, or the
 * other way round; hidden, they come out at the same moment hidden scores would.
 */
export async function getHiddenNotesTastingBeerId(tastingId: string, db: Db = prisma): Promise<string | null> {
  return hiddenUntilAllRated(tastingId, 'hideNotesUntilAllRated', db)
}

// The current beer, while the given setting is on and someone active hasn't rated it yet
async function hiddenUntilAllRated(
  tastingId: string,
  setting: 'hideScoresUntilAllRated' | 'hideNotesUntilAllRated',
  db: Db
): Promise<string | null> {
  const tasting = await db.tasting.findUnique({
    where: { id: tastingId },
    select: { status: true, hideScoresUntilAllRated: true, hideNotesUntilAllRated: true, currentTastingBeerId: true },
  })
  if (!tasting?.[setting] || tasting.status === 'closed' || !tasting.currentTastingBeerId) return null

  const currentTastingBeerId = tasting.currentTastingBeerId
  // Once its scores are out they stay out, even if someone joins or comes back after
  const current = await db.tastingBeer.findUnique({
    where: { id: currentTastingBeerId },
    select: { ratingsLockedAt: true },
  })
  if (current?.ratingsLockedAt) return null

  const pendingCount = await db.participant.count({
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
export async function lockRatingsIfAllRated(tastingId: string, tastingBeerId: string, db: Db = prisma): Promise<boolean> {
  const tastingBeer = await db.tastingBeer.findUnique({
    where: { id: tastingBeerId },
    select: { status: true, ratingsLockedAt: true },
  })
  if (!tastingBeer) return false
  if (tastingBeer.ratingsLockedAt || tastingBeer.status === 'finished') return true

  const [pendingCount, ratedCount] = await Promise.all([
    db.participant.count({
      where: { tastingId, active: true, pausedAt: null, ratings: { none: { tastingBeerId } } },
    }),
    db.rating.count({ where: { tastingBeerId } }),
  ])
  if (pendingCount > 0 || ratedCount === 0) return false

  await db.tastingBeer.updateMany({
    where: { id: tastingBeerId, ratingsLockedAt: null },
    data: { ratingsLockedAt: new Date() },
  })
  return true
}
