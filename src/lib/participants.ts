import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { generateUniqueParticipantCode } from '@/lib/auth';
import { pickAvatar, resolveAvatar } from '@/lib/avatars';

/**
 * Add a user to a tasting with a Christmas avatar nobody else there has yet
 */
export async function createParticipant(tastingId: string, userId: string) {
  const code = await generateUniqueParticipantCode(tastingId);

  return prisma.$transaction(async (tx) => {
    // One join at a time per tasting, so two people can't grab the same free picture
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${tastingId}))`;
    const others = await tx.participant.findMany({ where: { tastingId }, select: { id: true, avatar: true } });
    // Participants from before avatars were stored show their seeded pick, so that one is taken too
    const taken = others.map((p) => resolveAvatar(p.avatar, p.id).key);

    return tx.participant.create({
      data: {
        tastingId,
        userId,
        code,
        avatar: pickAvatar(taken),
        // Legacy column from cookie sessions; no longer used as a credential
        rejoinToken: randomUUID()
      }
    });
  });
}
