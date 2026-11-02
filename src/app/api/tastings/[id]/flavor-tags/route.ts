import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { flavorTagsSchema, validateInput } from '@/lib/validation';
import { authErrorResponse, requireParticipant } from '@/lib/auth';

// PUT /api/tastings/[id]/flavor-tags - Replace the signed-in participant's flavor tags for a beer.
// Sent on every tap, apart from the rating, so picking tags never submits a score
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = validateInput(flavorTagsSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { beerId: tastingBeerId, tags } = validation.data;

    // The tagger is always the signed-in user's participation
    const { participant } = await requireParticipant(id);

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
        { error: 'Cannot tag untasted beer' },
        { status: 400 }
      );
    }

    const saved = await prisma.flavorTags.upsert({
      where: { tastingBeerId_participantId: { tastingBeerId, participantId: participant.id } },
      update: { tags },
      create: { tastingBeerId, participantId: participant.id, tags }
    });

    return NextResponse.json({ beerId: saved.tastingBeerId, tags: saved.tags });

  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Error saving flavor tags:', error);
    return NextResponse.json(
      { error: 'Failed to save flavor tags' },
      { status: 500 }
    );
  }
}
