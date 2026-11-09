import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rankByAverage } from '@/lib/stats';

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
        styles: tb.beer?.styles || (tb.customStyle ? [tb.customStyle] : []),
        abv: tb.beer?.abv || tb.customAbv || null,
        containerSize: tb.beer?.containerSize || null,
        containerType: tb.beer?.containerType || null,
        imageUrl: tb.beer?.imageUrl || null,
        average: Number(average.toFixed(2)),
        count: ratings.length,
        status: tb.status,
        orderIndex: tb.orderIndex
      };
    });

    // A finished beer nobody rated has no score to rank; it'd show as 0.00 in last place
    const rated = beersWithScores.filter(beer => beer.count > 0);
    rated.sort((a, b) => b.average - a.average);
    const beersWithRanks = rankByAverage(rated);

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
