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
