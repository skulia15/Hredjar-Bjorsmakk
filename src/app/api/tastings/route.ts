import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createTastingSchema, validateInput } from '@/lib/validation';
import { authErrorResponse, requireLeader } from '@/lib/auth';
import { createParticipant } from '@/lib/participants';

// GET /api/tastings - List all tastings
export async function GET() {
  try {
    const tastings = await prisma.tasting.findMany({
      include: {
        _count: {
          select: { participants: true, tastingBeers: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to most recent 50
    });

    return NextResponse.json({
      tastings: tastings.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        createdAt: t.createdAt,
        participantCount: t._count.participants,
        beerCount: t._count.tastingBeers
      }))
    });
  } catch (error) {
    console.error('Error fetching tastings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tastings' },
      { status: 500 }
    );
  }
}

// POST /api/tastings - Create new tasting
export async function POST(request: NextRequest) {
  try {
    const user = await requireLeader();

    const body = await request.json();
    const validation = validateInput(createTastingSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { title, avatar, hideNotesUntilAllRated } = validation.data;

    // Create tasting
    const tasting = await prisma.tasting.create({
      data: {
        title,
        hideNotesUntilAllRated,
        createdBy: user.id,
        status: 'draft',
        version: 1
      }
    });

    // Create participant for creator
    const participant = await createParticipant(tasting.id, user.id, avatar);

    return NextResponse.json({
      id: tasting.id,
      title: tasting.title,
      status: tasting.status,
      createdBy: tasting.createdBy,
      participant: {
        id: participant.id,
        userId: participant.userId,
        code: participant.code,
        isLeader: true
      }
    }, { status: 201 });

  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Error creating tasting:', error);
    return NextResponse.json(
      { error: 'Failed to create tasting' },
      { status: 500 }
    );
  }
}
