/**
 * Quick script to search Vínbúðin for all Gull Lite White Ale Jól variants
 */
import { chromium } from 'playwright'

async function searchVinbudin() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  
  console.log('Searching Vínbúðin for Gull Lite White Ale Jól...\n')
  
  await page.goto('https://www.vinbudin.is/heim/vorur/vorur?season=J%C3%93L&category=beer', {
    waitUntil: 'networkidle',
    timeout: 60000
  })
  
  // Wait for products to load
  await page.waitForSelector('.product-item, .product, [data-product], .productbox, article', {
    timeout: 30000
  })
  
  const products = await page.evaluate(() => {
    const items: any[] = []
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
      if (productElements && productElements.length > 0) break
    }
    
    if (!productElements) return []
    
    productElements.forEach((element) => {
      try {
        const nameEl = element.querySelector('.product-name, .productname, h3, h4, .title, .name, [data-name]')
        const name = nameEl?.textContent?.trim() || ''
        
        if (name.toLowerCase().includes('gull lite') && name.toLowerCase().includes('jól')) {
          const linkEl = element.querySelector('a[href*="productid"], a[href*="product"], a[href*="stoek-vara"]')
          const url = linkEl?.getAttribute('href') || ''
          const productMatch = url.match(/productid=(\d+)/i)
          const productNumber = productMatch?.[1] || ''
          
          const sizeMatch = name.match(/(\d+)\s*ml/i)
          const size = sizeMatch ? parseInt(sizeMatch[1]) : null
          
          let containerType: string | undefined
          if (name.toLowerCase().includes('dós') || name.toLowerCase().includes('can')) {
            containerType = 'Dós'
          } else if (name.toLowerCase().includes('flaska') || name.toLowerCase().includes('bottle')) {
            containerType = 'Flaska'
          }
          
          items.push({ name, productNumber, size, containerType, url })
        }
      } catch (err) {
        // Ignore errors
      }
    })
    
    return items
  })
  
  console.log(`Found ${products.length} variant(s):\n`)
  products.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name}`)
    console.log(`   Product #${p.productNumber}`)
    console.log(`   Size in listing name: ${p.size || 'Not specified'}ml`)
    console.log(`   Type in listing name: ${p.containerType || 'Not specified'}`)
    console.log(`   URL: ${p.url.startsWith('http') ? p.url : 'https://www.vinbudin.is' + p.url}`)
    console.log()
  })
  
  await browser.close()
}

searchVinbudin().catch(console.error)

