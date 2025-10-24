import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireLeader } from '@/lib/auth';

// POST /api/tastings/[id]/beers - Add beer to tasting
// Supports two modes:
// 1. From catalog: { beerId: "uuid", userName: "admin" }
// 2. Custom beer: { name: "...", brewery: "...", style?: "...", abv?: 6.5, userName: "admin" }
//    Note: Custom beers are automatically added to the beer catalog
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await request.json();
    const { beerId, name, brewery, style, abv, productNumber, userName } = body;

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

    // If custom beer (no beerId provided), create a catalog entry first
    let finalBeerId = beerId;
    if (!beerId && name && brewery) {
      // Auto-generate image URL if product number is provided
      const imageUrl = productNumber
        ? `https://www.vinbudin.is/Portaldata/1/Resources/vorumyndir/medium/${productNumber}_r.jpg`
        : null;

      const newBeer = await prisma.beer.create({
        data: {
          name,
          brewery,
          styles: style ? [style] : [],
          abv: abv || null,
          productNumber: productNumber || null,
          imageUrl
        }
      });
      finalBeerId = newBeer.id;
    }

    // Create tasting beer
    const tastingBeer = await prisma.tastingBeer.create({
      data: {
        tastingId: id,
        beerId: finalBeerId, // Always reference a catalog beer now
        orderIndex: nextOrderIndex,
        status: 'untasted'
      },
      include: {
        beer: true // Include catalog beer details if referenced
      }
    });

    // Return unified response
    return NextResponse.json({
      id: tastingBeer.id,
      name: tastingBeer.beer?.name,
      brewery: tastingBeer.beer?.brewery,
      styles: tastingBeer.beer?.styles,
      abv: tastingBeer.beer?.abv,
      status: tastingBeer.status,
      orderIndex: tastingBeer.orderIndex,
      fromCatalog: !!beerId,
      createdNewCatalogEntry: !beerId // Indicates if we created a new catalog entry
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
