import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminSession } from '@/lib/session';

// GET /api/admin/users - List all users
export async function GET(request: NextRequest) {
  try {
    // Verify admin session
    await requireAdminSession();

    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            participations: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get rating counts for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const ratingCount = await prisma.rating.count({
          where: {
            participant: {
              userId: user.id
            }
          }
        });

        return {
          id: user.id,
          name: user.name,
          isLeader: user.isLeader,
          createdAt: user.createdAt,
          tastingCount: user._count.participations,
          ratingCount
        };
      })
    );

    return NextResponse.json({
      users: usersWithStats
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
