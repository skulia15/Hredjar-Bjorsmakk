import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { generateUniqueParticipantCode } from '@/lib/auth';
import { AVATARS, pickAvatar, resolveAvatar } from '@/lib/avatars';

export class AvatarTakenError extends Error {
  constructor(public readonly avatar: string) {
    super(`Avatar already taken: ${avatar}`);
    this.name = 'AvatarTakenError';
  }
}

export class InvalidAvatarError extends Error {
  constructor(public readonly avatar: string) {
    super(`Unknown avatar: ${avatar}`);
    this.name = 'InvalidAvatarError';
  }
}

/**
 * Add a user to a tasting with a Christmas avatar nobody else there has yet.
 * If `chosenAvatar` is provided, claims that avatar or throws `AvatarTakenError` if already taken
 * (unless every avatar in the catalog is already taken at least once).
 */
export async function createParticipant(tastingId: string, userId: string, chosenAvatar?: string | null) {
  if (chosenAvatar && !AVATARS.some((a) => a.key === chosenAvatar)) {
    throw new InvalidAvatarError(chosenAvatar);
  }

  const code = await generateUniqueParticipantCode(tastingId);

  return prisma.$transaction(async (tx) => {
    // One join at a time per tasting, so two people can't grab the same free picture
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${tastingId}))`;
    const others = await tx.participant.findMany({ where: { tastingId }, select: { id: true, avatar: true } });
    // Participants from before avatars were stored show their seeded pick, so that one is taken too
    const taken = others.map((p) => resolveAvatar(p.avatar, p.id).key);
    const takenSet = new Set(taken);
    const allTaken = AVATARS.every((a) => takenSet.has(a.key));

    let avatar: string;
    if (chosenAvatar) {
      if (takenSet.has(chosenAvatar) && !allTaken) {
        throw new AvatarTakenError(chosenAvatar);
      }
      avatar = chosenAvatar;
    } else {
      avatar = pickAvatar(taken);
    }

    return tx.participant.create({
      data: {
        tastingId,
        userId,
        code,
        avatar,
        // Legacy column from cookie sessions; no longer used as a credential
        rejoinToken: randomUUID()
      }
    });
  });
}
