/**
 * Script to verify container sizes by checking Vínbúðin product pages
 * Run with: DATABASE_URL="your-db-url" npx tsx scripts/verify-beer-sizes.ts
 */

import { chromium } from 'playwright'
import { prisma } from '../src/lib/prisma'

interface BeerToCheck {
  id: string
  name: string
  brewery: string
  productNumber: string
  vinbudinUrl: string
  currentSize: number | null
  currentType: string | null
}

async function checkBeerOnVinbudin(page: any, beer: BeerToCheck) {
  try {
    console.log(`\n🔍 Athuga ${beer.name} (${beer.productNumber})...`)
    console.log(`   Núverandi: ${beer.currentSize}ml ${beer.currentType}`)
    
    await page.goto(beer.vinbudinUrl, { waitUntil: 'networkidle', timeout: 30000 })
    
    const details = await page.evaluate(() => {
      const result: any = {}
      const detailsText = document.body.innerText
      
      // Find container size - look for "Umbúðastærð" or size in ml
      const sizeMatch = detailsText.match(/Umbúðastærð[:\s]+(\d+)\s*ml/i) ||
                       detailsText.match(/(\d+)\s*ml/i)
      if (sizeMatch) {
        result.containerSize = parseInt(sizeMatch[1])
      }
      
      // Find container type - look for "Umbúðir"
      const containerMatch = detailsText.match(/Umbúðir[:\s]+([^\n\r]+)/i)
      if (containerMatch) {
        const containerText = containerMatch[1].toLowerCase()
        if (containerText.includes('dós') || containerText.includes('áldós')) {
          result.containerType = 'Dós'
        } else if (containerText.includes('flaska') || containerText.includes('glerflaska')) {
          result.containerType = 'Flaska'
        }
      }
      
      // Also check product name/title
      const titleEl = document.querySelector('h1, .product-title, .product-name')
      if (titleEl) {
        const titleText = titleEl.textContent || ''
        const titleSizeMatch = titleText.match(/(\d+)\s*ml/i)
        if (titleSizeMatch) {
          result.titleSize = parseInt(titleSizeMatch[1])
        }
        if (titleText.toLowerCase().includes('dós')) {
          result.titleType = 'Dós'
        } else if (titleText.toLowerCase().includes('flaska')) {
          result.titleType = 'Flaska'
        }
      }
      
      return result
    })
    
    console.log(`   Á Vínbúðinni:`)
    if (details.containerSize) {
      console.log(`     Stærð: ${details.containerSize}ml`)
      if (details.containerSize !== beer.currentSize) {
        console.log(`     ⚠️  MISMATCH! Verður að uppfæra í ${details.containerSize}ml`)
      }
    }
    if (details.titleSize && details.titleSize !== details.containerSize) {
      console.log(`     Stærð í titli: ${details.titleSize}ml`)
    }
    if (details.containerType) {
      console.log(`     Tegund: ${details.containerType}`)
      if (details.containerType !== beer.currentType) {
        console.log(`     ⚠️  MISMATCH! Verður að uppfæra í ${details.containerType}`)
      }
    }
    if (details.titleType && details.titleType !== details.containerType) {
      console.log(`     Tegund í titli: ${details.titleType}`)
    }
    
    // Return what needs to be fixed
    const needsFix = (details.containerSize && details.containerSize !== beer.currentSize) ||
                     (details.containerType && details.containerType !== beer.currentType)
    
    return {
      ...details,
      needsFix,
      shouldBeSize: details.containerSize || details.titleSize,
      shouldBeType: details.containerType || details.titleType
    }
  } catch (error) {
    console.error(`   ❌ Villa við að athuga:`, error)
    return null
  }
}

async function main() {
  try {
    const beersToCheck: BeerToCheck[] = [
      {
        id: 'a92b3e77-f8ef-4a42-945e-0a3006d243d8',
        name: 'Thule Jólabjór',
        brewery: 'Víking Brugghús',
        productNumber: '22264',
        vinbudinUrl: 'https://www.vinbudin.is/desktopdefault.aspx/tabid-54/?productID=22264/',
        currentSize: 500,
        currentType: 'Dós'
      },
      {
        id: 'e3732c38-3b59-417f-a71a-786dd6e4bf49',
        name: 'Víking Jólabjór',
        brewery: 'Víking Brugghús',
        productNumber: '17471',
        vinbudinUrl: 'https://www.vinbudin.is/desktopdefault.aspx/tabid-54/?productID=17471/',
        currentSize: 500,
        currentType: 'Dós'
      },
      {
        id: '869790e9-8127-47fb-92a7-f2e4f373e50e',
        name: 'Víking Jólabjór',
        brewery: 'Víking Brugghús',
        productNumber: '03590',
        vinbudinUrl: 'https://www.vinbudin.is/desktopdefault.aspx/tabid-54/?productID=03590/',
        currentSize: 330,
        currentType: 'Flaska'
      },
      {
        id: '4ae75da4-f6c2-4176-a28a-468c7e458b4d',
        name: 'Gull Lite White Ale Jól',
        brewery: 'Ölgerðin Egill Skallagrímsson',
        productNumber: '26259',
        vinbudinUrl: 'https://www.vinbudin.is/desktopdefault.aspx/tabid-54/?productID=26259/',
        currentSize: 500,
        currentType: 'Dós'
      }
    ]
    
    console.log('🌐 Opna Vínbúðin síður til að athuga stærðir...\n')
    
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()
    
    const fixes: Array<{ id: string; size?: number; type?: string }> = []
    
    for (const beer of beersToCheck) {
      const result = await checkBeerOnVinbudin(page, beer)
      
      if (result && result.needsFix) {
        fixes.push({
          id: beer.id,
          size: result.shouldBeSize,
          type: result.shouldBeType
        })
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    await browser.close()
    
    if (fixes.length > 0) {
      console.log('\n\n🔧 Uppfæri bjóra í gagnagrunninum...\n')
      
      for (const fix of fixes) {
        const beer = beersToCheck.find(b => b.id === fix.id)
        if (!beer) continue
        
        const updateData: any = {}
        if (fix.size !== undefined) updateData.containerSize = fix.size
        if (fix.type !== undefined) updateData.containerType = fix.type
        
        try {
          await prisma.beer.update({
            where: { id: fix.id },
            data: updateData
          })
          console.log(`✅ Uppfært ${beer.name} (${beer.productNumber})`)
          if (fix.size) console.log(`   Stærð: ${beer.currentSize}ml → ${fix.size}ml`)
          if (fix.type) console.log(`   Tegund: ${beer.currentType} → ${fix.type}`)
        } catch (error) {
          console.error(`❌ Villa við að uppfæra ${beer.name}:`, error)
        }
      }
    } else {
      console.log('\n✅ Allir bjórar eru réttir!')
    }
    
    console.log('\n✨ Lokið!')
    await prisma.$disconnect()
  } catch (error) {
    console.error('\n❌ Villa:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

main()

