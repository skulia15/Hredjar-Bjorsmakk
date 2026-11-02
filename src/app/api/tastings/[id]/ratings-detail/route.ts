import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { countTags } from '@/lib/flavorTags';

// GET /api/tastings/[id]/ratings-detail - Get detailed ratings for each beer and participant
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const tasting = await prisma.tasting.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          },
          orderBy: { code: 'asc' }
        },
        tastingBeers: {
          where: {
            status: 'finished'
          },
          include: {
            beer: true,
            flavorTags: { select: { tags: true } },
            ratings: {
              include: {
                participant: {
                  include: {
                    user: {
                      select: {
                        name: true
                      }
                    }
                  }
                }
              }
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

    // Build participants list
    const participants = tasting.participants.map(p => ({
      id: p.id,
      userName: p.user?.name || `Notandi ${p.code}`,
      code: p.code
    }));

    // Build beers with ratings
    const beersWithRatings = tasting.tastingBeers.map(tb => {
      // Calculate average
      const ratings = tb.ratings;
      const average = ratings.length > 0
        ? ratings.reduce((sum: number, r: { score: number }) => sum + r.score, 0) / ratings.length
        : 0;

      // Build ratings map by participant
      const ratingsMap: Record<string, number | null> = {};
      participants.forEach(p => {
        const rating = ratings.find(r => r.participant.id === p.id);
        ratingsMap[p.id] = rating ? rating.score : null;
      });

      return {
        beerId: tb.id,
        name: tb.beer?.name || tb.customName || 'Unknown',
        brewery: tb.beer?.brewery || tb.customBrewery || 'Unknown',
        average: Number(average.toFixed(2)),
        ratingsCount: ratings.length,
        ratings: ratingsMap,
        tags: countTags(tb.flavorTags),
        guesses: ratings
          .filter(r => r.groupGuess !== null)
          .map(r => ({
            participantId: r.participantId,
            userName: r.participant.user?.name || `Notandi ${r.participant.code}`,
            guess: r.groupGuess as number
          })),
        notes: ratings
          .filter(r => r.note)
          .map(r => ({
            participantId: r.participantId,
            userName: r.participant.user?.name || `Notandi ${r.participant.code}`,
            note: r.note as string
          }))
      };
    });

    // Sort by average descending
    beersWithRatings.sort((a: { average: number }, b: { average: number }) => b.average - a.average);

    return NextResponse.json({
      tastingId: tasting.id,
      title: tasting.title,
      status: tasting.status,
      participants,
      beers: beersWithRatings
    });

  } catch (error) {
    console.error('Error fetching detailed ratings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch detailed ratings' },
      { status: 500 }
    );
  }
}
