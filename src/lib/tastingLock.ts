import type { Prisma } from '@/generated/prisma/client'

/**
 * Holds the tasting's lock until the transaction ends, so changes to one tasting (joining, rating,
 * switching or finishing the current beer) go one at a time and each sees the last one's result
 */
export async function lockTasting(tx: Prisma.TransactionClient, tastingId: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${tastingId}))`
}
