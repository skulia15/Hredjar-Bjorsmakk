import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getHiddenTastingBeerId, lockRatingsIfAllRated } from '@/lib/hiddenScores'
import { countTags } from '@/lib/flavorTags'

/**
 * GET /api/tastings/{id}/current/pending-raters
 * Get pending raters for current beer
 *
 * Auth: Public (no authentication required)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get tasting with current beer
    const tasting = await prisma.tasting.findUnique({
      where: { id },
      select: {
        currentTastingBeerId: true,
        participants: {
          where: {
            active: true  // Only include active participants
          },
          include: {
            user: {
              select: {
                name: true,
                imageUrl: true
              }
            }
          }
        }
      }
    })

    if (!tasting) {
      return NextResponse.json(
        { error: 'Tasting not found' },
        { status: 404 }
      )
    }

    if (!tasting.currentTastingBeerId) {
      return NextResponse.json(
        { error: 'No current beer set' },
        { status: 400 }
      )
    }

    // Ratings for the current beer from people still in the tasting; a removed participant's kept
    // rating isn't one of the totalParticipants, and counting it showed "6 / 5"
    const ratings = await prisma.rating.findMany({
      where: {
        tastingBeerId: tasting.currentTastingBeerId,
        participant: { active: true }
      },
      include: {
        participant: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    const scoresHidden = (await getHiddenTastingBeerId(id)) === tasting.currentTastingBeerId
    // Polled by every client, so a lock from someone pausing or leaving is caught here too
    const ratingsLocked = await lockRatingsIfAllRated(id, tasting.currentTastingBeerId)
    const flavorTags = await prisma.flavorTags.findMany({
      where: { tastingBeerId: tasting.currentTastingBeerId },
      select: { tags: true }
    })

    // Create a set of participant IDs who have rated
    const ratedParticipantIds = new Set(ratings.map(r => r.participantId))

    // Split participants into rated and pending
    const rated = ratings.map(rating => ({
      participantId: rating.participantId,
      name: rating.participant.user?.name || `Notandi ${rating.participant.code}`,
      code: rating.participant.code,
      avatar: rating.participant.avatar,
      // Rated, then left: paused so the next beer won't wait on them
      paused: rating.participant.pausedAt !== null,
      score: scoresHidden ? null : rating.score,
      groupGuess: scoresHidden ? null : rating.groupGuess,
      // A note usually gives the verdict away, so it waits for the scores like the guess does
      note: scoresHidden ? null : rating.note,
      submittedAt: rating.updatedAt.toISOString()
    }))

    const toPending = (p: (typeof tasting.participants)[number]) => ({
      participantId: p.id,
      name: p.user?.name || `Notandi ${p.code}`,
      code: p.code,
      avatar: p.avatar,
      imageUrl: p.user?.imageUrl ?? null
    })
    const notRated = tasting.participants.filter(p => !ratedParticipantIds.has(p.id))
    const pending = notRated.filter(p => !p.pausedAt).map(toPending).sort((a, b) => a.name.localeCompare(b.name))
    // Stepped away: not waited on or counted, until they rate or the leader resumes them
    const paused = notRated.filter(p => p.pausedAt).map(toPending).sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({
      currentBeerId: tasting.currentTastingBeerId,
      totalParticipants: tasting.participants.length - paused.length,
      ratedCount: rated.length,
      pendingCount: pending.length,
      paused,
      scoresHidden,
      ratingsLocked,
      // Tags say little about the score, so they show even while scores are hidden
      tags: countTags(flavorTags),
      rated,
      pending
    })

  } catch (error: unknown) {
    console.error('Error fetching pending raters:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
