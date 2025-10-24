import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireLeader } from '@/lib/auth';

// POST /api/tastings/[id]/beers - Add beer to tasting
// Supports two modes:
// 1. From catalog: { beerId: "uuid", userName: "admin" }
// 2. Custom beer: { name: "...", brewery: "...", style?: "...", abv?: 6.5, userName: "admin" }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await request.json();
    const { beerId, name, brewery, style, abv, userName } = body;

    if (!userName) {
      return NextResponse.json(
        { error: 'userName is required' },
        { status: 400 }
      );
    }

    // Verify user is leader
    await requireLeader(userName);

    // Validate input: either beerId OR name+brewery required
    if (!beerId && (!name || !brewery)) {
      return NextResponse.json(
        { error: 'Either beerId (from catalog) or name+brewery (custom) required' },
        { status: 400 }
      );
    }

    // Get current max orderIndex
    const maxOrder = await prisma.tastingBeer.findFirst({
      where: { tastingId: id },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true }
    });

    const nextOrderIndex = (maxOrder?.orderIndex ?? -1) + 1;

    // Create tasting beer
    const tastingBeer = await prisma.tastingBeer.create({
      data: {
        tastingId: id,
        beerId: beerId || null, // Reference catalog beer if provided
        customName: beerId ? null : name,
        customBrewery: beerId ? null : brewery,
        customStyle: beerId ? null : style,
        customAbv: beerId ? null : abv,
        orderIndex: nextOrderIndex,
        status: 'untasted'
      },
      include: {
        beer: true // Include catalog beer details if referenced
      }
    });

    // Return unified response
    const responseName = tastingBeer.beer?.name || tastingBeer.customName;
    const responseBrewery = tastingBeer.beer?.brewery || tastingBeer.customBrewery;
    const responseStyle = tastingBeer.beer?.style || tastingBeer.customStyle;
    const responseAbv = tastingBeer.beer?.abv || tastingBeer.customAbv;

    return NextResponse.json({
      id: tastingBeer.id,
      name: responseName,
      brewery: responseBrewery,
      style: responseStyle,
      abv: responseAbv,
      status: tastingBeer.status,
      orderIndex: tastingBeer.orderIndex,
      fromCatalog: !!beerId
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
