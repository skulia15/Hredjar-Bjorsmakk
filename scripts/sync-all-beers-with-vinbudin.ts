/**
 * Comprehensive script to sync all beers with Vínbúðin
 * - Fetches all Christmas beers from Vínbúðin
 * - Updates container size, price, and image URL
 * - Adds missing beers
 * Run with: DATABASE_URL="your-db-url" npx tsx scripts/sync-all-beers-with-vinbudin.ts
 */

import { chromium } from 'playwright'
import { prisma } from '../src/lib/prisma'

interface VinbudinBeer {
  productNumber: string
  name: string
  brewery: string
  vinbudinUrl: string
  containerSize: number
  containerType: string
  priceISK: number
  pricePerLiter?: number
  imageUrl?: string
  abv?: number
  styles?: string[]
  description?: string
  country?: string
}

async function fetchBeerDetails(page: any, productUrl: string, productNumber: string): Promise<Partial<VinbudinBeer>> {
  try {
    await page.goto(productUrl, { waitUntil: 'networkidle', timeout: 30000 })

    const details = await page.evaluate(() => {
      const result: any = {}
      const detailsText = document.body.innerText

      // Get ABV
      const abvEl = document.querySelector('#ctl00_ctl01_Label_ProductAlchoholVolume')
      if (abvEl && abvEl.textContent) {
        const abvValue = parseFloat(abvEl.textContent.trim().replace(',', '.'))
        if (!isNaN(abvValue)) result.abv = abvValue
      }

      // Get container size - use specific patterns to avoid matching "also available in" text
      // Priority 1: Look for "Eining XXX ml" pattern (most reliable)
      let sizeMatch = detailsText.match(/Eining[:\s]+(\d+)\s*ml/i)

      // Priority 2: Look for "Umbúðastærð: XXX ml"
      if (!sizeMatch) {
        sizeMatch = detailsText.match(/Umbúðastærð[:\s]+(\d+)\s*ml/i)
      }

      // Priority 3: Look for "XXX ml |" pattern (from product header)
      if (!sizeMatch) {
        sizeMatch = detailsText.match(/(\d+)\s*ml\s*\|/i)
      }

      if (sizeMatch) {
        result.containerSize = parseInt(sizeMatch[1])
      }

      // Get container type
      const containerMatch = detailsText.match(/Umbúðir[:\s]+([^\n\r]+)/i)
      if (containerMatch) {
        const containerText = containerMatch[1].toLowerCase()
        if (containerText.includes('dós') || containerText.includes('áldós')) {
          result.containerType = 'Dós'
        } else if (containerText.includes('flaska') || containerText.includes('glerflaska')) {
          result.containerType = 'Flaska'
        }
      }

      // Get price from specific element (primary)
      const priceEl = document.querySelector('#ctl00_ctl01_Label_ProductPrice')
      if (priceEl && priceEl.textContent) {
        const priceValue = parseFloat(priceEl.textContent.trim().replace(/\./g, '').replace(',', '.'))
        if (!isNaN(priceValue)) result.priceISK = priceValue
      }

      // Fallback to regex if element not found
      if (!result.priceISK) {
        const priceMatch = detailsText.match(/(\d+(?:[.,]\d+)?)\s*kr/i)
        if (priceMatch) {
          result.priceISK = parseFloat(priceMatch[1].replace(/\./g, '').replace(',', '.'))
        }
      }

      // Get price per liter from specific element
      const pricePerLiterEl = document.querySelector('#ctl00_ctl01_Label_PricePerLiter')
      if (pricePerLiterEl && pricePerLiterEl.textContent) {
        // Format: "Lítraverð 1.300" - extract the number
        const pricePerLiterMatch = pricePerLiterEl.textContent.match(/(\d+(?:[.,]\d+)?)/)
        if (pricePerLiterMatch) {
          const pricePerLiterValue = parseFloat(pricePerLiterMatch[1].replace(/\./g, '').replace(',', '.'))
          if (!isNaN(pricePerLiterValue)) result.pricePerLiter = pricePerLiterValue
        }
      }

      // Get brewery
      const breweryEl = document.querySelector('#ctl00_ctl01_Label_Producer')
      if (breweryEl && breweryEl.textContent) {
        result.brewery = breweryEl.textContent.trim()
      }

      // Get image URL from the medium-sized image in .img-wrapper
      const imageEl = document.querySelector('#first_image')
      if (imageEl) {
        const src = imageEl.getAttribute('src')
        if (src && !src.includes('placeholder')) {
          result.imageUrl = src.startsWith('http') ? src : `https://www.vinbudin.is${src}`
        }
      }

      // Fallback to other image selectors if first_image not found
      if (!result.imageUrl) {
        const fallbackImageEl = document.querySelector('img[src*="productimage"], .product-image img, img[alt]')
        if (fallbackImageEl) {
          const src = fallbackImageEl.getAttribute('src')
          if (src && !src.includes('placeholder')) {
            result.imageUrl = src.startsWith('http') ? src : `https://www.vinbudin.is${src}`
          }
        }
      }

      // Get country
      const countryMatch = detailsText.match(/Land[:\s]+([A-ZÁ-Ý][a-zá-ý]+)/i) ||
                          detailsText.match(/Upprunaland[:\s]+([A-ZÁ-Ý][a-zá-ý]+)/i)
      if (countryMatch) {
        result.country = countryMatch[1].trim()
      }

      // Get styles
      const tasteEl = document.querySelector('.taste')
      if (tasteEl) {
        const textSpans = tasteEl.querySelectorAll('.text')
        const styles: string[] = []
        textSpans.forEach(span => {
          const text = span.textContent?.trim()
          if (text && text.startsWith('- ')) {
            const styleParts = text.substring(2).split(',').map(s => s.trim()).filter(s => s)
            styles.push(...styleParts)
          }
        })
        if (styles.length > 0) result.styles = styles
      }

      return result
    })

    return details
  } catch (error) {
    console.error(`    ⚠️  Failed to fetch details for #${productNumber}:`, error)
    return {}
  }
}

async function fetchAllBeersFromVinbudin(): Promise<VinbudinBeer[]> {
  console.log('🔍 Fetching all Christmas beers from Vínbúðin...\n')

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  const allBeers: Partial<VinbudinBeer>[] = []
  let currentPage = 1
  let hasMorePages = true

  while (hasMorePages) {
    const url = currentPage === 1
      ? 'https://www.vinbudin.is/heim/vorur/vorur?season=J%C3%93L&category=beer'
      : `https://www.vinbudin.is/heim/vorur/vorur?season=J%C3%93L&category=beer&page=${currentPage}`

    console.log(`📄 Page ${currentPage}: ${url}`)
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })

    try {
      await page.waitForSelector('.product-item, .product, [data-product]', { timeout: 30000 })
    } catch {
      console.log('  ⚠️  No products found, stopping')
      break
    }

    const pageBeers = await page.evaluate(() => {
      const products: any[] = []
      const selectors = ['.product-item', '.product', '[data-product]', '.productbox', 'article']

      let productElements: NodeListOf<Element> | null = null
      for (const selector of selectors) {
        productElements = document.querySelectorAll(selector)
        if (productElements && productElements.length > 0) break
      }

      if (!productElements || productElements.length === 0) return []

      productElements.forEach((element) => {
        try {
          const nameEl = element.querySelector('.product-name, .productname, h3, h4, .title, .name, [class*=\"name\"]')
          const priceEl = element.querySelector('.price, .productprice, .product-price, [class*=\"price\"]')
          const linkEl = element.querySelector('a[href*="productid"], a[href*="product"], a[href*="stoek-vara"]')
          const imageEl = element.querySelector('img')

          const name = nameEl?.textContent?.trim() || ''
          const priceText = priceEl?.textContent?.trim() || '0'
          const price = parseFloat(priceText.replace(/[^\d,]/g, '').replace(',', '.'))
          const url = linkEl?.getAttribute('href') || ''
          const productNumberMatch = url.match(/productid=(\d+)/i)
          const productNumber = productNumberMatch?.[1] || ''
          const imageUrl = imageEl?.getAttribute('src') || imageEl?.getAttribute('data-src') || ''

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

          if (beerName && productNumber) {
            products.push({
              name: beerName,
              brewery,
              productNumber,
              priceISK: price || 0,
              vinbudinUrl: url.startsWith('http') ? url : `https://www.vinbudin.is${url}`,
              imageUrl: imageUrl.startsWith('http') ? imageUrl : imageUrl ? `https://www.vinbudin.is${imageUrl}` : undefined
            })
          }
        } catch (err) {
          // Ignore errors
        }
      })

      return products
    })

    console.log(`  ✓ Found ${pageBeers.length} beers`)

    // Fetch detailed information for each beer
    for (const beer of pageBeers) {
      if (beer.productNumber && beer.vinbudinUrl) {
        const details = await fetchBeerDetails(page, beer.vinbudinUrl, beer.productNumber)
        Object.assign(beer, details)
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    allBeers.push(...pageBeers)

    if (pageBeers.length === 0) {
      hasMorePages = false
    } else {
      currentPage++
    }
  }

  await browser.close()

  console.log(`\n✅ Found ${allBeers.length} beers total\n`)
  return allBeers as VinbudinBeer[]
}

async function syncBeers(vinbudinBeers: VinbudinBeer[], dryRun: boolean = false) {
  console.log('🔄 Syncing beers with database...\n')

  let added = 0
  let updated = 0
  let unchanged = 0
  const errors: string[] = []

  for (const vinBeer of vinbudinBeers) {
    if (!vinBeer.productNumber || !vinBeer.containerSize || !vinBeer.containerType) {
      errors.push(`Skipping ${vinBeer.name}: missing required fields`)
      continue
    }

    try {
      // Find existing beer by COMPOSITE KEY (name, brewery, containerSize, containerType)
      // This is the unique constraint in the schema and prevents mixing up variants
      const existing = await prisma.beer.findFirst({
        where: {
          name: vinBeer.name,
          brewery: vinBeer.brewery,
          containerSize: vinBeer.containerSize,
          containerType: vinBeer.containerType
        }
      })

      if (existing) {
        // Check if update is needed (only update price, image, and metadata - NOT identity fields)
        const needsUpdate =
          existing.priceISK !== vinBeer.priceISK ||
          existing.pricePerLiter !== vinBeer.pricePerLiter ||
          existing.imageUrl !== vinBeer.imageUrl ||
          existing.productNumber !== vinBeer.productNumber ||
          existing.vinbudinUrl !== vinBeer.vinbudinUrl ||
          existing.abv !== vinBeer.abv

        if (needsUpdate) {
          console.log(`🔧 UPDATE: ${vinBeer.name} (${vinBeer.brewery}) - ${vinBeer.containerSize}ml ${vinBeer.containerType}`)
          if (existing.priceISK !== vinBeer.priceISK) {
            console.log(`   Price: ${existing.priceISK} kr → ${vinBeer.priceISK} kr`)
          }
          if (existing.pricePerLiter !== vinBeer.pricePerLiter) {
            console.log(`   Price/L: ${existing.pricePerLiter || 'N/A'} kr → ${vinBeer.pricePerLiter || 'N/A'} kr`)
          }
          if (existing.imageUrl !== vinBeer.imageUrl) {
            console.log(`   Image: ${existing.imageUrl ? 'Updated' : 'Added'}`)
          }
          if (existing.productNumber !== vinBeer.productNumber) {
            console.log(`   Product #: ${existing.productNumber} → ${vinBeer.productNumber}`)
          }

          if (!dryRun) {
            await prisma.beer.update({
              where: { id: existing.id },
              data: {
                // Update metadata and pricing - don't change identity
                priceISK: vinBeer.priceISK,
                pricePerLiter: vinBeer.pricePerLiter || existing.pricePerLiter,
                productNumber: vinBeer.productNumber,
                vinbudinUrl: vinBeer.vinbudinUrl,
                imageUrl: vinBeer.imageUrl || existing.imageUrl,
                abv: vinBeer.abv || existing.abv,
                styles: vinBeer.styles || existing.styles,
                description: vinBeer.description || existing.description,
                country: vinBeer.country || existing.country
              }
            })
          }
          updated++
        } else {
          unchanged++
        }
      } else {
        // Check if there's an existing beer with the same product number but different packaging
        // This handles the case where Vínbúðin changes the packaging of a product
        const existingByProductNumber = await prisma.beer.findFirst({
          where: { productNumber: vinBeer.productNumber }
        })

        if (existingByProductNumber) {
          console.log(`⚠️  PACKAGING CHANGE: Product #${vinBeer.productNumber}`)
          console.log(`   Old: ${existingByProductNumber.name} - ${existingByProductNumber.containerSize}ml ${existingByProductNumber.containerType}`)
          console.log(`   New: ${vinBeer.name} - ${vinBeer.containerSize}ml ${vinBeer.containerType}`)
          console.log(`   → Adding as new variant (product numbers may be reused)`)
        }

        // Add new beer variant
        console.log(`➕ ADD: ${vinBeer.name} (${vinBeer.brewery}) - ${vinBeer.containerSize}ml ${vinBeer.containerType}`)
        console.log(`   Product #${vinBeer.productNumber}, ${vinBeer.priceISK} kr`)

        if (!dryRun) {
          await prisma.beer.create({
            data: {
              name: vinBeer.name,
              brewery: vinBeer.brewery,
              productNumber: vinBeer.productNumber,
              containerSize: vinBeer.containerSize,
              containerType: vinBeer.containerType,
              priceISK: vinBeer.priceISK,
              pricePerLiter: vinBeer.pricePerLiter,
              vinbudinUrl: vinBeer.vinbudinUrl,
              imageUrl: vinBeer.imageUrl,
              abv: vinBeer.abv,
              styles: vinBeer.styles || [],
              description: vinBeer.description,
              country: vinBeer.country || 'Iceland'
            }
          })
        }
        added++
      }
    } catch (err: any) {
      errors.push(`${vinBeer.name}: ${err.message}`)
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`   Added: ${added}`)
  console.log(`   Updated: ${updated}`)
  console.log(`   Unchanged: ${unchanged}`)
  if (errors.length > 0) {
    console.log(`   Errors: ${errors.length}`)
    errors.forEach(e => console.log(`     - ${e}`))
  }
}

async function main() {
  try {
    const isDryRun = process.argv.includes('--dry-run') || process.argv.includes('-d')

    if (isDryRun) {
      console.log('🔍 DRY RUN MODE - no changes will be made\n')
    }

    const vinbudinBeers = await fetchAllBeersFromVinbudin()
    await syncBeers(vinbudinBeers, isDryRun)

    console.log('\n✨ Done!')
    await prisma.$disconnect()
  } catch (error) {
    console.error('\n❌ Error:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

main()

