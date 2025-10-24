import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/beers/[id]
 * Get a single beer from the catalog
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const beer = await prisma.beer.findUnique({
      where: { id }
    })

    if (!beer) {
      return NextResponse.json(
        { error: 'Beer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ beer })
  } catch (error) {
    console.error('Error fetching beer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/beers/[id]
 * Update a beer in the catalog
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Validate that beer exists
    const existingBeer = await prisma.beer.findUnique({
      where: { id }
    })

    if (!existingBeer) {
      return NextResponse.json(
        { error: 'Beer not found' },
        { status: 404 }
      )
    }

    // Prepare update data - only include provided fields
    const updateData: any = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.brewery !== undefined) updateData.brewery = body.brewery
    if (body.style !== undefined) updateData.style = body.style
    if (body.abv !== undefined) updateData.abv = body.abv
    if (body.country !== undefined) updateData.country = body.country
    if (body.description !== undefined) updateData.description = body.description
    if (body.containerSize !== undefined) updateData.containerSize = body.containerSize
    if (body.containerType !== undefined) updateData.containerType = body.containerType
    if (body.productNumber !== undefined) updateData.productNumber = body.productNumber
    if (body.vinbudinUrl !== undefined) updateData.vinbudinUrl = body.vinbudinUrl
    if (body.priceISK !== undefined) updateData.priceISK = body.priceISK
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl

    // Update the beer
    const updatedBeer = await prisma.beer.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      beer: updatedBeer,
      message: 'Beer updated successfully'
    })
  } catch (error) {
    console.error('Error updating beer:', error)
    return NextResponse.json(
      { error: 'Failed to update beer' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/beers/[id]
 * Delete a beer from the catalog
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if beer exists
    const beer = await prisma.beer.findUnique({
      where: { id }
    })

    if (!beer) {
      return NextResponse.json(
        { error: 'Beer not found' },
        { status: 404 }
      )
    }

    // Check if beer is used in any tastings
    const tastingBeersCount = await prisma.tastingBeer.count({
      where: { beerId: id }
    })

    if (tastingBeersCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete beer that is used in tastings' },
        { status: 400 }
      )
    }

    // Delete the beer
    await prisma.beer.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Beer deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting beer:', error)
    return NextResponse.json(
      { error: 'Failed to delete beer' },
      { status: 500 }
    )
  }
}
