import { prisma } from './prisma';

/**
 * Check if a user is an admin by their name
 */
export async function isAdmin(userName: string): Promise<boolean> {
  const normalizedName = userName.toLowerCase().trim();

  // Anyone named "skúli" is automatically an admin
  if (normalizedName === 'skúli') {
    return true;
  }

  const user = await prisma.user.findUnique({
    where: { name: normalizedName },
    select: { isAdmin: true }
  });

  return user?.isAdmin ?? false;
}

/**
 * Check if a user is a leader by their name
 */
export async function isLeader(userName: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { name: userName.toLowerCase() },
    select: { isLeader: true }
  });

  return user?.isLeader ?? false;
}

/**
 * Require leader access or throw error
 * Note: Admin users automatically have leader access
 */
export async function requireLeader(userName: string): Promise<void> {
  // Admin users automatically have leader privileges
  const normalizedName = userName.toLowerCase().trim();
  if (normalizedName === 'admin' || await isAdmin(userName)) {
    return;
  }

  // Check if user is a leader
  const leader = await isLeader(userName);

  if (!leader) {
    throw new Error('Leader access required');
  }
}

/**
 * Check if admin credentials are valid
 * In MVP, we just check if name is "admin"
 * In production, this would check against hashed password in AdminAuth table
 */
export async function validateAdmin(name: string): Promise<boolean> {
  const normalizedName = name.toLowerCase().trim();

  // MVP: Simple name check
  if (normalizedName === 'admin') {
    return true;
  }

  // Future: Check against AdminAuth table with bcrypt
  // const adminAuth = await prisma.adminAuth.findFirst();
  // if (adminAuth) {
  //   return await bcrypt.compare(password, adminAuth.passwordHash);
  // }

  return false;
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

/**
 * Get or create user by name (case-insensitive)
 * Automatically sets isAdmin for users named "skúli"
 */
export async function getOrCreateUser(name: string) {
  const normalizedName = name.toLowerCase().trim();
  const autoAdmin = normalizedName === 'skúli';

  const user = await prisma.user.upsert({
    where: { name: normalizedName },
    update: autoAdmin ? { isAdmin: true } : {}, // Update to admin if name is "skúli"
    create: {
      name: normalizedName,
      isLeader: false,
      isAdmin: autoAdmin
    }
  });

  return user;
}
