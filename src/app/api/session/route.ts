import { NextResponse } from 'next/server';
import { getCurrentUser, isLeaderOrAdmin } from '@/lib/auth';

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

    return NextResponse.json({
      hasSession: true,
      name: user.name,
      userId: user.id,
      imageUrl: user.imageUrl,
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
