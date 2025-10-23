import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateTastingSchema, validateInput } from '@/lib/validation';
import { requireLeader } from '@/lib/auth';
import { getParticipantFromTasting } from '@/lib/session';
import { broadcastTastingClosed } from '@/lib/sse';

// GET /api/tastings/[id] - Get tasting details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tasting = await prisma.tasting.findUnique({
      where: { id },
      include: {
        tastingBeers: {
          include: {
            beer: true, // Include global beer if referenced
            _count: {
              select: { ratings: true }
            }
          },
          orderBy: { orderIndex: 'asc' }
        },
        _count: {
          select: { participants: true }
        }
      }
    });

    if (!tasting) {
      return NextResponse.json(
        { error: 'Tasting not found' },
        { status: 404 }
      );
    }

    // Check if current user is a leader
    const participant = await getParticipantFromTasting(id);
    const currentUserIsLeader = participant?.user?.isLeader ?? false;

    // Fetch all ratings for this tasting in one query (eliminates N+1 problem)
    const allRatings = await prisma.rating.findMany({
      where: { tastingId: id },
      select: {
        tastingBeerId: true,
        score: true
      }
    });

    // Group ratings by tastingBeerId for O(1) lookup
    const ratingsByBeerId = new Map<string, number[]>();
    allRatings.forEach(rating => {
      const existing = ratingsByBeerId.get(rating.tastingBeerId) || [];
      existing.push(rating.score);
      ratingsByBeerId.set(rating.tastingBeerId, existing);
    });

    // Calculate averages for each tasting beer (no more async queries!)
    const beersWithStats = tasting.tastingBeers.map((tastingBeer) => {
      const ratings = ratingsByBeerId.get(tastingBeer.id) || [];
      const average = ratings.length > 0
        ? ratings.reduce((sum, score) => sum + score, 0) / ratings.length
        : 0;

      // Get beer details from catalog or custom fields
      const name = tastingBeer.beer?.name || tastingBeer.customName || 'Unknown';
      const brewery = tastingBeer.beer?.brewery || tastingBeer.customBrewery || 'Unknown';
      const style = tastingBeer.beer?.style || tastingBeer.customStyle || null;
      const abv = tastingBeer.beer?.abv || tastingBeer.customAbv || null;
      const containerSize = tastingBeer.beer?.containerSize || null;
      const containerType = tastingBeer.beer?.containerType || null;
      const priceISK = tastingBeer.beer?.priceISK || null;

      return {
        id: tastingBeer.id,
        name,
        brewery,
        style,
        abv,
        containerSize,
        containerType,
        priceISK,
        status: tastingBeer.status,
        orderIndex: tastingBeer.orderIndex,
        createdAt: tastingBeer.createdAt,
        currentSince: tastingBeer.currentSince,
        finishedAt: tastingBeer.finishedAt,
        averageRating: Number(average.toFixed(2)),
        ratingCount: ratings.length
      };
    });

    return NextResponse.json({
      id: tasting.id,
      title: tasting.title,
      status: tasting.status,
      currentBeerId: tasting.currentTastingBeerId, // Map to old field name for backwards compatibility
      version: tasting.version,
      createdAt: tasting.createdAt,
      updatedAt: tasting.updatedAt,
      participantCount: tasting._count.participants,
      beers: beersWithStats, // Map tastingBeers to beers for backwards compatibility
      currentUserIsLeader
    });

  } catch (error) {
    console.error('Error fetching tasting:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasting' },
      { status: 500 }
    );
  }
}

// PATCH /api/tastings/[id] - Update tasting status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = validateInput(updateTastingSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { status, userName } = validation.data;

    // Verify user is leader
    await requireLeader(userName);

    // Update tasting
    const tasting = await prisma.tasting.update({
      where: { id },
      data: {
        status,
        version: { increment: 1 }
      }
    });

    // Broadcast if closed
    if (status === 'closed') {
      broadcastTastingClosed(id, tasting.version);
    }

    return NextResponse.json({
      id: tasting.id,
      status: tasting.status,
      version: tasting.version
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Leader access required') {
      return NextResponse.json(
        { error: 'Leader access required' },
        { status: 403 }
      );
    }

    console.error('Error updating tasting:', error);
    return NextResponse.json(
      { error: 'Failed to update tasting' },
      { status: 500 }
    );
  }
}
