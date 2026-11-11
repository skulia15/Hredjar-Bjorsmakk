import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { lockTasting } from '@/lib/tastingLock';
import { makeBeerCurrent } from '@/lib/currentBeer';
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
      return makeBeerCurrent(tx, id, tastingBeerId);
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      tastingId: id,
      currentBeerId: tastingBeerId, // Return as currentBeerId for backwards compatibility
      version: result.version
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
