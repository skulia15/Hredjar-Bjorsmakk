import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { setCurrentBeerSchema, validateInput } from '@/lib/validation';
import { requireLeader } from '@/lib/auth';
import { broadcastCurrentBeerChanged } from '@/lib/sse';

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

    const { beerId, userName } = validation.data;
    const tastingBeerId = beerId; // Accept beerId for backwards compatibility

    // Verify user is leader
    await requireLeader(userName);

    // Verify tasting beer exists and is untasted
    const tastingBeer = await prisma.tastingBeer.findUnique({
      where: { id: tastingBeerId }
    });

    if (!tastingBeer) {
      return NextResponse.json(
        { error: 'Beer not found' },
        { status: 404 }
      );
    }

    if (tastingBeer.status !== 'untasted') {
      return NextResponse.json(
        { error: 'Beer must be untasted to set as current' },
        { status: 400 }
      );
    }

    // Transaction: Update old current beer and set new current beer
    const result = await prisma.$transaction(async (tx) => {
      // Find and update old current beer if exists
      const oldCurrent = await tx.tastingBeer.findFirst({
        where: {
          tastingId: id,
          status: 'current'
        }
      });

      if (oldCurrent) {
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

      return tasting;
    });

    // Broadcast change via SSE
    broadcastCurrentBeerChanged(id, tastingBeerId, result.version);

    return NextResponse.json({
      tastingId: id,
      currentBeerId: tastingBeerId, // Return as currentBeerId for backwards compatibility
      version: result.version
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Leader access required') {
      return NextResponse.json(
        { error: 'Leader access required' },
        { status: 403 }
      );
    }

    console.error('Error setting current beer:', error);
    return NextResponse.json(
      { error: 'Failed to set current beer' },
      { status: 500 }
    );
  }
}
