import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/tastings/[id]/scores - Get scores page data
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tasting = await prisma.tasting.findUnique({
      where: { id: params.id },
      include: {
        beers: {
          where: {
            status: 'finished'
          },
          include: {
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
    const beersWithScores = tasting.beers.map(beer => {
      const ratings = beer.ratings;
      const average = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
        : 0;

      return {
        beerId: beer.id,
        name: beer.name,
        brewery: beer.brewery,
        style: beer.style,
        abv: beer.abv,
        average: Number(average.toFixed(2)),
        count: ratings.length,
        status: beer.status,
        orderIndex: beer.orderIndex
      };
    });

    // Sort by average descending
    beersWithScores.sort((a, b) => b.average - a.average);

    // Add ranks
    const beersWithRanks = beersWithScores.map((beer, index) => ({
      ...beer,
      rank: index + 1
    }));

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
