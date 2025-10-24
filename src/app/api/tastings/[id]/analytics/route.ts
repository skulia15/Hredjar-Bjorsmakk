import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/tastings/[id]/analytics
 * Get analytics and statistics for a tasting
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch tasting with all related data
    const tasting = await prisma.tasting.findUnique({
      where: { id },
      include: {
        tastingBeers: {
          include: {
            beer: true,
            ratings: {
              include: {
                participant: {
                  include: { user: true }
                }
              }
            }
          }
        },
        participants: {
          where: { active: true },  // Only include active participants
          include: { user: true }
        }
      }
    });

    if (!tasting) {
      return NextResponse.json(
        { error: 'Tasting not found' },
        { status: 404 }
      );
    }

    // Calculate statistics
    const totalParticipants = tasting.participants.length;
    const totalBeers = tasting.tastingBeers.length;
    const finishedBeers = tasting.tastingBeers.filter(b => b.status === 'finished');

    // Rating distribution (0.5-10.0 in 0.5 increments)
    const ratingDistribution: Record<string, number> = {};
    for (let i = 1.0; i <= 10.0; i += 0.5) {
      ratingDistribution[i.toFixed(1)] = 0;
    }

    let totalRatings = 0;
    let sumAllRatings = 0;

    tasting.tastingBeers.forEach(beer => {
      beer.ratings.forEach(rating => {
        const scoreKey = rating.score.toFixed(1);
        ratingDistribution[scoreKey] = (ratingDistribution[scoreKey] || 0) + 1;
        totalRatings++;
        sumAllRatings += rating.score;
      });
    });

    const overallAverage = totalRatings > 0 ? sumAllRatings / totalRatings : 0;

    // Calculate average time per beer (for finished beers with timer data)
    const beerTimings = finishedBeers
      .filter(beer => beer.currentSince && beer.finishedAt)
      .map(beer => {
        const start = new Date(beer.currentSince!).getTime();
        const end = new Date(beer.finishedAt!).getTime();
        const durationMinutes = (end - start) / 1000 / 60;

        return {
          beerId: beer.id,
          name: beer.beer?.name || beer.customName || 'Unknown',
          durationMinutes: Math.round(durationMinutes * 10) / 10
        };
      });

    const averageTimePerBeer = beerTimings.length > 0
      ? beerTimings.reduce((sum, b) => sum + b.durationMinutes, 0) / beerTimings.length
      : null;

    // Calculate participation rate per beer
    const beerParticipation = tasting.tastingBeers.map(beer => {
      const ratingsCount = beer.ratings.length;
      const participationRate = totalParticipants > 0
        ? (ratingsCount / totalParticipants) * 100
        : 0;

      const name = beer.beer?.name || beer.customName || 'Unknown';
      const brewery = beer.beer?.brewery || beer.customBrewery || 'Unknown';

      return {
        beerId: beer.id,
        name,
        brewery,
        status: beer.status,
        ratingsCount,
        totalParticipants,
        participationRate: Math.round(participationRate * 10) / 10
      };
    });

    // Top rated beers
    const topRatedBeers = tasting.tastingBeers
      .map(beer => {
        const ratings = beer.ratings.map(r => r.score);
        const average = ratings.length > 0
          ? ratings.reduce((sum, score) => sum + score, 0) / ratings.length
          : 0;

        const name = beer.beer?.name || beer.customName || 'Unknown';
        const brewery = beer.beer?.brewery || beer.customBrewery || 'Unknown';

        return {
          beerId: beer.id,
          name,
          brewery,
          average: Number(average.toFixed(2)),
          ratingsCount: ratings.length,
          status: beer.status
        };
      })
      .filter(beer => beer.ratingsCount > 0)
      .sort((a, b) => b.average - a.average)
      .slice(0, 10);

    // Enhanced participant statistics with per-user details
    const participantStats = tasting.participants.map(p => {
      // Get all ratings from this participant
      const userRatings = tasting.tastingBeers.flatMap(beer =>
        beer.ratings.filter(r => r.participantId === p.id).map(rating => ({
          score: rating.score,
          beerId: beer.id,
          beerName: beer.beer?.name || beer.customName || 'Unknown',
          brewery: beer.beer?.brewery || beer.customBrewery || 'Unknown',
          style: beer.beer?.style || beer.customStyle || null,
        }))
      );

      const ratingsCount = userRatings.length;
      const possibleRatings = finishedBeers.length + (tasting.currentTastingBeerId ? 1 : 0);
      const engagementRate = possibleRatings > 0
        ? (ratingsCount / possibleRatings) * 100
        : 0;

      // Calculate average rating for this user
      const userAverage = ratingsCount > 0
        ? userRatings.reduce((sum, r) => sum + r.score, 0) / ratingsCount
        : 0;

      // Find user's top 3 beers (highest rated)
      const topBeers = ratingsCount > 0
        ? userRatings
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map(rating => ({
              beerId: rating.beerId,
              name: rating.beerName,
              brewery: rating.brewery,
              score: Number(rating.score.toFixed(2))
            }))
        : [];

      // Calculate favorite style (style with highest average rating)
      const styleRatings = userRatings
        .filter(r => r.style)
        .reduce((acc, r) => {
          if (!acc[r.style!]) {
            acc[r.style!] = { scores: [], count: 0 };
          }
          acc[r.style!].scores.push(r.score);
          acc[r.style!].count++;
          return acc;
        }, {} as Record<string, { scores: number[], count: number }>);

      const favoriteStyle = Object.entries(styleRatings)
        .map(([style, data]) => ({
          style,
          average: data.scores.reduce((sum, s) => sum + s, 0) / data.count,
          count: data.count
        }))
        .sort((a, b) => b.average - a.average)[0] || null;

      // Calculate rating variance (standard deviation)
      const variance = ratingsCount > 1
        ? userRatings.reduce((sum, r) => sum + Math.pow(r.score - userAverage, 2), 0) / ratingsCount
        : 0;
      const stdDev = Math.sqrt(variance);

      return {
        participantId: p.id,
        userName: p.user?.name || `Notandi ${p.code}`,
        code: p.code,
        ratingsCount,
        possibleRatings,
        engagementRate: Math.round(engagementRate * 10) / 10,
        averageRating: Number(userAverage.toFixed(2)),
        topBeers,
        favoriteStyle: favoriteStyle ? {
          style: favoriteStyle.style,
          average: Number(favoriteStyle.average.toFixed(2)),
          count: favoriteStyle.count
        } : null,
        ratingVariance: Number(stdDev.toFixed(2))
      };
    }).sort((a, b) => b.ratingsCount - a.ratingsCount);

    return NextResponse.json({
      overview: {
        tastingId: tasting.id,
        title: tasting.title,
        status: tasting.status,
        totalParticipants,
        totalBeers,
        finishedBeers: finishedBeers.length,
        totalRatings,
        overallAverage: Number(overallAverage.toFixed(2)),
        averageTimePerBeer: averageTimePerBeer ? Math.round(averageTimePerBeer * 10) / 10 : null
      },
      ratingDistribution,
      beerTimings,
      beerParticipation,
      topRatedBeers,
      participantStats
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
