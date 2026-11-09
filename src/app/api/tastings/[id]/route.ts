import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateTastingSchema, validateInput } from '@/lib/validation';
import { authErrorResponse, getCurrentUser, isLeaderOrAdmin, requireLeader } from '@/lib/auth';
import { getHiddenTastingBeerId } from '@/lib/hiddenScores';
import { lockTasting } from '@/lib/tastingLock';

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
        // For the projector lobby
        participants: {
          where: { active: true },
          select: { id: true, code: true, avatar: true, user: { select: { name: true, imageUrl: true } } },
          orderBy: { createdAt: 'asc' }
        },
        _count: {
          select: {
            participants: {
              where: { active: true }  // Only count active participants
            }
          }
        }
      }
    });

    if (!tasting) {
      return NextResponse.json(
        { error: 'Tasting not found' },
        { status: 404 }
      );
    }

    // Public read (projector screens); the leader flag only drives UI, the mutations re-check
    const currentUser = await getCurrentUser();
    const currentUserIsLeader = currentUser ? isLeaderOrAdmin(currentUser) : false;

    const hiddenTastingBeerId = await getHiddenTastingBeerId(id);

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
      const styles = tastingBeer.beer?.styles || (tastingBeer.customStyle ? [tastingBeer.customStyle] : []);
      const abv = tastingBeer.beer?.abv || tastingBeer.customAbv || null;
      const country = tastingBeer.beer?.country || null;
      const containerSize = tastingBeer.beer?.containerSize || null;
      const containerType = tastingBeer.beer?.containerType || null;
      const priceISK = tastingBeer.priceISK ?? tastingBeer.beer?.priceISK ?? null;
      const imageUrl = tastingBeer.beer?.imageUrl || null;
      const scoresHidden = tastingBeer.id === hiddenTastingBeerId;

      return {
        id: tastingBeer.id,
        name,
        brewery,
        styles,
        abv,
        country,
        containerSize,
        containerType,
        priceISK,
        imageUrl,
        status: tastingBeer.status,
        orderIndex: tastingBeer.orderIndex,
        createdAt: tastingBeer.createdAt,
        currentSince: tastingBeer.currentSince,
        finishedAt: tastingBeer.finishedAt,
        averageRating: scoresHidden ? null : Number(average.toFixed(2)),
        ratingCount: ratings.length,
        scoresHidden
      };
    });

    return NextResponse.json({
      id: tasting.id,
      title: tasting.title,
      status: tasting.status,
      currentBeerId: tasting.currentTastingBeerId, // Map to old field name for backwards compatibility
      version: tasting.version,
      hideScoresUntilAllRated: tasting.hideScoresUntilAllRated,
      createdAt: tasting.createdAt,
      updatedAt: tasting.updatedAt,
      participantCount: tasting._count.participants,
      participants: tasting.participants.map(p => ({
        id: p.id,
        name: p.user?.name || `Notandi ${p.code}`,
        avatar: p.avatar,
        imageUrl: p.user?.imageUrl ?? null
      })),
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

// PATCH /api/tastings/[id] - Update tasting status and settings
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

    const { status, hideScoresUntilAllRated } = validation.data;

    // Verify user is leader
    await requireLeader();

    const tasting = await prisma.$transaction(async (tx) => {
      await lockTasting(tx, id);
      // Closing with a beer still on finishes it, or it'd drop out of the results (they only show finished beers)
      if (status === 'closed') {
        await tx.tastingBeer.updateMany({
          where: { tastingId: id, status: 'current' },
          data: { status: 'finished', finishedAt: new Date() }
        });
      }

      return tx.tasting.update({
        where: { id },
        data: {
          status,
          hideScoresUntilAllRated,
          ...(status === 'closed' && { currentTastingBeerId: null }),
          version: { increment: 1 }
        }
      });
    });

    return NextResponse.json({
      id: tasting.id,
      status: tasting.status,
      hideScoresUntilAllRated: tasting.hideScoresUntilAllRated,
      version: tasting.version
    });

  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Error updating tasting:', error);
    return NextResponse.json(
      { error: 'Failed to update tasting' },
      { status: 500 }
    );
  }
}
