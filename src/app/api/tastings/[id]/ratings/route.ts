import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ratingSchema, validateInput } from '@/lib/validation';
import { authErrorResponse, requireParticipant } from '@/lib/auth';

// POST /api/tastings/[id]/ratings - Submit or update the signed-in participant's rating
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

    const { beerId, score } = validation.data;
    const tastingBeerId = beerId; // Accept beerId for backwards compatibility

    // The rater is always the signed-in user's participation; any participantId in the body is ignored
    const { participant } = await requireParticipant(id);

    // Verify tasting beer belongs to this tasting and is not untasted
    const tastingBeer = await prisma.tastingBeer.findUnique({
      where: { id: tastingBeerId }
    });

    if (!tastingBeer || tastingBeer.tastingId !== id) {
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

    // Upsert rating (create or update)
    const rating = await prisma.rating.upsert({
      where: {
        tastingBeerId_participantId: {
          tastingBeerId,
          participantId: participant.id
        }
      },
      update: {
        score,
        updatedAt: new Date()
      },
      create: {
        tastingId: id,
        tastingBeerId,
        participantId: participant.id,
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
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Error submitting rating:', error);
    return NextResponse.json(
      { error: 'Failed to submit rating' },
      { status: 500 }
    );
  }
}
