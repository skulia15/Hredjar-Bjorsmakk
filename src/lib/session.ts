import { cookies } from 'next/headers';
import { prisma } from './prisma';

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'bt_participant';
const SESSION_MAX_AGE = Number(process.env.SESSION_COOKIE_MAX_AGE) || 2592000; // 30 days
const ADMIN_COOKIE_NAME = 'bt_admin';
const ADMIN_MAX_AGE = 86400; // 24 hours

/**
 * Create a participant session cookie
 */
export async function createParticipantSession(rejoinToken: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, rejoinToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

/**
 * Get participant from session cookie
 */
export async function getParticipantFromSession() {
  const cookieStore = await cookies();
  const rejoinToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!rejoinToken) {
    return null;
  }

  try {
    const participant = await prisma.participant.findUnique({
      where: { rejoinToken },
      include: {
        user: true,
        tasting: true
      }
    });

    // Update last seen
    if (participant) {
      await prisma.participant.update({
        where: { id: participant.id },
        data: { lastSeenAt: new Date() }
      });
    }

    return participant;
  } catch (error) {
    console.error('Error getting participant from session:', error);
    return null;
  }
}

/**
 * Get participant from specific tasting by session
 */
export async function getParticipantFromTasting(tastingId: string) {
  const cookieStore = await cookies();
  const rejoinToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!rejoinToken) {
    return null;
  }

  try {
    const participant = await prisma.participant.findFirst({
      where: {
        rejoinToken,
        tastingId
      },
      include: {
        user: true
      }
    });

    return participant;
  } catch (error) {
    console.error('Error getting participant from tasting:', error);
    return null;
  }
}

/**
 * Clear participant session cookie
 */
export async function clearParticipantSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Create admin session cookie
 */
export async function createAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ADMIN_MAX_AGE,
    path: '/',
  });
}

/**
 * Check if current session is admin
 */
export async function isAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return adminCookie === 'true';
}

/**
 * Check if current user can create tastings (admin or leader)
 */
export async function canCreateTastings(): Promise<boolean> {
  // First check if they have admin session
  const hasAdminSession = await isAdminSession();
  if (hasAdminSession) {
    return true;
  }

  // Check if they're logged in as a leader
  const participant = await getParticipantFromSession();
  if (participant?.user && (participant.user.isLeader || participant.user.isAdmin)) {
    return true;
  }

  return false;
}

/**
 * Clear admin session cookie
 */
export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

/**
 * Require admin session or throw error
 */
export async function requireAdminSession() {
  const isAdmin = await isAdminSession();
  if (!isAdmin) {
    throw new Error('Admin access required');
  }
}
