import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/tastings/[id]/scores - Get scores page data
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
          where: {
            status: 'finished'
          },
          include: {
            beer: true,  // Include catalog beer if referenced
            ratings: {
              select: { score: true }
            }
          },
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    if (!tasting) {
      return NextResponse.json(
        { error: 'Tasting not found' },
        { status: 404 }
      );
    }

    // Calculate averages and sort by rating
    const beersWithScores = tasting.tastingBeers.map(tb => {
      const ratings = tb.ratings;
      const average = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
        : 0;

      return {
        beerId: tb.id,
        name: tb.beer?.name || tb.customName || 'Unknown',
        brewery: tb.beer?.brewery || tb.customBrewery || 'Unknown',
        style: tb.beer?.style || tb.customStyle || null,
        abv: tb.beer?.abv || tb.customAbv || null,
        average: Number(average.toFixed(2)),
        count: ratings.length,
        status: tb.status,
        orderIndex: tb.orderIndex
      };
    });

    // Sort by average descending
    beersWithScores.sort((a, b) => b.average - a.average);

    // Add ranks and medals
    const beersWithRanks = beersWithScores.map((beer, index) => {
      const rank = index + 1;
      let medal = null;

      if (rank === 1) medal = '🥇';
      else if (rank === 2) medal = '🥈';
      else if (rank === 3) medal = '🥉';

      return {
        ...beer,
        rank,
        medal
      };
    });

    return NextResponse.json({
      tastingId: tasting.id,
      title: tasting.title,
      status: tasting.status,
      beers: beersWithRanks
    });

  } catch (error) {
    console.error('Error fetching scores:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scores' },
      { status: 500 }
    );
  }
}
