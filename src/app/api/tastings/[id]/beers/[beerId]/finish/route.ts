import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authErrorResponse, requireLeader } from '@/lib/auth';

// POST /api/tastings/[id]/beers/[beerId]/finish - Mark beer as finished
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; beerId: string }> }
) {
  try {
    const { id, beerId } = await params;

    // Verify user is leader
    await requireLeader();

    // Verify beer is current
    const tastingBeer = await prisma.tastingBeer.findUnique({
      where: { id: beerId }
    });

    if (!tastingBeer || tastingBeer.tastingId !== id) {
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
      where: { tastingBeerId: beerId },
      select: { score: true }
    });

    const average = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
      : 0;

    // Transaction: Finish beer and update tasting
    const result = await prisma.$transaction(async (tx) => {
      // Mark beer as finished and record when it was finished
      await tx.tastingBeer.update({
        where: { id: beerId },
        data: {
          status: 'finished',
          finishedAt: new Date()
        }
      });

      // Clear current beer from tasting and increment version
      const tasting = await tx.tasting.update({
        where: { id },
        data: {
          currentTastingBeerId: null,
          version: { increment: 1 }
        }
      });

      return tasting;
    });

    return NextResponse.json({
      tastingBeerId: beerId,
      status: 'finished',
      average: Number(average.toFixed(2)),
      count: ratings.length,
      version: result.version
    });

  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Error finishing beer:', error);
    return NextResponse.json(
      { error: 'Failed to finish beer' },
      { status: 500 }
    );
  }
}
