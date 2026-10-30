import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma/client';
import type { User } from '@/generated/prisma/client';
import { prisma } from './prisma';

/**
 * Thrown by the require* guards; route handlers turn it into a JSON response via authErrorResponse
 */
export class AuthError extends Error {
  constructor(
    public readonly status: 401 | 403,
    message: string
  ) {
    super(message);
  }
}

export function authErrorResponse(error: unknown): NextResponse | null {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return null;
}

/**
 * Emails from ADMIN_EMAILS are always admin (bootstrap; can't be demoted from the dashboard)
 */
export function isEnvAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}

/**
 * The signed-in user's row, created on first sign-in. Identity comes only from the Clerk session,
 * never from request bodies.
 */
export async function getCurrentUser(): Promise<User | null> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const existing = await prisma.user.findUnique({ where: { clerkId } });
  if (existing) return ensureEnvAdmin(existing);

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const primaryEmail = clerkUser.primaryEmailAddress;
  const verifiedEmail =
    primaryEmail?.verification?.status === 'verified' ? primaryEmail.emailAddress.toLowerCase() : null;
  const profile = {
    clerkId,
    email: verifiedEmail,
    imageUrl: clerkUser.imageUrl || null,
  };

  // Same verified email on a new Clerk id: the account moved Clerk instance (dev -> production)
  if (verifiedEmail) {
    const moved = await prisma.user.findFirst({ where: { email: verifiedEmail, clerkId: { not: null } } });
    if (moved) {
      return ensureEnvAdmin(await prisma.user.update({ where: { id: moved.id }, data: profile }));
    }
  }

  const name = clerkUser.fullName || clerkUser.username || verifiedEmail?.split('@')[0] || 'Notandi';
  try {
    return await prisma.user.create({
      data: { ...profile, name, isAdmin: isEnvAdminEmail(verifiedEmail) },
    });
  } catch (error) {
    // Two first requests raced to create the same user
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return prisma.user.findUnique({ where: { clerkId } });
    }
    throw error;
  }
}

async function ensureEnvAdmin(user: User): Promise<User> {
  if (user.isAdmin || !isEnvAdminEmail(user.email)) return user;
  return prisma.user.update({ where: { id: user.id }, data: { isAdmin: true } });
}

export function isLeaderOrAdmin(user: Pick<User, 'isLeader' | 'isAdmin'>): boolean {
  return user.isLeader || user.isAdmin;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError(401, 'Sign in required');
  return user;
}

/**
 * Admins automatically have leader access
 */
export async function requireLeader(): Promise<User> {
  const user = await requireUser();
  if (!isLeaderOrAdmin(user)) throw new AuthError(403, 'Leader access required');
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (!user.isAdmin) throw new AuthError(403, 'Admin access required');
  return user;
}

/**
 * The signed-in user's active participation in a tasting
 */
export async function requireParticipant(tastingId: string) {
  const user = await requireUser();
  const participant = await prisma.participant.findUnique({
    where: { tastingId_userId: { tastingId, userId: user.id } },
  });
  if (!participant || !participant.active) {
    throw new AuthError(403, 'Join this tasting first');
  }
  return { user, participant };
}

/**
 * Leaders/admins can act on any tasting; everyone else must have joined it
 */
export async function requireParticipantOrLeader(tastingId: string): Promise<User> {
  const user = await requireUser();
  if (isLeaderOrAdmin(user)) return user;
  return (await requireParticipant(tastingId)).user;
}

/**
 * Generate a unique 4-character participant code
 */
export function generateParticipantCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 4 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

/**
 * Generate a unique participant code that doesn't exist in the tasting
 */
export async function generateUniqueParticipantCode(tastingId: string): Promise<string> {
  let code = generateParticipantCode();
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const existing = await prisma.participant.findUnique({
      where: {
        tastingId_code: {
          tastingId,
          code
        }
      }
    });

    if (!existing) {
      return code;
    }

    code = generateParticipantCode();
    attempts++;
  }

  // If we couldn't generate a unique code after 10 attempts,
  // fall back to timestamp-based code
  return `${code.substring(0, 2)}${Date.now().toString(36).slice(-2).toUpperCase()}`;
}
