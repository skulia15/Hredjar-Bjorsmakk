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

    // Verify user is leader
    await requireLeader(userName);

    // Update beer
    const beer = await prisma.beer.update({
      where: { id: params.beerId },
      data: {
        name,
        brewery,
        style,
        abv
      }
    });

    return NextResponse.json({
      id: beer.id,
      name: beer.name,
      brewery: beer.brewery,
      style: beer.style,
      abv: beer.abv
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

    // Verify user is leader
    await requireLeader(userName);

    // Check beer status and ratings
    const beer = await prisma.beer.findUnique({
      where: { id: params.beerId },
      include: {
        _count: {
          select: { ratings: true }
        }
      }
    });

    if (!beer) {
      return NextResponse.json(
        { error: 'Beer not found' },
        { status: 404 }
      );
    }

    // Can only delete untasted beers with no ratings
    if (beer.status !== 'untasted' || beer._count.ratings > 0) {
      return NextResponse.json(
        { error: 'Cannot delete beer with ratings or in current/finished state' },
        { status: 400 }
      );
    }

    // Delete beer
    await prisma.beer.delete({
      where: { id: params.beerId }
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
