import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  try {
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
    console.error('Error deleting participant:', error)
    return NextResponse.json(
      { error: 'Failed to delete participant' },
      { status: 500 }
    )
  }
}