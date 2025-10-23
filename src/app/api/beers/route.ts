import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/beers
 * List all beers from global catalog
 *
 * Query params:
 * - search: Filter by name or brewery (optional)
 * - style: Filter by style (optional)
 * - country: Filter by country (optional)
 * - limit: Number of results (default 100)
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const search = url.searchParams.get('search')
    const style = url.searchParams.get('style')
    const country = url.searchParams.get('country')
    const limit = parseInt(url.searchParams.get('limit') || '100')

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brewery: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (style) {
      where.style = { contains: style, mode: 'insensitive' }
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
        style: true,
        abv: true,
        country: true,
        imageUrl: true,
        description: true,
        containerSize: true,
        containerType: true,
        productNumber: true,
        vinbudinUrl: true
      }
    })

    // Get unique styles and countries for filtering
    const allBeers = await prisma.beer.findMany({
      select: {
        style: true,
        country: true
      }
    })

    const styles = [...new Set(allBeers.map(b => b.style).filter(Boolean))].sort()
    const countries = [...new Set(allBeers.map(b => b.country).filter(Boolean))].sort()

    return NextResponse.json({
      beers,
      total: beers.length,
      filters: {
        styles,
        countries
      }
    })

  } catch (error) {
    console.error('Error fetching beers:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
