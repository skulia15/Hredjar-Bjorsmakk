import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authErrorResponse, requireLeader } from '@/lib/auth'

/**
 * PATCH { paused: boolean } — pause someone who stepped away so the group isn't kept waiting
 * on them (pending list, nudges, hidden scores). Rating or rejoining resumes them on its own.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  try {
    await requireLeader()

    const { id: tastingId, participantId } = await params
    const body = await request.json().catch(() => null)
    if (typeof body?.paused !== 'boolean') {
      return NextResponse.json({ error: 'paused must be a boolean' }, { status: 400 })
    }

    const { count } = await prisma.participant.updateMany({
      where: { id: participantId, tastingId },
      data: { pausedAt: body.paused ? new Date() : null }
    })
    if (count === 0) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, paused: body.paused })
  } catch (error) {
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Error pausing participant:', error)
    return NextResponse.json(
      { error: 'Failed to update participant' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  try {
    await requireLeader()

    const { id: tastingId, participantId } = await params
    const { searchParams } = new URL(request.url)
    const keepRatings = searchParams.get('keepRatings') === 'true'

    // Verify the participant exists and belongs to this tasting
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        _count: {
          select: { ratings: true }
        }
      }
    })

    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      )
    }

    if (participant.tastingId !== tastingId) {
      return NextResponse.json(
        { error: 'Participant does not belong to this tasting' },
        { status: 400 }
      )
    }

    if (keepRatings) {
      // Soft delete: mark as inactive, preserving ratings
      await prisma.participant.update({
        where: { id: participantId },
        data: { active: false }
      })

      return NextResponse.json({
        success: true,
        message: 'Participant removed (ratings preserved)',
        ratingsPreserved: participant._count.ratings
      })
    } else {
      // Hard delete: remove participant and cascade to ratings
      await prisma.participant.delete({
        where: { id: participantId }
      })

      return NextResponse.json({
        success: true,
        message: 'Participant removed successfully',
        ratingsDeleted: participant._count.ratings
      })
    }
  } catch (error) {
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Error deleting participant:', error)
    return NextResponse.json(
      { error: 'Failed to delete participant' },
      { status: 500 }
    )
  }
}