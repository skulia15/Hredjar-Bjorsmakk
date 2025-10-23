import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { finishBeerSchema, validateInput } from '@/lib/validation';
import { requireLeader } from '@/lib/auth';
import { broadcastBeerFinished } from '@/lib/sse';

// POST /api/tastings/[id]/beers/[beerId]/finish - Mark beer as finished
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; beerId: string } }
) {
  try {
    const body = await request.json();
    const validation = validateInput(finishBeerSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { userName } = validation.data;

    // Verify user is leader
    await requireLeader(userName);

    // Verify beer is current
    const tastingBeer = await prisma.tastingBeer.findUnique({
      where: { id: params.beerId }
    });

    if (!tastingBeer) {
      return NextResponse.json(
        { error: 'Beer not found' },
        { status: 404 }
      );
    }

    if (tastingBeer.status !== 'current') {
      return NextResponse.json(
        { error: 'Only current beer can be finished' },
        { status: 400 }
      );
    }

    // Get ratings to calculate average
    const ratings = await prisma.rating.findMany({
      where: { tastingBeerId: params.beerId },
      select: { score: true }
    });

    const average = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
      : 0;

    // Transaction: Finish beer and update tasting
    const result = await prisma.$transaction(async (tx) => {
      // Mark beer as finished and record when it was finished
      await tx.tastingBeer.update({
        where: { id: params.beerId },
        data: {
          status: 'finished',
          finishedAt: new Date()
        }
      });

      // Clear current beer from tasting and increment version
      const tasting = await tx.tasting.update({
        where: { id: params.id },
        data: {
          currentTastingBeerId: null,
          version: { increment: 1 }
        }
      });

      return tasting;
    });

    // Broadcast finish via SSE
    broadcastBeerFinished(
      params.id,
      params.beerId,
      Number(average.toFixed(2)),
      ratings.length,
      result.version
    );

    return NextResponse.json({
      tastingBeerId: params.beerId,
      status: 'finished',
      average: Number(average.toFixed(2)),
      count: ratings.length,
      version: result.version
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Leader access required') {
      return NextResponse.json(
        { error: 'Leader access required' },
        { status: 403 }
      );
    }

    console.error('Error finishing beer:', error);
    return NextResponse.json(
      { error: 'Failed to finish beer' },
      { status: 500 }
    );
  }
}
