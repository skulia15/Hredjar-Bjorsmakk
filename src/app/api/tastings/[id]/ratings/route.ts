import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ratingSchema, validateInput } from '@/lib/validation';

// POST /api/tastings/[id]/ratings - Submit or update rating
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = validateInput(ratingSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { beerId, participantId, score } = validation.data;
    const tastingBeerId = beerId; // Accept beerId for backwards compatibility

    // Verify tasting beer exists and is not untasted
    const tastingBeer = await prisma.tastingBeer.findUnique({
      where: { id: tastingBeerId }
    });

    if (!tastingBeer) {
      return NextResponse.json(
        { error: 'Beer not found' },
        { status: 404 }
      );
    }

    if (tastingBeer.status === 'untasted') {
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
        tastingBeerId_participantId: {
          tastingBeerId,
          participantId
        }
      },
      update: {
        score,
        updatedAt: new Date()
      },
      create: {
        tastingId: id,
        tastingBeerId,
        participantId,
        score
      }
    });

    return NextResponse.json({
      id: rating.id,
      beerId: rating.tastingBeerId, // Return as beerId for backwards compatibility
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
