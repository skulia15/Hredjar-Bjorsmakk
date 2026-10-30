import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ratingSchema, validateInput } from '@/lib/validation';
import { authErrorResponse, requireParticipant } from '@/lib/auth';

// GET /api/tastings/[id]/ratings?beerId=... - The signed-in participant's own rating for a beer (null if none)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tastingBeerId = request.nextUrl.searchParams.get('beerId');
    if (!tastingBeerId) {
      return NextResponse.json({ error: 'beerId is required' }, { status: 400 });
    }

    const { participant } = await requireParticipant(id);
    const rating = await prisma.rating.findUnique({
      where: { tastingBeerId_participantId: { tastingBeerId, participantId: participant.id } },
      select: { tastingId: true, score: true, tags: true, note: true }
    });

    if (!rating || rating.tastingId !== id) {
      return NextResponse.json(null);
    }
    return NextResponse.json({ score: rating.score, tags: rating.tags, note: rating.note });

  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Error fetching rating:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rating' },
      { status: 500 }
    );
  }
}

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

    const { beerId, score, tags, note } = validation.data;
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
        ...(tags !== undefined && { tags }),
        ...(note !== undefined && { note }),
        updatedAt: new Date()
      },
      create: {
        tastingId: id,
        tastingBeerId,
        participantId: participant.id,
        score,
        tags: tags ?? [],
        note: note ?? null
      }
    });

    return NextResponse.json({
      id: rating.id,
      beerId: rating.tastingBeerId, // Return as beerId for backwards compatibility
      participantId: rating.participantId,
      score: rating.score,
      tags: rating.tags,
      note: rating.note,
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
