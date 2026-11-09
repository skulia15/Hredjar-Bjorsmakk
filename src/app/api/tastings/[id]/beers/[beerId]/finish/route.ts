import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { lockTasting } from '@/lib/tastingLock';
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

    // Under the tasting's lock, so a beer someone else just switched to can't be wiped as current
    const result = await prisma.$transaction(async (tx) => {
      await lockTasting(tx, id);

      const tastingBeer = await tx.tastingBeer.findUnique({
        where: { id: beerId }
      });
      if (!tastingBeer || tastingBeer.tastingId !== id) {
        return { error: 'Beer not found', status: 404 } as const;
      }
      if (tastingBeer.status !== 'current') {
        return { error: 'Only current beer can be finished', status: 400 } as const;
      }

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

      const ratings = await tx.rating.findMany({
        where: { tastingBeerId: beerId },
        select: { score: true }
      });

      return { tasting, ratings };
    });

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { ratings } = result;
    const average = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
      : 0;

    return NextResponse.json({
      tastingBeerId: beerId,
      status: 'finished',
      average: Number(average.toFixed(2)),
      count: ratings.length,
      version: result.tasting.version
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
