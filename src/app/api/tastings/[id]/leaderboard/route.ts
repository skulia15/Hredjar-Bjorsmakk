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
  { params }: { params: { id: string } }
) {
  try {
    // Get tasting with finished beers
    const tasting = await prisma.tasting.findUnique({
      where: { id: params.id },
      include: {
        beers: {
          where: {
            status: 'finished'
          },
          include: {
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
    const beers = tasting.beers
      .map(beer => {
        const scores = beer.ratings.map(r => r.score)
        const average = scores.length > 0
          ? scores.reduce((sum, score) => sum + score, 0) / scores.length
          : 0

        return {
          beerId: beer.id,
          name: beer.name,
          brewery: beer.brewery,
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
      tastingId: params.id,
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
