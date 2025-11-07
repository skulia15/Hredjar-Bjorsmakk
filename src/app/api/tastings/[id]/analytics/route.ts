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

    // Calculate style distribution and average ratings per style
    const styleStats: Record<string, { count: number; totalRating: number; ratings: number[] }> = {};

    tasting.tastingBeers
      .filter(beer => beer.status === 'finished')
      .forEach(beer => {
        const styles = beer.beer?.styles || (beer.customStyle ? [beer.customStyle] : []);
        const beerRatings = beer.ratings.map(r => r.score);

        styles.forEach(style => {
          if (!styleStats[style]) {
            styleStats[style] = { count: 0, totalRating: 0, ratings: [] };
          }
          styleStats[style].count++;
          styleStats[style].ratings.push(...beerRatings);
          styleStats[style].totalRating += beerRatings.reduce((sum, r) => sum + r, 0);
        });
      });

    const styleDistribution = Object.entries(styleStats)
      .map(([style, data]) => ({
        style,
        count: data.count,
        averageRating: data.ratings.length > 0
          ? Number((data.totalRating / data.ratings.length).toFixed(2))
          : 0,
        totalRatings: data.ratings.length
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate rating trend over time (chronologically ordered beers with their average ratings)
    const ratingTrend = tasting.tastingBeers
      .filter(beer => beer.status === 'finished')  // Only finished beers
      .sort((a, b) => {
        // Sort by finishedAt timestamp (chronological order)
        const timeA = a.finishedAt ? new Date(a.finishedAt).getTime() : 0;
        const timeB = b.finishedAt ? new Date(b.finishedAt).getTime() : 0;
        return timeA - timeB;
      })
      .map((beer, index) => {
        const ratings = beer.ratings.map(r => r.score);
        const average = ratings.length > 0
          ? ratings.reduce((sum, score) => sum + score, 0) / ratings.length
          : 0;

        const name = beer.beer?.name || beer.customName || 'Unknown';

        return {
          beerIndex: index + 1,  // 1-indexed for display (Beer 1, Beer 2, etc.)
          beerId: beer.id,
          name,
          average: Number(average.toFixed(2)),
          ratingsCount: ratings.length
        };
      });

    // Calculate beer controversy (standard deviation of ratings per beer)
    const beerControversy = tasting.tastingBeers
      .filter(beer => beer.status === 'finished' && beer.ratings.length > 1)
      .map(beer => {
        const ratings = beer.ratings.map(r => r.score);
        const average = ratings.reduce((sum, score) => sum + score, 0) / ratings.length;
        const variance = ratings.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / ratings.length;
        const stdDev = Math.sqrt(variance);

        const name = beer.beer?.name || beer.customName || 'Unknown';
        const brewery = beer.beer?.brewery || beer.customBrewery || 'Unknown';

        return {
          beerId: beer.id,
          name,
          brewery,
          average: Number(average.toFixed(2)),
          standardDeviation: Number(stdDev.toFixed(2)),
          ratingsCount: ratings.length,
          controversy: stdDev > 2 ? 'High' : stdDev > 1 ? 'Medium' : 'Low'
        };
      })
      .sort((a, b) => b.standardDeviation - a.standardDeviation);

    // Calculate ABV vs Rating correlation
    const abvVsRating = tasting.tastingBeers
      .filter(beer => beer.status === 'finished' && beer.ratings.length > 0)
      .map(beer => {
        const abv = beer.beer?.abv || beer.customAbv;
        if (!abv) return null;

        const ratings = beer.ratings.map(r => r.score);
        const average = ratings.reduce((sum, score) => sum + score, 0) / ratings.length;
        const name = beer.beer?.name || beer.customName || 'Unknown';

        return {
          beerId: beer.id,
          name,
          abv,
          averageRating: Number(average.toFixed(2)),
          ratingsCount: ratings.length
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.abv - b.abv);

    // Calculate rating velocity (time to collect all ratings per beer)
    const ratingVelocity = tasting.tastingBeers
      .filter(beer => beer.status === 'finished' && beer.currentSince && beer.ratings.length > 0)
      .map(beer => {
        const startTime = new Date(beer.currentSince!).getTime();

        // Find the time of the last rating for this beer
        const ratingTimes = beer.ratings.map(r => new Date(r.createdAt).getTime());
        const lastRatingTime = Math.max(...ratingTimes);

        const durationMinutes = (lastRatingTime - startTime) / 1000 / 60;
        const name = beer.beer?.name || beer.customName || 'Unknown';

        return {
          beerId: beer.id,
          name,
          durationMinutes: Math.round(durationMinutes * 10) / 10,
          ratingsCount: beer.ratings.length,
          ratingsPerMinute: Number((beer.ratings.length / durationMinutes).toFixed(2))
        };
      })
      .sort((a, b) => a.durationMinutes - b.durationMinutes);

    // Calculate participant deviation from group average
    const participantDeviation = tasting.participants.map(p => {
      const userRatings = tasting.tastingBeers.flatMap(beer =>
        beer.ratings.filter(r => r.participantId === p.id).map(r => r.score)
      );

      if (userRatings.length === 0) return null;

      const userAverage = userRatings.reduce((sum, score) => sum + score, 0) / userRatings.length;
      const deviation = userAverage - overallAverage;

      return {
        participantId: p.id,
        userName: p.user?.name || `Notandi ${p.code}`,
        userAverage: Number(userAverage.toFixed(2)),
        groupAverage: Number(overallAverage.toFixed(2)),
        deviation: Number(deviation.toFixed(2)),
        ratingsCount: userRatings.length
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => b.deviation - a.deviation);

    // Calculate rating consensus per beer (for radar chart)
    const ratingConsensus = tasting.tastingBeers
      .filter(beer => beer.status === 'finished' && beer.ratings.length > 1)
      .map(beer => {
        const ratings = beer.ratings.map(r => r.score);
        const average = ratings.reduce((sum, score) => sum + score, 0) / ratings.length;
        const variance = ratings.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / ratings.length;
        const stdDev = Math.sqrt(variance);

        // Consensus score: inverse of standard deviation (higher = more consensus)
        // Normalize to 0-10 scale
        const consensusScore = Math.max(0, 10 - (stdDev * 2));

        const name = beer.beer?.name || beer.customName || 'Unknown';

        return {
          beerId: beer.id,
          name: name.length > 20 ? name.substring(0, 20) + '...' : name,
          fullName: name,
          consensus: Number(consensusScore.toFixed(2)),
          standardDeviation: Number(stdDev.toFixed(2)),
          averageRating: Number(average.toFixed(2))
        };
      });

    // Enhanced participant statistics with per-user details
    const participantStats = tasting.participants.map(p => {
      // Get all ratings from this participant
      const userRatings = tasting.tastingBeers.flatMap(beer =>
        beer.ratings.filter(r => r.participantId === p.id).map(rating => ({
          score: rating.score,
          beerId: beer.id,
          beerName: beer.beer?.name || beer.customName || 'Unknown',
          brewery: beer.beer?.brewery || beer.customBrewery || 'Unknown',
          styles: beer.beer?.styles || (beer.customStyle ? [beer.customStyle] : []),
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
        .flatMap(r => r.styles.map(style => ({ style, score: r.score })))
        .reduce((acc, { style, score }) => {
          if (!acc[style]) {
            acc[style] = { scores: [], count: 0 };
          }
          acc[style].scores.push(score);
          acc[style].count++;
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

    // 1. Style Performance Ranking - which styles got highest/lowest average ratings
    const stylePerformanceRanking = Object.entries(styleStats)
      .map(([style, data]) => {
        const average = data.ratings.length > 0
          ? data.totalRating / data.ratings.length
          : 0;

        // Calculate standard deviation for this style
        const variance = data.ratings.length > 1
          ? data.ratings.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / data.ratings.length
          : 0;
        const stdDev = Math.sqrt(variance);

        return {
          style,
          beersCount: data.count,
          ratingsCount: data.ratings.length,
          averageRating: Number(average.toFixed(2)),
          standardDeviation: Number(stdDev.toFixed(2)),
          minRating: data.ratings.length > 0 ? Math.min(...data.ratings) : 0,
          maxRating: data.ratings.length > 0 ? Math.max(...data.ratings) : 0
        };
      })
      .filter(s => s.beersCount > 0)
      .sort((a, b) => b.averageRating - a.averageRating);

    // 2. Style Rating Spread - which styles had most/least agreement
    const styleRatingSpread = stylePerformanceRanking
      .map(style => ({
        style: style.style,
        beersCount: style.beersCount,
        ratingsCount: style.ratingsCount,
        standardDeviation: style.standardDeviation,
        agreement: style.standardDeviation < 1 ? 'High' : style.standardDeviation < 2 ? 'Medium' : 'Low'
      }))
      .sort((a, b) => a.standardDeviation - b.standardDeviation);

    // 3. Rating Distribution per Style - for box plot visualization
    const styleRatingDistribution = Object.entries(styleStats)
      .map(([style, data]) => {
        if (data.ratings.length === 0) return null;

        const sorted = [...data.ratings].sort((a, b) => a - b);
        const average = data.totalRating / data.ratings.length;

        const q1Index = Math.floor(sorted.length * 0.25);
        const q2Index = Math.floor(sorted.length * 0.5);
        const q3Index = Math.floor(sorted.length * 0.75);

        return {
          style,
          beersCount: data.count,
          ratingsCount: data.ratings.length,
          min: sorted[0],
          q1: sorted[q1Index],
          median: sorted[q2Index],
          q3: sorted[q3Index],
          max: sorted[sorted.length - 1],
          average: Number(average.toFixed(2))
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.average - a.average);

    // 4. Participant Style Preferences - each person's favorite/least favorite styles
    const participantStylePreferences = tasting.participants.map(p => {
      const userRatings = tasting.tastingBeers.flatMap(beer =>
        beer.ratings
          .filter(r => r.participantId === p.id)
          .map(rating => ({
            score: rating.score,
            styles: beer.beer?.styles || (beer.customStyle ? [beer.customStyle] : [])
          }))
      );

      // Group ratings by style
      const styleRatings = userRatings
        .flatMap(r => r.styles.map(style => ({ style, score: r.score })))
        .reduce((acc, { style, score }) => {
          if (!acc[style]) {
            acc[style] = { scores: [], count: 0 };
          }
          acc[style].scores.push(score);
          acc[style].count++;
          return acc;
        }, {} as Record<string, { scores: number[], count: number }>);

      const styleAverages = Object.entries(styleRatings)
        .map(([style, data]) => ({
          style,
          average: data.scores.reduce((sum, s) => sum + s, 0) / data.count,
          count: data.count
        }))
        .filter(s => s.count >= 2)  // Only include styles with at least 2 ratings
        .sort((a, b) => b.average - a.average);

      return {
        participantId: p.id,
        userName: p.user?.name || `Notandi ${p.code}`,
        favoriteStyle: styleAverages[0] ? {
          style: styleAverages[0].style,
          average: Number(styleAverages[0].average.toFixed(2)),
          count: styleAverages[0].count
        } : null,
        leastFavoriteStyle: styleAverages[styleAverages.length - 1] && styleAverages.length > 1 ? {
          style: styleAverages[styleAverages.length - 1].style,
          average: Number(styleAverages[styleAverages.length - 1].average.toFixed(2)),
          count: styleAverages[styleAverages.length - 1].count
        } : null,
        allStylePreferences: styleAverages.map(s => ({
          style: s.style,
          average: Number(s.average.toFixed(2)),
          count: s.count
        }))
      };
    })
    .filter(p => p.favoriteStyle !== null);

    // 5. Unanimous Ratings - beers where everyone gave same or very similar scores
    const unanimousRatings = tasting.tastingBeers
      .filter(beer => beer.status === 'finished' && beer.ratings.length >= Math.max(2, totalParticipants * 0.5))
      .map(beer => {
        const ratings = beer.ratings.map(r => r.score);
        const average = ratings.reduce((sum, score) => sum + score, 0) / ratings.length;
        const variance = ratings.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / ratings.length;
        const stdDev = Math.sqrt(variance);

        const name = beer.beer?.name || beer.customName || 'Unknown';
        const brewery = beer.beer?.brewery || beer.customBrewery || 'Unknown';

        return {
          beerId: beer.id,
          name,
          brewery,
          average: Number(average.toFixed(2)),
          standardDeviation: Number(stdDev.toFixed(2)),
          ratingsCount: ratings.length,
          minRating: Math.min(...ratings),
          maxRating: Math.max(...ratings),
          range: Number((Math.max(...ratings) - Math.min(...ratings)).toFixed(2)),
          unanimity: stdDev < 0.5 ? 'Very High' : stdDev < 1 ? 'High' : stdDev < 1.5 ? 'Medium' : 'Low'
        };
      })
      .filter(beer => beer.standardDeviation < 1.5)  // Only show beers with reasonable agreement
      .sort((a, b) => a.standardDeviation - b.standardDeviation);

    // 6. Participant Rating Spread - who has the widest/narrowest rating range
    const participantRatingSpread = tasting.participants.map(p => {
      const userRatings = tasting.tastingBeers.flatMap(beer =>
        beer.ratings.filter(r => r.participantId === p.id).map(r => r.score)
      );

      if (userRatings.length < 2) return null;

      const min = Math.min(...userRatings);
      const max = Math.max(...userRatings);
      const range = max - min;
      const average = userRatings.reduce((sum, score) => sum + score, 0) / userRatings.length;

      // Calculate standard deviation
      const variance = userRatings.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / userRatings.length;
      const stdDev = Math.sqrt(variance);

      return {
        participantId: p.id,
        userName: p.user?.name || `Notandi ${p.code}`,
        ratingsCount: userRatings.length,
        minRating: min,
        maxRating: max,
        range: Number(range.toFixed(2)),
        average: Number(average.toFixed(2)),
        standardDeviation: Number(stdDev.toFixed(2)),
        ratingStyle: range < 3 ? 'Consistent' : range < 5 ? 'Moderate' : 'Wide Range'
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => b.range - a.range);

    // COUNTRY-BASED ANALYTICS

    // Calculate country statistics
    const countryStats: Record<string, { count: number; totalRating: number; ratings: number[] }> = {};

    tasting.tastingBeers
      .filter(beer => beer.status === 'finished')
      .forEach(beer => {
        const country = beer.beer?.country || 'Unknown';
        const beerRatings = beer.ratings.map(r => r.score);

        if (!countryStats[country]) {
          countryStats[country] = { count: 0, totalRating: 0, ratings: [] };
        }
        countryStats[country].count++;
        countryStats[country].ratings.push(...beerRatings);
        countryStats[country].totalRating += beerRatings.reduce((sum, r) => sum + r, 0);
      });

    // 1. Country Performance Ranking - which countries got highest/lowest average ratings
    const countryPerformanceRanking = Object.entries(countryStats)
      .map(([country, data]) => {
        const average = data.ratings.length > 0
          ? data.totalRating / data.ratings.length
          : 0;

        // Calculate standard deviation for this country
        const variance = data.ratings.length > 1
          ? data.ratings.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / data.ratings.length
          : 0;
        const stdDev = Math.sqrt(variance);

        return {
          country,
          beersCount: data.count,
          ratingsCount: data.ratings.length,
          averageRating: Number(average.toFixed(2)),
          standardDeviation: Number(stdDev.toFixed(2)),
          minRating: data.ratings.length > 0 ? Math.min(...data.ratings) : 0,
          maxRating: data.ratings.length > 0 ? Math.max(...data.ratings) : 0
        };
      })
      .filter(c => c.beersCount > 0 && c.country !== 'Unknown')
      .sort((a, b) => b.averageRating - a.averageRating);

    // 2. Local vs International Comparison
    const localVsInternational = (() => {
      const icelandicBeers = tasting.tastingBeers
        .filter(beer => beer.status === 'finished' && beer.beer?.country === 'Ísland');
      const internationalBeers = tasting.tastingBeers
        .filter(beer => beer.status === 'finished' && beer.beer?.country && beer.beer.country !== 'Ísland');

      const icelandicRatings = icelandicBeers.flatMap(beer => beer.ratings.map(r => r.score));
      const internationalRatings = internationalBeers.flatMap(beer => beer.ratings.map(r => r.score));

      const icelandicAvg = icelandicRatings.length > 0
        ? icelandicRatings.reduce((sum, r) => sum + r, 0) / icelandicRatings.length
        : 0;
      const internationalAvg = internationalRatings.length > 0
        ? internationalRatings.reduce((sum, r) => sum + r, 0) / internationalRatings.length
        : 0;

      return {
        icelandic: {
          beersCount: icelandicBeers.length,
          ratingsCount: icelandicRatings.length,
          averageRating: Number(icelandicAvg.toFixed(2))
        },
        international: {
          beersCount: internationalBeers.length,
          ratingsCount: internationalRatings.length,
          averageRating: Number(internationalAvg.toFixed(2))
        },
        difference: Number((icelandicAvg - internationalAvg).toFixed(2)),
        favoritism: icelandicAvg > internationalAvg + 0.3 ? 'Local' :
                    internationalAvg > icelandicAvg + 0.3 ? 'International' : 'Neutral'
      };
    })();

    // 3. Country Distribution - pie chart data
    const countryDistribution = Object.entries(countryStats)
      .map(([country, data]) => ({
        country,
        count: data.count,
        averageRating: data.ratings.length > 0
          ? Number((data.totalRating / data.ratings.length).toFixed(2))
          : 0,
        totalRatings: data.ratings.length
      }))
      .filter(c => c.country !== 'Unknown')
      .sort((a, b) => b.count - a.count);

    // 4. Participant Country Preferences - each person's favorite/least favorite countries
    const participantCountryPreferences = tasting.participants.map(p => {
      const userRatings = tasting.tastingBeers.flatMap(beer =>
        beer.ratings
          .filter(r => r.participantId === p.id)
          .map(rating => ({
            score: rating.score,
            country: beer.beer?.country || 'Unknown'
          }))
      );

      // Group ratings by country
      const countryRatings = userRatings
        .filter(r => r.country !== 'Unknown')
        .reduce((acc, { country, score }) => {
          if (!acc[country]) {
            acc[country] = { scores: [], count: 0 };
          }
          acc[country].scores.push(score);
          acc[country].count++;
          return acc;
        }, {} as Record<string, { scores: number[], count: number }>);

      const countryAverages = Object.entries(countryRatings)
        .map(([country, data]) => ({
          country,
          average: data.scores.reduce((sum, s) => sum + s, 0) / data.count,
          count: data.count
        }))
        .filter(c => c.count >= 2)  // Only include countries with at least 2 ratings
        .sort((a, b) => b.average - a.average);

      return {
        participantId: p.id,
        userName: p.user?.name || `Notandi ${p.code}`,
        favoriteCountry: countryAverages[0] ? {
          country: countryAverages[0].country,
          average: Number(countryAverages[0].average.toFixed(2)),
          count: countryAverages[0].count
        } : null,
        leastFavoriteCountry: countryAverages[countryAverages.length - 1] && countryAverages.length > 1 ? {
          country: countryAverages[countryAverages.length - 1].country,
          average: Number(countryAverages[countryAverages.length - 1].average.toFixed(2)),
          count: countryAverages[countryAverages.length - 1].count
        } : null,
        allCountryPreferences: countryAverages.map(c => ({
          country: c.country,
          average: Number(c.average.toFixed(2)),
          count: c.count
        }))
      };
    })
    .filter(p => p.favoriteCountry !== null);

    // 5. Country Rating Consensus - which countries had most/least agreement
    const countryRatingConsensus = Object.entries(countryStats)
      .map(([country, data]) => {
        if (data.ratings.length === 0) return null;

        const average = data.totalRating / data.ratings.length;
        const variance = data.ratings.length > 1
          ? data.ratings.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / data.ratings.length
          : 0;
        const stdDev = Math.sqrt(variance);

        return {
          country,
          beersCount: data.count,
          ratingsCount: data.ratings.length,
          averageRating: Number(average.toFixed(2)),
          standardDeviation: Number(stdDev.toFixed(2)),
          agreement: stdDev < 1 ? 'High' : stdDev < 2 ? 'Medium' : 'Low'
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null && item.country !== 'Unknown')
      .sort((a, b) => a.standardDeviation - b.standardDeviation);

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
      ratingTrend,
      styleDistribution,
      beerControversy,
      abvVsRating,
      ratingVelocity,
      participantDeviation,
      ratingConsensus,
      beerTimings,
      beerParticipation,
      topRatedBeers,
      participantStats,
      // Style analytics
      stylePerformanceRanking,
      styleRatingSpread,
      styleRatingDistribution,
      participantStylePreferences,
      unanimousRatings,
      participantRatingSpread,
      // Country analytics
      countryPerformanceRanking,
      localVsInternational,
      countryDistribution,
      participantCountryPreferences,
      countryRatingConsensus
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
