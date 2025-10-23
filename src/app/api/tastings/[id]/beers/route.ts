import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addBeerSchema, validateInput } from '@/lib/validation';
import { requireLeader } from '@/lib/auth';

// POST /api/tastings/[id]/beers - Add beer to tasting
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validation = validateInput(addBeerSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { name, brewery, style, abv, userName } = validation.data;

    // Verify user is leader
    await requireLeader(userName);

    // Get current max orderIndex
    const maxOrder = await prisma.beer.findFirst({
      where: { tastingId: params.id },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true }
    });

    const nextOrderIndex = (maxOrder?.orderIndex ?? -1) + 1;

    // Create beer
    const beer = await prisma.beer.create({
      data: {
        tastingId: params.id,
        name,
        brewery,
        style,
        abv,
        orderIndex: nextOrderIndex,
        status: 'untasted'
      }
    });

    return NextResponse.json({
      id: beer.id,
      name: beer.name,
      brewery: beer.brewery,
      style: beer.style,
      abv: beer.abv,
      status: beer.status,
      orderIndex: beer.orderIndex
    }, { status: 201 });

  } catch (error) {
    if (error instanceof Error && error.message === 'Leader access required') {
      return NextResponse.json(
        { error: 'Leader access required' },
        { status: 403 }
      );
    }

    console.error('Error adding beer:', error);
    return NextResponse.json(
      { error: 'Failed to add beer' },
      { status: 500 }
    );
  }
}
