import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authErrorResponse, getCurrentUser, isLeaderOrAdmin, requireUser } from '@/lib/auth';
import { updateOwnNameSchema, validateInput } from '@/lib/validation';

// GET /api/session - Current signed-in user and their roles
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({
        hasSession: false,
        canCreateTastings: false,
        isLeader: false,
        isAdmin: false
      });
    }

    // First-timers get to pick a nickname before their first join
    const participation = await prisma.participant.findFirst({ where: { userId: user.id }, select: { id: true } });

    return NextResponse.json({
      hasSession: true,
      name: user.name,
      userId: user.id,
      imageUrl: user.imageUrl,
      hasJoinedBefore: participation !== null,
      isLeader: isLeaderOrAdmin(user),
      isAdmin: user.isAdmin,
      canCreateTastings: isLeaderOrAdmin(user)
    });
  } catch (error) {
    console.error('Error getting session:', error);
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    );
  }
}

// PATCH /api/session - Signed-in user changes their own display name
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser();

    const validation = validateInput(updateOwnNameSchema, await request.json());
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { name: validation.data.name }
    });

    return NextResponse.json({ name: updated.name });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Error updating name:', error);
    return NextResponse.json(
      { error: 'Failed to update name' },
      { status: 500 }
    );
  }
}
