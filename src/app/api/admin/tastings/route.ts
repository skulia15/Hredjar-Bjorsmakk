import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authErrorResponse, requireAdmin } from '@/lib/auth'

/**
 * GET /api/admin/tastings
 * List all tastings (admin view with enhanced details)
 *
 * Auth: Admin session required
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin()

    // Get all tastings with aggregated data
    const tastings = await prisma.tasting.findMany({
      include: {
        participants: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        tastingBeers: {
          select: {
            id: true,
            status: true
          }
        },
        ratings: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get creator names
    const creatorIds = tastings
      .map(t => t.createdBy)
      .filter((id): id is string => id !== null)

    const creators = await prisma.user.findMany({
      where: {
        id: {
          in: creatorIds
        }
      },
      select: {
        id: true,
        name: true
      }
    })

    const creatorMap = new Map(creators.map(c => [c.id, c.name]))

    // Format response
    const formattedTastings = tastings.map(tasting => ({
      id: tasting.id,
      title: tasting.title,
      status: tasting.status,
      createdAt: tasting.createdAt.toISOString(),
      createdBy: tasting.createdBy,
      createdByName: tasting.createdBy ? creatorMap.get(tasting.createdBy) : null,
      participantCount: tasting.participants.length,
      beerCount: tasting.tastingBeers.length,
      ratingCount: tasting.ratings.length,
      finishedBeerCount: tasting.tastingBeers.filter(b => b.status === 'finished').length
    }))

    return NextResponse.json({
      tastings: formattedTastings
    })

  } catch (error) {
    // Check if it's an auth error
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Error fetching admin tastings:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
