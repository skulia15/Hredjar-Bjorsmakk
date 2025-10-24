import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Mark as dynamic since we use query parameters
export const dynamic = 'force-dynamic'

/**
 * GET /api/beers
 * List all beers from global catalog
 * Dynamic route with client-side caching
 *
 * Query params:
 * - search: Filter by name or brewery (optional)
 * - style: Filter by style (optional)
 * - country: Filter by country (optional)
 * - limit: Number of results (default 100)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const search = searchParams.get('search')
    const style = searchParams.get('style')
    const country = searchParams.get('country')
    const limit = parseInt(searchParams.get('limit') || '100')

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brewery: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (style) {
      where.styles = { has: style }
    }

    if (country) {
      where.country = { contains: country, mode: 'insensitive' }
    }

    const beers = await prisma.beer.findMany({
      where,
      orderBy: [
        { brewery: 'asc' },
        { name: 'asc' }
      ],
      take: limit,
      select: {
        id: true,
        name: true,
        brewery: true,
        styles: true,
        abv: true,
        country: true,
        imageUrl: true,
        description: true,
        containerSize: true,
        containerType: true,
        productNumber: true,
        vinbudinUrl: true,
        priceISK: true
      }
    })

    // Get unique styles and countries for filtering
    const allBeers = await prisma.beer.findMany({
      select: {
        styles: true,
        country: true
      }
    })

    const styles = [...new Set(allBeers.flatMap(b => b.styles || []))].sort()
    const countries = [...new Set(allBeers.map(b => b.country).filter(Boolean))].sort()

    const response = NextResponse.json({
      beers,
      total: beers.length,
      filters: {
        styles,
        countries
      }
    })

    // Add cache headers for client-side caching
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200')

    return response

  } catch (error) {
    console.error('Error fetching beers:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
