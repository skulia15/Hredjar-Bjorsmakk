import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { editBeerSchema, deleteBeerSchema, validateInput } from '@/lib/validation';
import { requireLeader } from '@/lib/auth';

// PATCH /api/tastings/[id]/beers/[beerId] - Edit beer
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; beerId: string } }
) {
  try {
    const body = await request.json();
    const validation = validateInput(editBeerSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { name, brewery, style, abv, userName } = validation.data;
    const tastingBeerId = params.beerId; // Accept beerId for backwards compatibility

    // Verify user is leader
    await requireLeader(userName);

    // Check if this is a custom beer (can only edit custom beers)
    const tastingBeer = await prisma.tastingBeer.findUnique({
      where: { id: tastingBeerId },
      include: { beer: true }
    });

    if (!tastingBeer) {
      return NextResponse.json(
        { error: 'Beer not found' },
        { status: 404 }
      );
    }

    if (tastingBeer.beerId) {
      return NextResponse.json(
        { error: 'Cannot edit beers from catalog. Only custom beers can be edited.' },
        { status: 400 }
      );
    }

    // Update custom beer fields
    const updatedBeer = await prisma.tastingBeer.update({
      where: { id: tastingBeerId },
      data: {
        customName: name,
        customBrewery: brewery,
        customStyle: style,
        customAbv: abv
      }
    });

    return NextResponse.json({
      id: updatedBeer.id,
      name: updatedBeer.customName,
      brewery: updatedBeer.customBrewery,
      style: updatedBeer.customStyle,
      abv: updatedBeer.customAbv
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Leader access required') {
      return NextResponse.json(
        { error: 'Leader access required' },
        { status: 403 }
      );
    }

    console.error('Error editing beer:', error);
    return NextResponse.json(
      { error: 'Failed to edit beer' },
      { status: 500 }
    );
  }
}

// DELETE /api/tastings/[id]/beers/[beerId] - Delete beer
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; beerId: string } }
) {
  try {
    const body = await request.json();
    const validation = validateInput(deleteBeerSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { userName } = validation.data;
    const tastingBeerId = params.beerId; // Accept beerId for backwards compatibility

    // Verify user is leader
    await requireLeader(userName);

    // Check beer status and ratings
    const tastingBeer = await prisma.tastingBeer.findUnique({
      where: { id: tastingBeerId },
      include: {
        _count: {
          select: { ratings: true }
        }
      }
    });

    if (!tastingBeer) {
      return NextResponse.json(
        { error: 'Beer not found' },
        { status: 404 }
      );
    }

    // Can only delete untasted beers with no ratings
    if (tastingBeer.status !== 'untasted' || tastingBeer._count.ratings > 0) {
      return NextResponse.json(
        { error: 'Cannot delete beer with ratings or in current/finished state' },
        { status: 400 }
      );
    }

    // Delete tasting beer
    await prisma.tastingBeer.delete({
      where: { id: tastingBeerId }
    });

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Leader access required') {
      return NextResponse.json(
        { error: 'Leader access required' },
        { status: 403 }
      );
    }

    console.error('Error deleting beer:', error);
    return NextResponse.json(
      { error: 'Failed to delete beer' },
      { status: 500 }
    );
  }
}
