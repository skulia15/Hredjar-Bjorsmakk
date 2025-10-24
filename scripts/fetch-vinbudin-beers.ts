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
  description?: string
  country?: string
}

/**
 * Fetch detailed beer information from individual product page
 */
async function fetchBeerDetails(page: any, productUrl: string, productNumber: string) {
  try {
    await page.goto(productUrl, { waitUntil: 'networkidle', timeout: 30000 })

    const details = await page.evaluate(() => {
      const result: any = {}

      // Try to find ABV in various locations
      const detailsText = document.body.innerText
      const abvMatch = detailsText.match(/(\d+[,.]\d+)\s*%\s*vol/i) ||
                       detailsText.match(/Alcohol.*?(\d+[,.]\d+)\s*%/i) ||
                       detailsText.match(/(\d+[,.]\d+)\s*%/i)
      if (abvMatch) {
        result.abv = parseFloat(abvMatch[1].replace(',', '.'))
      }

      // Find container size and type
      const sizeMatch = detailsText.match(/(\d+)\s*ml/i) || detailsText.match(/(\d+)\s*cl/i)
      if (sizeMatch) {
        let size = parseInt(sizeMatch[1])
        // Convert cl to ml if needed
        if (detailsText.match(/\d+\s*cl/i)) {
          size = size * 10
        }
        result.containerSize = size
      }

      // Determine container type from text - look specifically for "Umbúðir" label
      const containerMatch = detailsText.match(/Umbúðir[:\s]+([^\n\r]+)/i)
      if (containerMatch) {
        const containerText = containerMatch[1].toLowerCase()
        if (containerText.includes('dós') || containerText.includes('áldós')) {
          result.containerType = 'Can'
        } else if (containerText.includes('flaska') || containerText.includes('glerflaska')) {
          result.containerType = 'Bottle'
        }
      } else {
        // Fallback to general text search
        const textLower = detailsText.toLowerCase()
        if (textLower.includes('áldós') || textLower.includes('dós')) {
          result.containerType = 'Can'
        } else if (textLower.includes('glerflaska') || textLower.includes('flaska')) {
          result.containerType = 'Bottle'
        }
      }

      // Extract description
      const descSelectors = [
        '.product-description',
        '.description',
        '[class*="description"]',
        'p[class*="text"]'
      ]

      for (const selector of descSelectors) {
        const descEl = document.querySelector(selector)
        if (descEl && descEl.textContent && descEl.textContent.trim().length > 20) {
          result.description = descEl.textContent.trim()
          break
        }
      }

      // Extract country
      const countryMatch = detailsText.match(/Land[:\s]+([A-ZÁ-Ý][a-zá-ý]+)/i) ||
                          detailsText.match(/Country[:\s]+([A-Z][a-z]+)/i) ||
                          detailsText.match(/Upprunaland[:\s]+([A-ZÁ-Ý][a-zá-ý]+)/i)
      if (countryMatch) {
        result.country = countryMatch[1].trim()
      }

      return result
    })

    console.log(`    Detailed info for #${productNumber}: ABV=${details.abv || 'N/A'}, Size=${details.containerSize || 'N/A'}ml, Type=${details.containerType || 'N/A'}`)
    return details
  } catch (error) {
    console.error(`    ⚠️  Failed to fetch details for product ${productNumber}:`, error)
    return {}
  }
}

async function fetchBeersFromVinbudin(): Promise<VinbudinBeer[]> {
  console.log('🔍 Sæki bjóra frá Vínbúðinni...')

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  const allBeers: VinbudinBeer[] = []
  let currentPage = 1
  let hasMorePages = true

  while (hasMorePages) {
    // Navigate to page
    const url = currentPage === 1
      ? 'https://www.vinbudin.is/heim/vorur/vorur?season=J%C3%93L&category=beer'
      : `https://www.vinbudin.is/heim/vorur/vorur?season=J%C3%93L&category=beer&page=${currentPage}`

    console.log(`📄 Opna síðu ${currentPage}: ${url}`)
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 60000
    })

    // Wait for products to load
    console.log('⏳ Bíð eftir að vörur hlaðist...')
    try {
      await page.waitForSelector('.product-item, .product, [data-product], .productbox, .item', {
        timeout: 30000
      })
    } catch (e) {
      console.log('⚠️  Gat ekki fundið vöruval með venjulegum selectors')
      // Take screenshot for debugging
      await page.screenshot({ path: `/tmp/vinbudin-debug-page${currentPage}.png` })
      console.log(`📸 Screenshot vistuð í /tmp/vinbudin-debug-page${currentPage}.png`)
      break
    }

    // Extract beer data from current page
    const pageBeers = await page.evaluate(() => {
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

        // Extract numeric product ID from URL (not SKU codes)
        // URL format: /stoek-vara.aspx/?productid=21582/
        const productNumberMatch = url.match(/productid=(\d+)/i)
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

    console.log(`  ✓ Fann ${pageBeers.length} bjóra á síðu ${currentPage}`)

    // Fetch detailed information for each beer
    console.log(`  📋 Sæki nákvæmar upplýsingar fyrir ${pageBeers.length} bjóra...`)
    for (const beer of pageBeers) {
      if (beer.productNumber && beer.vinbudinUrl) {
        const details = await fetchBeerDetails(page, beer.vinbudinUrl, beer.productNumber)

        // Merge detailed info, prioritizing scraped details over name parsing
        if (details.abv !== undefined) beer.abv = details.abv
        if (details.containerSize !== undefined) beer.containerSize = details.containerSize
        if (details.containerType !== undefined) beer.containerType = details.containerType
        if (details.description) beer.description = details.description
        if (details.country) beer.country = details.country

        // Small delay to avoid hammering the server
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    allBeers.push(...pageBeers)

    // If no beers found on this page, we've reached the end
    if (pageBeers.length === 0) {
      console.log('  ℹ️  Engar fleiri vörur - náðum enda')
      hasMorePages = false
    } else {
      // Try next page
      currentPage++
    }
  }

  await browser.close()

  console.log(`\n✅ Fann ${allBeers.length} bjóra samtals á ${currentPage} síðu${currentPage > 1 ? 'm' : ''}`)
  return allBeers
}

async function importBeers(beers: VinbudinBeer[]) {
  console.log('\n📥 Flyt inn bjóra í gagnagrunn...')

  // Get existing beers to avoid duplicates
  const existingBeers = await prisma.beer.findMany({
    select: {
      name: true,
      brewery: true,
      containerSize: true,
      containerType: true,
      productNumber: true
    }
  })

  // Create unique key including packaging details
  const existingSet = new Set(
    existingBeers.map(b =>
      `${b.name.toLowerCase()}|${b.brewery.toLowerCase()}|${b.containerSize || 'null'}|${b.containerType || 'null'}`
    )
  )
  const existingProductNumbers = new Set(
    existingBeers.map(b => b.productNumber).filter(Boolean)
  )

  const newBeers = beers.filter(beer => {
    const key = `${beer.name.toLowerCase()}|${beer.brewery.toLowerCase()}|${beer.containerSize || 'null'}|${beer.containerType || 'null'}`
    const existsByPackaging = existingSet.has(key)
    const existsByProductNumber = beer.productNumber && existingProductNumbers.has(beer.productNumber)

    return !existsByPackaging && !existsByProductNumber
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
          description: beer.description || null,
          country: beer.country || 'Iceland'
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
    // Check for dry-run flag
    const isDryRun = process.argv.includes('--dry-run') || process.argv.includes('-d')

    if (isDryRun) {
      console.log('🔍 DRY RUN MODE - engar breytingar verða gerðar á gagnagrunninum\n')
    }

    const beers = await fetchBeersFromVinbudin()

    if (beers.length === 0) {
      console.log('\n⚠️  Engir bjórar fundust. Vinsamlegast athugaðu:')
      console.log('  1. Að síðan sé rétt')
      console.log('  2. Að vöruval sé til staðar')
      console.log('  3. Screenshot í /tmp/vinbudin-debug.png')
      process.exit(1)
    }

    if (isDryRun) {
      await dryRunImport(beers)
    } else {
      await importBeers(beers)
    }

    console.log('\n✨ Lokið!')
    await prisma.$disconnect()
  } catch (error) {
    console.error('\n❌ Villa:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

async function dryRunImport(beers: VinbudinBeer[]) {
  console.log('\n📊 DRY RUN - Sýni hvað myndi gerast:\n')

  // Get existing beers to avoid duplicates
  const existingBeers = await prisma.beer.findMany({
    select: {
      name: true,
      brewery: true,
      containerSize: true,
      containerType: true,
      productNumber: true
    }
  })

  // Create unique key including packaging details
  const existingSet = new Set(
    existingBeers.map(b =>
      `${b.name.toLowerCase()}|${b.brewery.toLowerCase()}|${b.containerSize || 'null'}|${b.containerType || 'null'}`
    )
  )
  const existingProductNumbers = new Set(
    existingBeers.map(b => b.productNumber).filter(Boolean)
  )

  const newBeers = beers.filter(beer => {
    const key = `${beer.name.toLowerCase()}|${beer.brewery.toLowerCase()}|${beer.containerSize || 'null'}|${beer.containerType || 'null'}`
    const existsByPackaging = existingSet.has(key)
    const existsByProductNumber = beer.productNumber && existingProductNumbers.has(beer.productNumber)

    return !existsByPackaging && !existsByProductNumber
  })

  console.log(`📈 Samantekt:`)
  console.log(`  • ${beers.length} bjórar fundust á Vínbúðinni`)
  console.log(`  • ${beers.length - newBeers.length} bjórar eru þegar í gagnagrunninum`)
  console.log(`  • ${newBeers.length} nýjir bjórar yrðu bættir við\n`)

  if (newBeers.length > 0) {
    console.log('📋 Nýir bjórar sem yrðu bættir við:\n')
    newBeers.forEach((beer, index) => {
      console.log(`${index + 1}. ${beer.name} - ${beer.brewery}`)
      console.log(`   Verð: ${beer.priceISK} kr`)
      if (beer.abv) console.log(`   ABV: ${beer.abv}%`)
      if (beer.productNumber) console.log(`   Vörunúmer: ${beer.productNumber}`)
      if (beer.containerSize && beer.containerType) {
        console.log(`   Umbúðir: ${beer.containerSize}ml ${beer.containerType}`)
      }
      if (beer.country) console.log(`   Land: ${beer.country}`)
      if (beer.style) console.log(`   Stíll: ${beer.style}`)
      if (beer.description) console.log(`   Lýsing: ${beer.description.substring(0, 100)}${beer.description.length > 100 ? '...' : ''}`)
      console.log(`   URL: ${beer.vinbudinUrl}`)
      if (beer.imageUrl) console.log(`   Mynd: ${beer.imageUrl}`)
      console.log('')
    })
  } else {
    console.log('✅ Allir bjórar eru þegar í gagnagrunninum - ekkert að gera!\n')
  }

  console.log('💡 Til að flytja inn í raun og veru, keyrðu án --dry-run flaggsins')
}

main()
