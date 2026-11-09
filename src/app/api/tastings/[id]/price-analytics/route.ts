import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { median } from '@/lib/stats'
import { tastingBeerPrice } from '@/lib/tastingPrice'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const tasting = await prisma.tasting.findUnique({ where: { id }, select: { status: true } })
    if (!tasting) {
      return NextResponse.json({ error: 'Tasting not found' }, { status: 404 })
    }

    // Get all rated beers with their ratings and price info
    const tastingBeers = await prisma.tastingBeer.findMany({
      where: {
        tastingId: id,
        status: 'finished' // Only include finished beers
      },
      include: {
        beer: {
          select: {
            id: true,
            name: true,
            brewery: true,
            priceISK: true,
            pricePerLiter: true,
            containerSize: true,
            containerType: true
          }
        },
        ratings: {
          select: {
            score: true
          }
        }
      }
    })

    // Filter beers that have both ratings and price data
    // What each beer cost on the night (see tastingBeerPrice)
    const beersWithData = tastingBeers
      .map(tb => ({ ...tb, ...tastingBeerPrice(tb, tasting.status) }))
      .filter(tb => tb.beer && tb.pricePerLiter && tb.ratings.length > 0)
      .map(tb => {
        const ratings = tb.ratings.map(r => r.score)
        const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length

        return {
          beerId: tb.beer!.id,
          name: tb.beer!.name,
          brewery: tb.beer!.brewery,
          priceISK: tb.priceISK || 0,
          pricePerLiter: tb.pricePerLiter!,
          containerSize: tb.beer!.containerSize,
          containerType: tb.beer!.containerType,
          averageRating: average,
          ratingsCount: ratings.length
        }
      })

    if (beersWithData.length === 0) {
      return NextResponse.json({
        hasData: false,
        message: 'No beers with both price and rating data'
      })
    }

    // Calculate statistics
    const prices = beersWithData.map(b => b.pricePerLiter)
    const ratings = beersWithData.map(b => b.averageRating)

    // The mean of the middle two on an even count, not the upper one
    const medianPrice = median(prices)
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length
    const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length

    // Calculate value scores (rating per ISK spent per liter)
    const beersWithValue = beersWithData.map(beer => {
      const valueScore = (beer.averageRating / 10) / (beer.pricePerLiter / medianPrice)
      const efficiencyScore = beer.averageRating / beer.pricePerLiter

      return {
        ...beer,
        valueScore,
        efficiencyScore
      }
    })

    // Sort by value score
    const valueRanking = [...beersWithValue]
      .sort((a, b) => b.valueScore - a.valueScore)

    // Find best value (high rating, low price)
    const bestValue = valueRanking[0]

    // Calculate correlation between price and rating
    const meanPrice = avgPrice
    const meanRating = avgRating

    let numerator = 0
    let denomPrice = 0
    let denomRating = 0

    for (const beer of beersWithData) {
      const priceDiff = beer.pricePerLiter - meanPrice
      const ratingDiff = beer.averageRating - meanRating
      numerator += priceDiff * ratingDiff
      denomPrice += priceDiff * priceDiff
      denomRating += ratingDiff * ratingDiff
    }

    // No spread in price or rating (or a single beer) means no correlation to speak of, not 0/0
    const denom = Math.sqrt(denomPrice * denomRating)
    const correlation = denom > 0 ? numerator / denom : 0

    // Categorize beers into quadrants
    const quadrants = {
      hiddenGems: beersWithValue.filter(b =>
        b.averageRating >= avgRating && b.pricePerLiter < medianPrice
      ),
      premiumWorthIt: beersWithValue.filter(b =>
        b.averageRating >= avgRating && b.pricePerLiter >= medianPrice
      ),
      budgetOptions: beersWithValue.filter(b =>
        b.averageRating < avgRating && b.pricePerLiter < medianPrice
      ),
      overpriced: beersWithValue.filter(b =>
        b.averageRating < avgRating && b.pricePerLiter >= medianPrice
      )
    }

    // Top 25% rated beers price analysis
    // The best quarter, at least one beer: with 4 beers that's the top one, not the top two
    const top25Threshold = [...ratings].sort((a, b) => b - a)[Math.max(0, Math.ceil(ratings.length * 0.25) - 1)]
    const top25Beers = beersWithValue.filter(b => b.averageRating >= top25Threshold)
    const top25AvgPrice = top25Beers.reduce((sum, b) => sum + b.pricePerLiter, 0) / top25Beers.length
    const premiumGap = ((top25AvgPrice - avgPrice) / avgPrice) * 100

    return NextResponse.json({
      hasData: true,
      overview: {
        totalBeers: beersWithData.length,
        avgPrice: Math.round(avgPrice),
        medianPrice: Math.round(medianPrice),
        avgRating: parseFloat(avgRating.toFixed(2)),
        correlation: parseFloat(correlation.toFixed(3)),
        premiumGap: parseFloat(premiumGap.toFixed(1))
      },
      valueRanking: valueRanking.slice(0, 10).map((beer, index) => ({
        rank: index + 1,
        beerId: beer.beerId,
        name: beer.name,
        brewery: beer.brewery,
        rating: parseFloat(beer.averageRating.toFixed(2)),
        pricePerLiter: Math.round(beer.pricePerLiter),
        valueScore: parseFloat(beer.valueScore.toFixed(3)),
        efficiencyScore: parseFloat((beer.efficiencyScore * 1000).toFixed(2)), // pts per 1000 ISK
        containerSize: beer.containerSize,
        containerType: beer.containerType
      })),
      bestValue: {
        name: bestValue.name,
        brewery: bestValue.brewery,
        rating: parseFloat(bestValue.averageRating.toFixed(2)),
        pricePerLiter: Math.round(bestValue.pricePerLiter),
        percentileSavings: Math.round(((medianPrice - bestValue.pricePerLiter) / medianPrice) * 100)
      },
      quadrants: {
        hiddenGems: quadrants.hiddenGems.map(b => ({
          name: b.name,
          brewery: b.brewery,
          rating: parseFloat(b.averageRating.toFixed(2)),
          pricePerLiter: Math.round(b.pricePerLiter)
        })),
        premiumWorthIt: quadrants.premiumWorthIt.map(b => ({
          name: b.name,
          brewery: b.brewery,
          rating: parseFloat(b.averageRating.toFixed(2)),
          pricePerLiter: Math.round(b.pricePerLiter)
        })),
        budgetOptions: quadrants.budgetOptions.map(b => ({
          name: b.name,
          brewery: b.brewery,
          rating: parseFloat(b.averageRating.toFixed(2)),
          pricePerLiter: Math.round(b.pricePerLiter)
        })),
        overpriced: quadrants.overpriced.map(b => ({
          name: b.name,
          brewery: b.brewery,
          rating: parseFloat(b.averageRating.toFixed(2)),
          pricePerLiter: Math.round(b.pricePerLiter)
        }))
      },
      scatterData: beersWithValue.map(beer => ({
        name: beer.name,
        brewery: beer.brewery,
        x: Math.round(beer.pricePerLiter),
        y: parseFloat(beer.averageRating.toFixed(2)),
        ratingsCount: beer.ratingsCount
      }))
    })
  } catch (error) {
    console.error('Error fetching price analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch price analytics' },
      { status: 500 }
    )
  }
}
