import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authErrorResponse, generateUniqueParticipantCode, isLeaderOrAdmin, requireUser } from '@/lib/auth';
import { randomUUID } from 'crypto';

// POST /api/tastings/[id]/join - Join tasting as the signed-in user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireUser();

    // Verify tasting exists
    const tasting = await prisma.tasting.findUnique({
      where: { id }
    });

    if (!tasting) {
      return NextResponse.json(
        { error: 'Tasting not found' },
        { status: 404 }
      );
    }

    // Check if user already has a participant record for this tasting
    let participant = await prisma.participant.findUnique({
      where: {
        tastingId_userId: {
          tastingId: id,
          userId: user.id
        }
      }
    });

    if (participant) {
      // User already joined (or was removed and is rejoining) - update last seen
      participant = await prisma.participant.update({
        where: { id: participant.id },
        data: { lastSeenAt: new Date(), active: true }
      });
    } else {
      // Create new participant
      const code = await generateUniqueParticipantCode(id);

      participant = await prisma.participant.create({
        data: {
          tastingId: id,
          userId: user.id,
          code,
          // Legacy column from cookie sessions; no longer used as a credential
          rejoinToken: randomUUID()
        }
      });
    }

    return NextResponse.json({
      participantId: participant.id,
      userId: user.id,
      code: participant.code,
      isLeader: isLeaderOrAdmin(user),
      user: {
        id: user.id,
        name: user.name,
        isLeader: isLeaderOrAdmin(user)
      }
    });

  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Error joining tasting:', error);
    return NextResponse.json(
      { error: 'Failed to join tasting' },
      { status: 500 }
    );
  }
}
