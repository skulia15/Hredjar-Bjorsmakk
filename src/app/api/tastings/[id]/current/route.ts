import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { lockTasting } from '@/lib/tastingLock';
import { setCurrentBeerSchema, validateInput } from '@/lib/validation';
import { authErrorResponse, requireLeader } from '@/lib/auth';

// PATCH /api/tastings/[id]/current - Set current beer
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await request.json();
    const validation = validateInput(setCurrentBeerSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { beerId } = validation.data;
    const tastingBeerId = beerId; // Accept beerId for backwards compatibility

    // Verify user is leader
    await requireLeader();

    // Checked under the tasting's lock, so two leaders (or tabs) switching at once can't
    // both see the same old current beer and leave two beers current
    const result = await prisma.$transaction(async (tx) => {
      await lockTasting(tx, id);

      const tastingBeer = await tx.tastingBeer.findUnique({
        where: { id: tastingBeerId }
      });
      if (!tastingBeer || tastingBeer.tastingId !== id) {
        return { error: 'Beer not found', status: 404 } as const;
      }
      if (tastingBeer.status !== 'untasted') {
        return { error: 'Beer must be untasted to set as current', status: 400 } as const;
      }

      const oldCurrent = await tx.tastingBeer.findFirst({
        where: { tastingId: id, status: 'current' },
        include: { _count: { select: { ratings: true } } }
      });

      if (oldCurrent) {
        // Back to untasted would leak its scores (no longer the hidden beer) and lock out anyone
        // who hadn't rated it yet, so a beer people have rated has to be finished instead
        if (oldCurrent._count.ratings > 0) {
          return { error: 'Ljúktu núverandi bjór fyrst, það er búið að gefa honum einkunn', status: 409 } as const;
        }
        await tx.tastingBeer.update({
          where: { id: oldCurrent.id },
          data: { status: 'untasted' }
        });
      }

      // Set new current beer and record when it became current
      await tx.tastingBeer.update({
        where: { id: tastingBeerId },
        data: {
          status: 'current',
          currentSince: new Date()
        }
      });

      // Update tasting with new current beer and increment version
      const tasting = await tx.tasting.update({
        where: { id },
        data: {
          currentTastingBeerId: tastingBeerId,
          version: { increment: 1 }
        }
      });

      return { tasting };
    });

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      tastingId: id,
      currentBeerId: tastingBeerId, // Return as currentBeerId for backwards compatibility
      version: result.tasting.version
    });

  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Error setting current beer:', error);
    return NextResponse.json(
      { error: 'Failed to set current beer' },
      { status: 500 }
    );
  }
}
