import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { linkUserSchema, validateInput } from '@/lib/validation';
import { authErrorResponse, requireAdmin } from '@/lib/auth';

/**
 * POST /api/admin/users/[userId]/link
 * Merge a signed-in account (userId) into a legacy name-only user (legacyUserId), so the person
 * keeps their rating history. The legacy row survives and takes over the account's login.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    await requireAdmin();

    const validation = validateInput(linkUserSchema, await request.json());
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const { legacyUserId } = validation.data;

    const [account, legacy] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, include: { participations: { select: { id: true, tastingId: true } } } }),
      prisma.user.findUnique({ where: { id: legacyUserId }, include: { participations: { select: { tastingId: true } } } })
    ]);

    if (!account || !legacy) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (!account.clerkId) {
      return NextResponse.json({ error: 'Source user has no account to link' }, { status: 400 });
    }
    if (legacy.clerkId) {
      return NextResponse.json({ error: 'Target user is already linked to an account' }, { status: 400 });
    }

    // Both rows joined the same tasting: merging would need to choose between two sets of ratings
    const legacyTastings = new Set(legacy.participations.map((p) => p.tastingId));
    const overlapping = account.participations.filter((p) => legacyTastings.has(p.tastingId));
    if (overlapping.length > 0) {
      return NextResponse.json(
        { error: 'Both users joined the same tasting; remove one participation first', tastingIds: overlapping.map((p) => p.tastingId) },
        { status: 409 }
      );
    }

    const linked = await prisma.$transaction(async (tx) => {
      await tx.participant.updateMany({ where: { userId: account.id }, data: { userId: legacy.id } });
      // clerkId is unique, so the account row must go before the legacy row takes it over
      await tx.user.delete({ where: { id: account.id } });
      return tx.user.update({
        where: { id: legacy.id },
        data: {
          clerkId: account.clerkId,
          email: account.email,
          imageUrl: account.imageUrl,
          isLeader: legacy.isLeader || account.isLeader,
          isAdmin: legacy.isAdmin || account.isAdmin
        }
      });
    });

    return NextResponse.json({
      success: true,
      user: { id: linked.id, name: linked.name, isLeader: linked.isLeader, isAdmin: linked.isAdmin }
    });

  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Error linking users:', error);
    return NextResponse.json({ error: 'Failed to link users' }, { status: 500 });
  }
}
