import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authErrorResponse, isEnvAdminEmail, requireAdmin } from '@/lib/auth';

// GET /api/admin/users - List all users
export async function GET() {
  try {
    await requireAdmin();

    const [users, ratingCounts] = await Promise.all([
      prisma.user.findMany({
        include: { _count: { select: { participations: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.participant.findMany({
        where: { userId: { not: null } },
        select: { userId: true, _count: { select: { ratings: true } } }
      })
    ]);

    const ratingCountByUser = new Map<string, number>();
    for (const participant of ratingCounts) {
      const userId = participant.userId!;
      ratingCountByUser.set(userId, (ratingCountByUser.get(userId) ?? 0) + participant._count.ratings);
    }

    return NextResponse.json({
      users: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        imageUrl: user.imageUrl,
        // Legacy users joined by name only and can't sign in until linked to an account
        hasAccount: user.clerkId !== null,
        isLeader: user.isLeader,
        isAdmin: user.isAdmin,
        isEnvAdmin: isEnvAdminEmail(user.email),
        createdAt: user.createdAt,
        tastingCount: user._count.participations,
        ratingCount: ratingCountByUser.get(user.id) ?? 0
      }))
    });

  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
