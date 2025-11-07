import { chromium } from 'playwright'

async function searchAllPages() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  
  const allProducts: any[] = []
  let currentPage = 1
  let hasMorePages = true
  
  while (hasMorePages && currentPage <= 3) {
    const url = currentPage === 1
      ? 'https://www.vinbudin.is/heim/vorur/vorur?season=J%C3%93L&category=beer'
      : `https://www.vinbudin.is/heim/vorur/vorur?season=J%C3%93L&category=beer&page=${currentPage}`
    
    console.log(`Checking page ${currentPage}...`)
    
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
    
    try {
      await page.waitForSelector('.product-item, .product, [data-product]', { timeout: 30000 })
    } catch {
      break
    }
    
    const pageProducts = await page.evaluate(() => {
      const items: any[] = []
      const selectors = ['.product-item', '.product', '[data-product]', '.productbox', 'article']
      
      let productElements: NodeListOf<Element> | null = null
      for (const selector of selectors) {
        productElements = document.querySelectorAll(selector)
        if (productElements && productElements.length > 0) break
      }
      
      if (!productElements) return []
      
      productElements.forEach((element) => {
        try {
          const nameEl = element.querySelector('.product-name, .productname, h3, h4, .title, .name')
          const name = nameEl?.textContent?.trim() || ''
          
          if ((name.toLowerCase().includes('víking') && name.toLowerCase().includes('jól')) ||
              (name.toLowerCase().includes('thule') && name.toLowerCase().includes('jól'))) {
            
            const linkEl = element.querySelector('a[href*="productid"], a[href*="product"], a[href*="stoek-vara"]')
            const url = linkEl?.getAttribute('href') || ''
            const productMatch = url.match(/productid=(\d+)/i)
            const productNumber = productMatch?.[1] || ''
            
            items.push({
              name,
              productNumber,
              url: url.startsWith('http') ? url : `https://www.vinbudin.is${url}`
            })
          }
        } catch (err) {
          // Ignore
        }
      })
      
      return items
    })
    
    allProducts.push(...pageProducts)
    
    if (pageProducts.length === 0) {
      hasMorePages = false
    } else {
      currentPage++
    }
  }
  
  console.log(`\nFound ${allProducts.length} products matching Víking/Thule Jólabjór\n`)
  
  // Check each product page for details
  for (const product of allProducts) {
    if (!product.productNumber || !product.url) continue
    
    console.log(`\nChecking ${product.name} (${product.productNumber})...`)
    
    await page.goto(product.url, { waitUntil: 'networkidle', timeout: 30000 })
    
    const details = await page.evaluate(() => {
      const bodyText = document.body.innerText
      
      const sizeMatch = bodyText.match(/Umbúðastærð[:\s]+(\d+)\s*ml/i) ||
                       bodyText.match(/(\d+)\s*ml/i)
      const size = sizeMatch ? parseInt(sizeMatch[1]) : null
      
      const containerMatch = bodyText.match(/Umbúðir[:\s]+([^\n\r]+)/i)
      let type = null
      if (containerMatch) {
        const containerText = containerMatch[1].toLowerCase()
        if (containerText.includes('dós')) type = 'Dós'
        else if (containerText.includes('flaska')) type = 'Flaska'
      }
      
      return { size, type }
    })
    
    console.log(`  Product #${product.productNumber}`)
    console.log(`  Size: ${details.size}ml`)
    console.log(`  Type: ${details.type}`)
    console.log(`  URL: ${product.url}`)
    
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  await browser.close()
}

searchAllPages().catch(console.error)

