/**
 * Sync Christmas beers with Vínbúðin
 * - Fetches all Christmas (JÓL) beers from Vínbúðin's JSON search API
 * - Updates price, price per liter, product URL and image on existing beers
 * - Fills in missing metadata (brewery, size, container, ABV, country, styles) without overwriting curated values
 * - Adds beers that are missing
 * - Never removes beers
 * Run with: DATABASE_URL="your-db-url" npx tsx scripts/sync-all-beers-with-vinbudin.ts [--dry-run]
 */

import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

const BASE_URL = 'https://www.vinbudin.is'
const SEARCH_URL = `${BASE_URL}/addons/origo/module/ajaxwebservices/search.asmx/DoSearch`
const PAGE_SIZE = 100
// Older rows were seeded with this as a placeholder brewery and "Iceland" as placeholder country
const PLACEHOLDER_BREWERY = 'Vínbúðin'

interface VinbudinProduct {
  ProductID: number
  ProductName: string
  ProductProducer: string
  ProductBottledVolume: number
  ProductAlchoholVolume: number
  ProductPrice: number
  ProductCountryOfOrigin: string
  ProductContainerType: string
}

interface VinbudinBeer {
  productNumber: string
  name: string
  brewery: string
  containerSize: number
  containerType: string
  priceISK: number
  pricePerLiter: number
  abv: number
  country: string
  vinbudinUrl: string
  imageUrl: string
}

const CONTAINER_TYPES: Record<string, string> = {
  'DS.': 'Dós',
  'FL.': 'Flaska',
  ASKJA: 'Askja',
}

function capitalize(value: string) {
  return value.charAt(0).toLocaleUpperCase('is') + value.slice(1)
}

// DB has e.g. "07499" while the API returns 7499
function normalizeProductNumber(value: string | null) {
  return value?.replace(/^0+/, '') ?? ''
}

function toBeer(product: VinbudinProduct): VinbudinBeer {
  const productNumber = String(product.ProductID)
  return {
    productNumber,
    name: product.ProductName.trim(),
    brewery: product.ProductProducer.trim(),
    containerSize: Math.round(product.ProductBottledVolume),
    containerType: CONTAINER_TYPES[product.ProductContainerType] ?? product.ProductContainerType,
    priceISK: product.ProductPrice,
    pricePerLiter: Math.round((product.ProductPrice / product.ProductBottledVolume) * 1000),
    abv: product.ProductAlchoholVolume,
    country: capitalize(product.ProductCountryOfOrigin.trim()),
    vinbudinUrl: `${BASE_URL}/desktopdefault.aspx/tabid-54/?productID=${productNumber}/`,
    imageUrl: `${BASE_URL}/Portaldata/1/Resources/vorumyndir/medium/${productNumber}_r.jpg`,
  }
}

async function fetchChristmasBeers(): Promise<VinbudinBeer[]> {
  const products: VinbudinProduct[] = []
  let total = Infinity

  while (products.length < total) {
    const params = new URLSearchParams({
      category: 'beer',
      season: 'JÓL',
      skip: String(products.length),
      count: String(PAGE_SIZE),
      orderBy: 'name asc',
    })
    const res = await fetch(`${SEARCH_URL}?${params}`, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
    if (!res.ok) throw new Error(`Vínbúðin search failed: ${res.status} ${res.statusText}`)

    // ASMX wraps the payload as a JSON string in "d"
    const body = (await res.json()) as { d: string }
    const page = JSON.parse(body.d) as { total: number; data: VinbudinProduct[] }
    total = page.total
    if (page.data.length === 0) break
    products.push(...page.data)
  }

  return products.map(toBeer)
}

// Styles only live in the server-rendered product page, e.g.
// <span class="text">- Annar lager</span><span class="text taste2">- Bock</span>
async function fetchStyles(productNumber: string): Promise<string[]> {
  const res = await fetch(`${BASE_URL}/heim/vorur/stoek-vara.aspx/?productid=${productNumber}`)
  if (!res.ok) return []
  const html = await res.text()
  const start = html.indexOf('class="taste')
  if (start === -1) return []
  const tasteBlock = html.slice(start, start + 1000)
  const styles = [...tasteBlock.matchAll(/<span class="text(?: taste2)?">-\s*([^<]+)<\/span>/g)]
    .flatMap((m) => m[1].split(','))
    .map((s) => s.trim())
    .filter(Boolean)
  return [...new Set(styles)]
}

async function syncBeers(vinbudinBeers: VinbudinBeer[], dryRun: boolean) {
  const existingBeers = await prisma.beer.findMany()
  const byProductNumber = new Map(
    existingBeers
      .filter((b) => b.productNumber)
      .map((b) => [normalizeProductNumber(b.productNumber), b])
  )

  let added = 0
  let updated = 0
  let unchanged = 0
  const errors: string[] = []
  const deferred: { id: string; data: Record<string, unknown>; label: string }[] = []

  for (const vinBeer of vinbudinBeers) {
    const label = `${vinBeer.name} (${vinBeer.brewery}) - ${vinBeer.containerSize}ml ${vinBeer.containerType} #${vinBeer.productNumber}`

    // Fall back to the unique key for rows that were seeded with a made-up SKU
    const existing =
      byProductNumber.get(vinBeer.productNumber) ??
      existingBeers.find(
        (b) =>
          b.name.toLowerCase() === vinBeer.name.toLowerCase() &&
          b.brewery === vinBeer.brewery &&
          b.containerSize === vinBeer.containerSize &&
          b.containerType === vinBeer.containerType
      )

    try {
      if (!existing) {
        const styles = await fetchStyles(vinBeer.productNumber)
        console.log(`➕ ADD: ${label}, ${vinBeer.priceISK} kr${styles.length ? `, ${styles.join(' / ')}` : ''}`)
        if (!dryRun) {
          await prisma.beer.create({ data: { ...vinBeer, styles } })
        }
        added++
        continue
      }

      const isPlaceholder = existing.brewery === PLACEHOLDER_BREWERY
      const data: Record<string, unknown> = {}
      const changes: string[] = []
      const set = (field: string, from: unknown, to: unknown) => {
        if (from === to) return
        data[field] = to
        changes.push(`${field}: ${from ?? '∅'} → ${to}`)
      }

      // Always refresh pricing and links
      set('priceISK', existing.priceISK, vinBeer.priceISK)
      set('pricePerLiter', existing.pricePerLiter, vinBeer.pricePerLiter)
      set('productNumber', existing.productNumber, vinBeer.productNumber)
      set('vinbudinUrl', existing.vinbudinUrl, vinBeer.vinbudinUrl)
      if (!existing.imageUrl) set('imageUrl', existing.imageUrl, vinBeer.imageUrl)

      // Vínbúðin is authoritative on packaging (older scrapes stored wrong sizes)
      set('containerSize', existing.containerSize, vinBeer.containerSize)
      set('containerType', existing.containerType, vinBeer.containerType)

      // Only fill gaps - keep curated names, breweries and styles
      if (isPlaceholder) set('brewery', existing.brewery, vinBeer.brewery)
      if (existing.abv == null) set('abv', existing.abv, vinBeer.abv)
      if (!existing.country || isPlaceholder) set('country', existing.country, vinBeer.country)
      if (existing.styles.length === 0) {
        const styles = await fetchStyles(vinBeer.productNumber)
        if (styles.length > 0) {
          data.styles = styles
          changes.push(`styles: ∅ → ${styles.join(' / ')}`)
        }
      }

      if (changes.length === 0) {
        unchanged++
        continue
      }

      console.log(`🔧 UPDATE: ${existing.name} (${existing.brewery}) #${vinBeer.productNumber}`)
      changes.forEach((c) => console.log(`   ${c}`))
      if (!dryRun) {
        await prisma.beer.update({ where: { id: existing.id }, data }).catch((err) => {
          // Packaging fixes can swap keys between rows - retry once the other row has moved
          if (err?.code !== 'P2002') throw err
          console.log('   ↪ packaging key held by another row, retrying after the rest')
          deferred.push({ id: existing.id, data, label })
        })
      }
      updated++
    } catch (err) {
      errors.push(`${label}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  for (const { id, data, label } of deferred) {
    try {
      await prisma.beer.update({ where: { id }, data })
    } catch (err) {
      updated--
      errors.push(`${label}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const syncedIds = new Set(vinbudinBeers.map((b) => b.productNumber))
  const notOnVinbudin = existingBeers.filter((b) => !syncedIds.has(normalizeProductNumber(b.productNumber)))

  console.log(`\n📊 Summary:`)
  console.log(`   Added: ${added}`)
  console.log(`   Updated: ${updated}`)
  console.log(`   Unchanged: ${unchanged}`)
  console.log(`   Kept (not in Vínbúðin Christmas list): ${notOnVinbudin.length}`)
  if (errors.length > 0) {
    console.log(`   Errors: ${errors.length}`)
    errors.forEach((e) => console.log(`     - ${e}`))
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run') || process.argv.includes('-d')
  if (dryRun) console.log('🔍 DRY RUN MODE - no changes will be made\n')

  try {
    console.log('🔍 Fetching Christmas beers from Vínbúðin...')
    const vinbudinBeers = await fetchChristmasBeers()
    console.log(`✅ Found ${vinbudinBeers.length} beers\n`)

    await syncBeers(vinbudinBeers, dryRun)
    console.log('\n✨ Done!')
  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

main()
