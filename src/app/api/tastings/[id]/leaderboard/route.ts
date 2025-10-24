import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/tastings/{id}/leaderboard
 * Get top finished beers (for waiting state after wrap-up)
 *
 * Returns all finished beers sorted by average rating descending
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get tasting with finished beers
    const tasting = await prisma.tasting.findUnique({
      where: { id },
      include: {
        tastingBeers: {
          where: {
            status: 'finished'
          },
          include: {
            beer: true,
            ratings: {
              select: {
                score: true
              }
            }
          },
          orderBy: {
            orderIndex: 'asc'
          }
        }
      }
    })

    if (!tasting) {
      return NextResponse.json(
        { error: 'Tasting not found' },
        { status: 404 }
      )
    }

    // Calculate averages and build leaderboard
    const beers = tasting.tastingBeers
      .map(tb => {
        const scores = tb.ratings.map(r => r.score)
        const average = scores.length > 0
          ? scores.reduce((sum, score) => sum + score, 0) / scores.length
          : 0

        const name = tb.beer?.name || tb.customName || 'Unknown'
        const brewery = tb.beer?.brewery || tb.customBrewery || 'Unknown'

        return {
          beerId: tb.id,
          name,
          brewery,
          average: parseFloat(average.toFixed(2)),
          count: scores.length
        }
      })
      .filter(beer => beer.count > 0) // Only include beers with ratings
      .sort((a, b) => b.average - a.average) // Sort by average descending
      .map((beer, index) => ({
        ...beer,
        rank: index + 1
      }))

    return NextResponse.json({
      tastingId: id,
      beers
    })

  } catch (error) {
    console.error('Error fetching leaderboard:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
