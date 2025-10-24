import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { chromium } from 'playwright'

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

/**
 * POST /api/beers/fetch-vinbudin
 * Fetches beers from Vínbúðin and adds missing ones to the catalog
 */
export async function POST() {
  try {
    console.log('🔍 Fetching beers from Vínbúðin...')

    const browser = await chromium.launch()
    const page = await browser.newPage()

    // Navigate to the Vínbúðin Christmas beer page
    await page.goto('https://www.vinbudin.is/heim/vorur/vorur?season=J%C3%93L&category=beer', {
      waitUntil: 'networkidle'
    })

    // Wait for products to load
    await page.waitForSelector('.product-item, .product, [data-product]', { timeout: 10000 })

    // Extract beer data from the page
    const beers = await page.evaluate(() => {
      const products: VinbudinBeer[] = []

      // Try multiple selectors for product items
      const productElements = document.querySelectorAll('.product-item, .product, [data-product], .productbox')

      productElements.forEach((element) => {
        try {
          // Extract product data - adjust selectors based on actual page structure
          const nameEl = element.querySelector('.product-name, .productname, h3, h4, .title')
          const priceEl = element.querySelector('.price, .productprice, .product-price')
          const linkEl = element.querySelector('a[href*="productid"], a[href*="/product/"]')
          const imageEl = element.querySelector('img')

          if (!nameEl || !priceEl) return

          const name = nameEl.textContent?.trim() || ''
          const priceText = priceEl.textContent?.trim() || '0'
          const price = parseFloat(priceText.replace(/[^\d,]/g, '').replace(',', '.'))
          const url = linkEl?.getAttribute('href') || ''
          const imageUrl = imageEl?.getAttribute('src') || imageEl?.getAttribute('data-src') || ''

          // Extract product number from URL or data attribute
          const productNumberMatch = url.match(/productid[=/](\d+)/i) ||
                                    element.getAttribute('data-product-id')?.match(/(\d+)/)
          const productNumber = productNumberMatch?.[1] || ''

          // Try to parse brewery and beer name
          // Common formats: "Brewery - Beer Name" or just "Beer Name"
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

          // Try to extract ABV from name or description
          const abvMatch = name.match(/(\d+(?:[,.]\d+)?)\s*%/)
          const abv = abvMatch ? parseFloat(abvMatch[1].replace(',', '.')) : undefined

          // Try to extract container size
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
          console.error('Error parsing product:', err)
        }
      })

      return products
    })

    await browser.close()

    console.log(`✓ Found ${beers.length} beers on Vínbúðin`)

    // Filter out beers that already exist
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

    console.log(`📥 Adding ${newBeers.length} new beers to catalog...`)

    // Add new beers to database
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
            country: 'Iceland' // Assuming most are Icelandic or sold in Iceland
          }
        })
        added++
        console.log(`  ✓ Added: ${beer.name} - ${beer.brewery}`)
      } catch (err: any) {
        console.error(`  ✗ Failed to add ${beer.name}:`, err.message)
        errors.push(`${beer.name}: ${err.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      found: beers.length,
      existing: beers.length - newBeers.length,
      added,
      errors: errors.length > 0 ? errors : undefined,
      message: `Found ${beers.length} beers, added ${added} new ones`
    })

  } catch (error: any) {
    console.error('Error fetching from Vínbúðin:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch beers from Vínbúðin',
        details: error.message
      },
      { status: 500 }
    )
  }
}
