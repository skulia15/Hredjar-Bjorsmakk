import type { Prisma } from '@/generated/prisma/client'

type MakeCurrentResult =
  | { ok: true; version: number }
  | { ok: false; error: string; status: 400 | 404 | 409 }

/**
 * Makes an untasted beer the tasting's current beer. Call inside a transaction holding the
 * tasting's lock (lockTasting), so two leaders switching at once can't leave two beers current
 */
export async function makeBeerCurrent(
  tx: Prisma.TransactionClient,
  tastingId: string,
  tastingBeerId: string
): Promise<MakeCurrentResult> {
  const tastingBeer = await tx.tastingBeer.findUnique({
    where: { id: tastingBeerId }
  })
  if (!tastingBeer || tastingBeer.tastingId !== tastingId) {
    return { ok: false, error: 'Beer not found', status: 404 }
  }
  if (tastingBeer.status !== 'untasted') {
    return { ok: false, error: 'Beer must be untasted to set as current', status: 400 }
  }

  const oldCurrent = await tx.tastingBeer.findFirst({
    where: { tastingId, status: 'current' },
    include: { _count: { select: { ratings: true } } }
  })

  if (oldCurrent) {
    // Back to untasted would leak its scores (no longer the hidden beer) and lock out anyone
    // who hadn't rated it yet, so a beer people have rated has to be finished instead
    if (oldCurrent._count.ratings > 0) {
      return { ok: false, error: 'Ljúktu núverandi bjór fyrst, það er búið að gefa honum einkunn', status: 409 }
    }
    await tx.tastingBeer.update({
      where: { id: oldCurrent.id },
      data: { status: 'untasted' }
    })
  }

  // Set new current beer and record when it became current
  await tx.tastingBeer.update({
    where: { id: tastingBeerId },
    data: {
      status: 'current',
      currentSince: new Date()
    }
  })

  // Update tasting with new current beer and increment version
  const tasting = await tx.tasting.update({
    where: { id: tastingId },
    data: {
      currentTastingBeerId: tastingBeerId,
      version: { increment: 1 }
    }
  })

  return { ok: true, version: tasting.version }
}
