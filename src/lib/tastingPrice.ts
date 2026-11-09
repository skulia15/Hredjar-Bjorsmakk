import type { Prisma } from '@/generated/prisma/client'

type Price = { priceISK: number | null; pricePerLiter: number | null }

/**
 * What a tasting beer cost on the night. Its own snapshot always wins. While the tasting is open,
 * a price the catalog didn't have when the beer was added is filled in from the catalog; once it's
 * closed only the snapshot counts (gaps are frozen in at close), so next year's catalog sync can't
 * rewrite an old tasting's prices.
 */
export function tastingBeerPrice(
  tastingBeer: Price & { beer: Price | null },
  tastingStatus: string
): Price {
  if (tastingStatus === 'closed') {
    return { priceISK: tastingBeer.priceISK, pricePerLiter: tastingBeer.pricePerLiter }
  }
  return {
    priceISK: tastingBeer.priceISK ?? tastingBeer.beer?.priceISK ?? null,
    pricePerLiter: tastingBeer.pricePerLiter ?? tastingBeer.beer?.pricePerLiter ?? null,
  }
}

/** On close: fill each beer's missing price from the catalog as it stands now, then it's fixed */
export async function freezeTastingPrices(tx: Prisma.TransactionClient, tastingId: string) {
  await tx.$executeRaw`
    UPDATE "TastingBeer" tb
    SET "priceISK" = COALESCE(tb."priceISK", b."priceISK"),
        "pricePerLiter" = COALESCE(tb."pricePerLiter", b."pricePerLiter")
    FROM "Beer" b
    WHERE tb."beerId" = b.id AND tb."tastingId" = ${tastingId}
      AND (tb."priceISK" IS NULL OR tb."pricePerLiter" IS NULL)`
}
