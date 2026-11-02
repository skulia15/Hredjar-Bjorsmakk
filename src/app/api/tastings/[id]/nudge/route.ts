import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authErrorResponse, requireParticipantOrLeader } from '@/lib/auth'

/**
 * GET /api/tastings/{id}/nudge
 * Latest nudge for a tasting. Clients poll this and fire when nudgedAt changes.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const tasting = await prisma.tasting.findUnique({
      where: { id },
      select: { nudgedAt: true, nudgedParticipantIds: true }
    })

    if (!tasting) {
      return NextResponse.json(
        { error: 'Tasting not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      nudgedAt: tasting.nudgedAt?.toISOString() ?? null,
      pendingParticipantIds: tasting.nudgedParticipantIds
    })

  } catch (error: unknown) {
    console.error('Error fetching nudge:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tastings/{id}/nudge
 * Send a nudge notification to participants who haven't rated the current beer
 *
 * Auth: participants of the tasting, or any leader/admin
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await requireParticipantOrLeader(id)

    // Get tasting with current beer
    const tasting = await prisma.tasting.findUnique({
      where: { id },
      select: {
        currentTastingBeerId: true,
        participants: {
          where: {
            active: true,  // Only include active participants
            pausedAt: null  // Someone who stepped away isn't blasted with an airhorn
          },
          select: {
            id: true
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

    // Get all ratings for current beer
    const ratings = await prisma.rating.findMany({
      where: {
        tastingBeerId: tasting.currentTastingBeerId
      },
      select: {
        participantId: true
      }
    })

    // Create a set of participant IDs who have rated
    const ratedParticipantIds = new Set(ratings.map(r => r.participantId))

    // Find participants who haven't rated
    const pendingParticipantIds = tasting.participants
      .filter(p => !ratedParticipantIds.has(p.id))
      .map(p => p.id)

    // Persist the nudge; clients pick it up via GET polling (works across serverless instances)
    await prisma.tasting.update({
      where: { id },
      data: {
        nudgedAt: new Date(),
        nudgedParticipantIds: pendingParticipantIds
      }
    })

    return NextResponse.json({
      success: true,
      nudgedCount: pendingParticipantIds.length,
      message: `Nudged ${pendingParticipantIds.length} participant${pendingParticipantIds.length !== 1 ? 's' : ''}`
    })

  } catch (error: unknown) {
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Error sending nudge:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
