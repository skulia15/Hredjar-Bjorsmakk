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
    if (body.styles !== undefined) updateData.styles = body.styles
    if (body.abv !== undefined) updateData.abv = body.abv
    if (body.country !== undefined) updateData.country = body.country
    if (body.description !== undefined) updateData.description = body.description
    if (body.containerSize !== undefined) updateData.containerSize = body.containerSize
    if (body.containerType !== undefined) updateData.containerType = body.containerType
    if (body.productNumber !== undefined) updateData.productNumber = body.productNumber
    if (body.vinbudinUrl !== undefined) updateData.vinbudinUrl = body.vinbudinUrl
    if (body.priceISK !== undefined) updateData.priceISK = body.priceISK
    if (body.pricePerLiter !== undefined) updateData.pricePerLiter = body.pricePerLiter
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl

    // Check if update would violate unique constraint
    // Unique constraint: [name, brewery, containerSize, containerType]
    const nameToCheck = updateData.name ?? existingBeer.name
    const breweryToCheck = updateData.brewery ?? existingBeer.brewery
    const sizeToCheck = updateData.containerSize ?? existingBeer.containerSize
    const typeToCheck = updateData.containerType ?? existingBeer.containerType

    const conflictingBeer = await prisma.beer.findFirst({
      where: {
        AND: [
          { name: nameToCheck },
          { brewery: breweryToCheck },
          { containerSize: sizeToCheck },
          { containerType: typeToCheck },
          { id: { not: id } } // Exclude current beer
        ]
      }
    })

    if (conflictingBeer) {
      return NextResponse.json(
        {
          error: 'A beer with this name, brewery, and container size/type already exists',
          conflictingBeerId: conflictingBeer.id
        },
        { status: 409 }
      )
    }

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

    if (!id || typeof id !== 'string') {
      console.error('Invalid beer ID:', id)
      return NextResponse.json(
        { error: 'Invalid beer ID provided' },
        { status: 400 }
      )
    }

    // Check if beer exists
    const beer = await prisma.beer.findUnique({
      where: { id }
    })

    if (!beer) {
      console.log(`Beer not found: ${id}`)
      return NextResponse.json(
        { error: `Beer not found with ID: ${id}` },
        { status: 404 }
      )
    }

    // Check if beer is used in any tastings
    const tastingBeers = await prisma.tastingBeer.findMany({
      where: { beerId: id },
      include: {
        tasting: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    })

    if (tastingBeers.length > 0) {
      const tastingTitles = tastingBeers.map(tb => tb.tasting.title).join(', ')
      console.log(`Cannot delete beer ${beer.name} (${id}): used in ${tastingBeers.length} tasting(s): ${tastingTitles}`)
      return NextResponse.json(
        { 
          error: `Cannot delete beer that is used in ${tastingBeers.length} tasting(s)`,
          details: `This beer is referenced in: ${tastingTitles}`,
          tastingCount: tastingBeers.length
        },
        { status: 400 }
      )
    }

    // Delete the beer
    await prisma.beer.delete({
      where: { id }
    })

    console.log(`Successfully deleted beer: ${beer.name} (${id})`)
    return NextResponse.json({
      message: `Beer "${beer.name}" deleted successfully`
    })
  } catch (error) {
    console.error('Error deleting beer:', error)
    
    // Handle Prisma errors
    if (error instanceof Error) {
      // Check for foreign key constraint errors
      if (error.message.includes('Foreign key constraint') || error.message.includes('violates foreign key')) {
        return NextResponse.json(
          { error: 'Cannot delete beer: it is still referenced in one or more tastings' },
          { status: 400 }
        )
      }
      
      // Check for record not found
      if (error.message.includes('Record to delete does not exist')) {
        return NextResponse.json(
          { error: 'Beer not found or already deleted' },
          { status: 404 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to delete beer', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
