import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ratingSchema, validateInput } from '@/lib/validation';
import { authErrorResponse, requireParticipant } from '@/lib/auth';
import { getHiddenTastingBeerId } from '@/lib/hiddenScores';

// GET /api/tastings/[id]/ratings?beerId=... - The signed-in participant's own rating and flavor tags for a beer.
// score is null when they've only tagged it so far; the whole thing is null when they've done neither
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
    const key = { tastingBeerId_participantId: { tastingBeerId, participantId: participant.id } };
    const [rating, flavorTags] = await Promise.all([
      prisma.rating.findUnique({
        where: key,
        select: { tastingId: true, score: true, note: true, groupGuess: true }
      }),
      prisma.flavorTags.findUnique({
        where: key,
        select: { tags: true, tastingBeer: { select: { tastingId: true } } }
      })
    ]);

    const ownRating = rating?.tastingId === id ? rating : null;
    const ownTags = flavorTags?.tastingBeer.tastingId === id ? flavorTags.tags : null;
    if (!ownRating && !ownTags) {
      return NextResponse.json(null);
    }
    return NextResponse.json({
      score: ownRating?.score ?? null,
      tags: ownTags ?? [],
      note: ownRating?.note ?? null,
      groupGuess: ownRating?.groupGuess ?? null
    });

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

    const { beerId, score, note, groupGuess: requestedGuess } = validation.data;
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

    // Guessing the group average only means something while it's hidden, so later guesses are dropped
    const guessOpen = (await getHiddenTastingBeerId(id)) === tastingBeerId;
    const groupGuess = guessOpen ? requestedGuess : undefined;

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
        ...(note !== undefined && { note }),
        ...(groupGuess !== undefined && { groupGuess }),
        updatedAt: new Date()
      },
      create: {
        tastingId: id,
        tastingBeerId,
        participantId: participant.id,
        score,
        note: note ?? null,
        groupGuess: groupGuess ?? null
      }
    });

    // Rating again means they're back
    if (participant.pausedAt) {
      await prisma.participant.update({ where: { id: participant.id }, data: { pausedAt: null } });
    }

    return NextResponse.json({
      id: rating.id,
      beerId: rating.tastingBeerId, // Return as beerId for backwards compatibility
      participantId: rating.participantId,
      score: rating.score,
      note: rating.note,
      groupGuess: rating.groupGuess,
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
