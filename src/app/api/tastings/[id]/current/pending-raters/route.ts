import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireLeader } from '@/lib/auth'

/**
 * GET /api/tastings/{id}/current/pending-raters
 * Get pending raters for current beer
 *
 * Auth: Leader required
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get userName from query params for leader auth
    const url = new URL(request.url)
    const userName = url.searchParams.get('userName')

    if (!userName) {
      return NextResponse.json(
        { error: 'userName query parameter required' },
        { status: 400 }
      )
    }

    // Verify leader access
    await requireLeader(userName)

    // Get tasting with current beer
    const tasting = await prisma.tasting.findUnique({
      where: { id: params.id },
      select: {
        currentBeerId: true,
        participants: {
          include: {
            user: {
              select: {
                name: true
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

    if (!tasting.currentBeerId) {
      return NextResponse.json(
        { error: 'No current beer set' },
        { status: 400 }
      )
    }

    // Get all ratings for current beer
    const ratings = await prisma.rating.findMany({
      where: {
        beerId: tasting.currentBeerId
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

    // Create a set of participant IDs who have rated
    const ratedParticipantIds = new Set(ratings.map(r => r.participantId))

    // Split participants into rated and pending
    const rated = ratings.map(rating => ({
      participantId: rating.participantId,
      name: rating.participant.user.name,
      code: rating.participant.code,
      score: rating.score,
      submittedAt: rating.updatedAt.toISOString()
    }))

    const pending = tasting.participants
      .filter(p => !ratedParticipantIds.has(p.id))
      .map(p => ({
        participantId: p.id,
        name: p.user.name,
        code: p.code
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({
      currentBeerId: tasting.currentBeerId,
      totalParticipants: tasting.participants.length,
      ratedCount: rated.length,
      pendingCount: pending.length,
      rated,
      pending
    })

  } catch (error: unknown) {
    console.error('Error fetching pending raters:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    if (errorMessage === 'Leader access required') {
      return NextResponse.json(
        { error: 'Leader access required' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
