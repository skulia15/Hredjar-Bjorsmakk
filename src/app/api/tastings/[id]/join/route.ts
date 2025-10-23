import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { joinTastingSchema, validateInput } from '@/lib/validation';
import { getOrCreateUser, generateUniqueParticipantCode } from '@/lib/auth';
import { createParticipantSession } from '@/lib/session';
import { randomUUID } from 'crypto';

// POST /api/tastings/[id]/join - Join tasting as participant
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validation = validateInput(joinTastingSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { name } = validation.data;

    // Verify tasting exists
    const tasting = await prisma.tasting.findUnique({
      where: { id: params.id }
    });

    if (!tasting) {
      return NextResponse.json(
        { error: 'Tasting not found' },
        { status: 404 }
      );
    }

    // Get or create user
    const user = await getOrCreateUser(name);

    // Check if user already has a participant record for this tasting
    let participant = await prisma.participant.findUnique({
      where: {
        tastingId_userId: {
          tastingId: params.id,
          userId: user.id
        }
      }
    });

    if (participant) {
      // User already joined - update last seen and return existing participant
      participant = await prisma.participant.update({
        where: { id: participant.id },
        data: { lastSeenAt: new Date() }
      });
    } else {
      // Create new participant
      const code = await generateUniqueParticipantCode(params.id);
      const rejoinToken = randomUUID();

      participant = await prisma.participant.create({
        data: {
          tastingId: params.id,
          userId: user.id,
          code,
          rejoinToken
        }
      });
    }

    // Set session cookie
    await createParticipantSession(participant.rejoinToken);

    return NextResponse.json({
      participantId: participant.id,
      userId: user.id,
      rejoinToken: participant.rejoinToken,
      code: participant.code,
      isLeader: user.isLeader,
      user: {
        id: user.id,
        name: user.name,
        isLeader: user.isLeader
      }
    });

  } catch (error) {
    console.error('Error joining tasting:', error);
    return NextResponse.json(
      { error: 'Failed to join tasting' },
      { status: 500 }
    );
  }
}
