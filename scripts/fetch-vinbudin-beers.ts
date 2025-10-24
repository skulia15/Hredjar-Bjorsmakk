/**
 * Local development script to fetch Christmas beers from Vínbúðin
 * Run with: DATABASE_URL="your-db-url" npx tsx scripts/fetch-vinbudin-beers.ts
 *
 * This requires Playwright browser to be installed locally:
 * npx playwright install chromium
 */

import { chromium } from 'playwright'
import { prisma } from '../src/lib/prisma'

interface VinbudinBeer {
  name: string
  brewery: string
  productNumber: string
  priceISK: number
  vinbudinUrl: string
  abv?: number
  containerSize?: number
  containerType?: string
  style?: string
  imageUrl?: string
}

async function fetchBeersFromVinbudin(): Promise<VinbudinBeer[]> {
  console.log('🔍 Sæki bjóra frá Vínbúðinni...')

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  // Navigate to Christmas beer page
  console.log('📄 Opna síðu: https://www.vinbudin.is/heim/vorur/vorur?season=JÓL&category=beer')
  await page.goto('https://www.vinbudin.is/heim/vorur/vorur?season=J%C3%93L&category=beer', {
    waitUntil: 'networkidle',
    timeout: 60000
  })

  // Wait for products to load - try multiple selectors
  console.log('⏳ Bíð eftir að vörur hlaðist...')
  try {
    await page.waitForSelector('.product-item, .product, [data-product], .productbox, .item', {
      timeout: 30000
    })
  } catch (e) {
    console.log('⚠️  Gat ekki fundið vöruval með venjulegum selectors')
    // Take screenshot for debugging
    await page.screenshot({ path: '/tmp/vinbudin-debug.png' })
    console.log('📸 Screenshot vistuð í /tmp/vinbudin-debug.png')
  }

  // Extract beer data
  const beers = await page.evaluate(() => {
    const products: any[] = []

    // Try multiple selector patterns
    const selectors = [
      '.product-item',
      '.product',
      '[data-product]',
      '.productbox',
      '.item',
      'article',
      '[data-productid]'
    ]

    let productElements: NodeListOf<Element> | null = null
    for (const selector of selectors) {
      productElements = document.querySelectorAll(selector)
      if (productElements && productElements.length > 0) {
        console.log(`Fann ${productElements.length} vörur með selector: ${selector}`)
        break
      }
    }

    if (!productElements || productElements.length === 0) {
      console.log('Engar vörur fundust')
      return []
    }

    productElements.forEach((element) => {
      try {
        // Try multiple patterns for product data
        const nameEl = element.querySelector('.product-name, .productname, h3, h4, .title, .name, [data-name]')
        const priceEl = element.querySelector('.price, .productprice, .product-price, [data-price]')
        const linkEl = element.querySelector('a[href*="productid"], a[href*="product"], a[href*="stoek-vara"]')
        const imageEl = element.querySelector('img')

        if (!nameEl || !priceEl) return

        const name = nameEl.textContent?.trim() || ''
        const priceText = priceEl.textContent?.trim() || '0'
        const price = parseFloat(priceText.replace(/[^\d,]/g, '').replace(',', '.'))
        const url = linkEl?.getAttribute('href') || ''
        const imageUrl = imageEl?.getAttribute('src') || imageEl?.getAttribute('data-src') || ''

        // Extract product number from URL or data attribute
        const productNumberMatch = url.match(/productid[=/](\d+)/i) ||
                                  element.getAttribute('data-product-id')?.match(/(\d+)/) ||
                                  element.getAttribute('data-productid')?.match(/(\d+)/)
        const productNumber = productNumberMatch?.[1] || ''

        // Parse brewery and beer name
        let brewery = 'Vínbúðin'
        let beerName = name

        if (name.includes('-')) {
          const parts = name.split('-').map(p => p.trim())
          if (parts.length >= 2) {
            brewery = parts[0]
            beerName = parts.slice(1).join(' - ')
          }
        } else if (name.includes(',')) {
          const parts = name.split(',').map(p => p.trim())
          if (parts.length >= 2) {
            beerName = parts[0]
            brewery = parts[1]
          }
        }

        // Extract ABV from name
        const abvMatch = name.match(/(\d+(?:[,.]\d+)?)\s*%/)
        const abv = abvMatch ? parseFloat(abvMatch[1].replace(',', '.')) : undefined

        // Extract container size
        const sizeMatch = name.match(/(\d+)\s*ml/i) || name.match(/(\d+)\s*cl/i)
        const containerSize = sizeMatch ? parseInt(sizeMatch[1]) : undefined

        // Determine container type
        let containerType: string | undefined
        if (name.toLowerCase().includes('dós') || name.toLowerCase().includes('can')) {
          containerType = 'Can'
        } else if (name.toLowerCase().includes('flaska') || name.toLowerCase().includes('bottle')) {
          containerType = 'Bottle'
        }

        if (beerName && price > 0) {
          products.push({
            name: beerName,
            brewery,
            productNumber,
            priceISK: price,
            vinbudinUrl: url.startsWith('http') ? url : `https://www.vinbudin.is${url}`,
            abv,
            containerSize,
            containerType,
            imageUrl: imageUrl.startsWith('http') ? imageUrl : imageUrl ? `https://www.vinbudin.is${imageUrl}` : undefined,
            style: name.toLowerCase().includes('jól') || name.toLowerCase().includes('christmas') ? 'Christmas Beer' : undefined
          })
        }
      } catch (err) {
        console.error('Villa við að vinna vöru:', err)
      }
    })

    return products
  })

  await browser.close()

  console.log(`✅ Fann ${beers.length} bjóra á Vínbúðinni`)
  return beers
}

async function importBeers(beers: VinbudinBeer[]) {
  console.log('\n📥 Flyt inn bjóra í gagnagrunn...')

  // Get existing beers to avoid duplicates
  const existingBeers = await prisma.beer.findMany({
    select: {
      name: true,
      brewery: true,
      productNumber: true
    }
  })

  const existingSet = new Set(
    existingBeers.map(b => `${b.name.toLowerCase()}|${b.brewery.toLowerCase()}`)
  )
  const existingProductNumbers = new Set(
    existingBeers.map(b => b.productNumber).filter(Boolean)
  )

  const newBeers = beers.filter(beer => {
    const key = `${beer.name.toLowerCase()}|${beer.brewery.toLowerCase()}`
    const existsByName = existingSet.has(key)
    const existsByProductNumber = beer.productNumber && existingProductNumbers.has(beer.productNumber)

    return !existsByName && !existsByProductNumber
  })

  console.log(`ℹ️  ${beers.length} bjórar samtals`)
  console.log(`ℹ️  ${beers.length - newBeers.length} bjórar þegar til í gagnagrunni`)
  console.log(`ℹ️  ${newBeers.length} nýjir bjórar verða bættir við`)

  let added = 0
  const errors: string[] = []

  for (const beer of newBeers) {
    try {
      await prisma.beer.create({
        data: {
          name: beer.name,
          brewery: beer.brewery,
          productNumber: beer.productNumber || null,
          priceISK: beer.priceISK,
          vinbudinUrl: beer.vinbudinUrl || null,
          abv: beer.abv || null,
          containerSize: beer.containerSize || null,
          containerType: beer.containerType || null,
          style: beer.style || null,
          imageUrl: beer.imageUrl || null,
          country: 'Iceland'
        }
      })
      added++
      console.log(`  ✓ ${beer.name} - ${beer.brewery}`)
    } catch (err: any) {
      console.error(`  ✗ ${beer.name}: ${err.message}`)
      errors.push(`${beer.name}: ${err.message}`)
    }
  }

  console.log(`\n✅ ${added} bjórar bættir við`)
  if (errors.length > 0) {
    console.log(`⚠️  ${errors.length} villur:`)
    errors.forEach(e => console.log(`  - ${e}`))
  }
}

async function main() {
  try {
    const beers = await fetchBeersFromVinbudin()

    if (beers.length === 0) {
      console.log('\n⚠️  Engir bjórar fundust. Vinsamlegast athugaðu:')
      console.log('  1. Að síðan sé rétt')
      console.log('  2. Að vöruval sé til staðar')
      console.log('  3. Screenshot í /tmp/vinbudin-debug.png')
      process.exit(1)
    }

    await importBeers(beers)

    console.log('\n✨ Lokið!')
    await prisma.$disconnect()
  } catch (error) {
    console.error('\n❌ Villa:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

main()
