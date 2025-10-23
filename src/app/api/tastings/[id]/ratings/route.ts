import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ratingSchema, validateInput } from '@/lib/validation';
import { broadcastVersionUpdate } from '@/lib/sse';

// POST /api/tastings/[id]/ratings - Submit or update rating
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validation = validateInput(ratingSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { beerId, participantId, score } = validation.data;

    // Verify beer exists and is not untasted
    const beer = await prisma.beer.findUnique({
      where: { id: beerId }
    });

    if (!beer) {
      return NextResponse.json(
        { error: 'Beer not found' },
        { status: 404 }
      );
    }

    if (beer.status === 'untasted') {
      return NextResponse.json(
        { error: 'Cannot rate untasted beer' },
        { status: 400 }
      );
    }

    // Verify participant exists
    const participant = await prisma.participant.findUnique({
      where: { id: participantId }
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }

    // Upsert rating (create or update)
    const rating = await prisma.rating.upsert({
      where: {
        beerId_participantId: {
          beerId,
          participantId
        }
      },
      update: {
        score,
        updatedAt: new Date()
      },
      create: {
        tastingId: params.id,
        beerId,
        participantId,
        score
      }
    });

    // Broadcast update via SSE (don't increment version for ratings)
    broadcastVersionUpdate(params.id, 0); // Version 0 = just scores updated

    return NextResponse.json({
      id: rating.id,
      beerId: rating.beerId,
      participantId: rating.participantId,
      score: rating.score,
      createdAt: rating.createdAt,
      updatedAt: rating.updatedAt
    });

  } catch (error) {
    console.error('Error submitting rating:', error);
    return NextResponse.json(
      { error: 'Failed to submit rating' },
      { status: 500 }
    );
  }
}
