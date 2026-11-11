import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authErrorResponse, requireLeader } from '@/lib/auth';
import { lockTasting } from '@/lib/tastingLock';
import { makeBeerCurrent } from '@/lib/currentBeer';

// POST /api/tastings/[id]/beers - Add beer to tasting
// Supports two modes:
// 1. From catalog: { beerId: "uuid" }
// 2. Custom beer: { name: "...", brewery: "...", style?: "...", abv?: 6.5 }
//    Note: Custom beers are automatically added to the beer catalog
// makeCurrent: true also makes it the current beer, so a leader can pick beers as the night goes
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await request.json();
    const { beerId, name, brewery, style, abv, productNumber, makeCurrent } = body;

    // Verify user is leader
    await requireLeader();

    // Validate input: either beerId OR name+brewery required
    if (!beerId && (!name || !brewery)) {
      return NextResponse.json(
        { error: 'Either beerId (from catalog) or name+brewery (custom) required' },
        { status: 400 }
      );
    }

    // Under the tasting's lock: concurrent adds get distinct order indexes, and an add that can't
    // become current (e.g. the current beer is already rated) rolls back instead of half-applying
    const result = await prisma.$transaction(async (tx) => {
      await lockTasting(tx, id);

      const tasting = await tx.tasting.findUnique({ where: { id }, select: { status: true } });
      if (!tasting) {
        return { error: 'Tasting not found', status: 404 } as const;
      }
      if (tasting.status === 'closed') {
        return { error: 'Smökkuninni er lokið', status: 409 } as const;
      }
      if (makeCurrent && tasting.status !== 'active') {
        return { error: 'Hefja þarf smökkunina áður en bjór er settur sem núverandi', status: 409 } as const;
      }

      // Get current max orderIndex
      const maxOrder = await tx.tastingBeer.findFirst({
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

        const newBeer = await tx.beer.create({
          data: {
            name,
            brewery,
            styles: style ? [style] : [],
            abv: abv ?? null,
            productNumber: productNumber || null,
            imageUrl
          }
        });
        finalBeerId = newBeer.id;
      }

      // Snapshot the current price so later catalog syncs don't rewrite this tasting's stats
      const catalogPrice = beerId
        ? await tx.beer.findUnique({
            where: { id: beerId },
            select: { priceISK: true, pricePerLiter: true }
          })
        : null;
      if (beerId && !catalogPrice) {
        return { error: 'Beer not found', status: 404 } as const;
      }

      // Create tasting beer
      const created = await tx.tastingBeer.create({
        data: {
          tastingId: id,
          beerId: finalBeerId, // Always reference a catalog beer now
          priceISK: catalogPrice?.priceISK ?? null,
          pricePerLiter: catalogPrice?.pricePerLiter ?? null,
          orderIndex: nextOrderIndex,
          status: 'untasted'
        }
      });

      if (makeCurrent) {
        const current = await makeBeerCurrent(tx, id, created.id);
        // Throwing rolls back the add, so a failed "add and pour" doesn't leave a stray beer queued
        if (!current.ok) throw new MakeCurrentError(current.error, current.status);
      }

      const tastingBeer = await tx.tastingBeer.findUniqueOrThrow({
        where: { id: created.id },
        include: { beer: true }
      });
      return { tastingBeer };
    }).catch((error) => {
      if (error instanceof MakeCurrentError) return { error: error.message, status: error.status } as const;
      throw error;
    });

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    const { tastingBeer } = result;

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
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Error adding beer:', error);
    return NextResponse.json(
      { error: 'Failed to add beer' },
      { status: 500 }
    );
  }
}

class MakeCurrentError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}
