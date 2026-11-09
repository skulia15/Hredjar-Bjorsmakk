import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authErrorResponse, isLeaderOrAdmin, requireUser } from '@/lib/auth';
import { AvatarTakenError, createParticipant, InvalidAvatarError } from '@/lib/participants';
import { AVATARS, resolveAvatar } from '@/lib/avatars';

// GET /api/tastings/[id]/join - Check current user's join status & taken avatars for this tasting
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireUser();

    const tasting = await prisma.tasting.findUnique({
      where: { id },
      include: {
        participants: {
          select: { id: true, userId: true, avatar: true }
        }
      }
    });

    if (!tasting) {
      return NextResponse.json(
        { error: 'Tasting not found' },
        { status: 404 }
      );
    }

    const existing = tasting.participants.find((p) => p.userId === user.id);
    const takenAvatars = Array.from(
      new Set(
        tasting.participants
          .filter((p) => p.userId !== user.id)
          .map((p) => resolveAvatar(p.avatar, p.id).key)
      )
    );

    return NextResponse.json({
      alreadyJoined: Boolean(existing),
      participantId: existing?.id ?? null,
      avatar: existing ? resolveAvatar(existing.avatar, existing.id).key : null,
      takenAvatars,
      avatars: AVATARS
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Error checking join status:', error);
    return NextResponse.json(
      { error: 'Failed to check join status' },
      { status: 500 }
    );
  }
}

// POST /api/tastings/[id]/join - Join tasting as the signed-in user (once joined, avatar cannot be changed)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireUser();

    let chosenAvatar: string | null = null;
    try {
      const body = await request.json();
      if (body && typeof body.avatar === 'string' && body.avatar.trim()) {
        chosenAvatar = body.avatar.trim();
      }
    } catch {
      // Empty body is valid (picks a free avatar automatically)
    }

    // Verify tasting exists
    const tasting = await prisma.tasting.findUnique({
      where: { id }
    });

    if (!tasting) {
      return NextResponse.json(
        { error: 'Tasting not found' },
        { status: 404 }
      );
    }

    // Check if user already has a participant record for this tasting
    let participant = await prisma.participant.findUnique({
      where: {
        tastingId_userId: {
          tastingId: id,
          userId: user.id
        }
      }
    });

    // Removed by the leader: they stay out. Leaders and admins run the tasting regardless
    if (participant && !participant.active && !isLeaderOrAdmin(user)) {
      return NextResponse.json(
        { error: 'Leiðtoginn fjarlægði þig úr þessari smökkun', code: 'REMOVED' },
        { status: 403 }
      );
    }

    if (participant) {
      // User already joined - keep their original avatar, update last seen, and bring them back from a break
      participant = await prisma.participant.update({
        where: { id: participant.id },
        data: { lastSeenAt: new Date(), active: true, pausedAt: null }
      });
    } else {
      participant = await createParticipant(id, user.id, chosenAvatar);
    }

    return NextResponse.json({
      participantId: participant.id,
      userId: user.id,
      code: participant.code,
      avatar: participant.avatar,
      isLeader: isLeaderOrAdmin(user),
      user: {
        id: user.id,
        name: user.name,
        isLeader: isLeaderOrAdmin(user)
      }
    });

  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    if (error instanceof AvatarTakenError) {
      return NextResponse.json(
        { error: 'Þessi mynd er þegar tekin, veldu aðra', code: 'AVATAR_TAKEN' },
        { status: 409 }
      );
    }

    if (error instanceof InvalidAvatarError) {
      return NextResponse.json(
        { error: 'Ógild mynd', code: 'INVALID_AVATAR' },
        { status: 400 }
      );
    }

    console.error('Error joining tasting:', error);
    return NextResponse.json(
      { error: 'Failed to join tasting' },
      { status: 500 }
    );
  }
}
