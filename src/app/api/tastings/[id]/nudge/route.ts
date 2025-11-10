import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { broadcastNudge } from '@/lib/sse'

/**
 * POST /api/tastings/{id}/nudge
 * Send a nudge notification to participants who haven't rated the current beer
 *
 * Auth: Public (no authentication required - relies on frontend checking)
 */
export async function POST(
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

    // Broadcast nudge event to all connected clients
    broadcastNudge(id, pendingParticipantIds)

    return NextResponse.json({
      success: true,
      nudgedCount: pendingParticipantIds.length,
      message: `Nudged ${pendingParticipantIds.length} participant${pendingParticipantIds.length !== 1 ? 's' : ''}`
    })

  } catch (error: unknown) {
    console.error('Error sending nudge:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
