import { NextResponse } from 'next/server';
import { clearParticipantSession, clearAdminSession } from '@/lib/session';

// POST /api/logout - Clear all session cookies
export async function POST() {
  try {
    await clearParticipantSession();
    await clearAdminSession();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging out:', error);
    return NextResponse.json(
      { error: 'Failed to log out' },
      { status: 500 }
    );
  }
}
