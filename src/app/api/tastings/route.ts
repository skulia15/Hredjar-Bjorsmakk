import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createTastingSchema, validateInput } from '@/lib/validation';
import { getOrCreateUser, generateUniqueParticipantCode } from '@/lib/auth';
import { createParticipantSession, requireAdminSession } from '@/lib/session';
import { randomUUID } from 'crypto';

// GET /api/tastings - List all tastings
export async function GET() {
  try {
    const tastings = await prisma.tasting.findMany({
      include: {
        _count: {
          select: { participants: true, beers: true }
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
        beerCount: t._count.beers
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
    // Verify admin session
    await requireAdminSession();

    const body = await request.json();
    const validation = validateInput(createTastingSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { title, creatorName } = validation.data;

    // Get or create user
    const user = await getOrCreateUser(creatorName);

    // Create tasting
    const tasting = await prisma.tasting.create({
      data: {
        title,
        createdBy: user.id,
        status: 'draft',
        version: 1
      }
    });

    // Create participant for creator
    const participantCode = await generateUniqueParticipantCode(tasting.id);
    const rejoinToken = randomUUID();

    const participant = await prisma.participant.create({
      data: {
        tastingId: tasting.id,
        userId: user.id,
        code: participantCode,
        rejoinToken
      }
    });

    // Set session cookie
    await createParticipantSession(rejoinToken);

    return NextResponse.json({
      id: tasting.id,
      title: tasting.title,
      status: tasting.status,
      createdBy: tasting.createdBy,
      participant: {
        id: participant.id,
        userId: participant.userId,
        code: participant.code,
        rejoinToken: participant.rejoinToken,
        isLeader: user.isLeader
      }
    }, { status: 201 });

  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    console.error('Error creating tasting:', error);
    return NextResponse.json(
      { error: 'Failed to create tasting' },
      { status: 500 }
    );
  }
}
