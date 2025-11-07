/**
 * Script to fix container size mixups for specific beers
 * Run with: DATABASE_URL="your-db-url" npx tsx scripts/fix-beer-container-sizes.ts
 */

import { prisma } from '../src/lib/prisma'

// Map of product numbers to correct container sizes
// Format: productNumber -> { containerSize, containerType }
const fixes: Record<string, { containerSize: number; containerType: string }> = {
  // Thule Jólabjór fixes
  // Product numbers need to be checked - these are examples
  // You'll need to find the actual product numbers for 330ml vs 500ml variants
  
  // Víking Jólabjór fixes
  // Gull Lite White Ale Jól fixes
}

async function findAndFixBeers() {
  console.log('🔍 Leita að bjórum sem þurfa leiðréttingu...\n')

  // Find beers with the problematic names
  const problematicBeers = [
    'Thule Jólabjór',
    'Víking Jólabjór',
    'Gull Lite White Ale Jól'
  ]

  for (const beerName of problematicBeers) {
    console.log(`\n📋 Leita að: ${beerName}`)
    
    const beers = await prisma.beer.findMany({
      where: {
        name: {
          contains: beerName,
          mode: 'insensitive'
        }
      },
      orderBy: {
        containerSize: 'asc'
      }
    })

    if (beers.length === 0) {
      console.log(`  ⚠️  Fann enga bjóra með nafnið "${beerName}"`)
      continue
    }

    console.log(`  ✓ Fann ${beers.length} bjór(ar):`)
    
    for (const beer of beers) {
      console.log(`\n    ID: ${beer.id}`)
      console.log(`    Nafn: ${beer.name}`)
      console.log(`    Brugghús: ${beer.brewery}`)
      console.log(`    Vörunúmer: ${beer.productNumber || 'Ekkert'}`)
      console.log(`    Núverandi stærð: ${beer.containerSize || 'Ekkert'}ml`)
      console.log(`    Núverandi tegund: ${beer.containerType || 'Ekkert'}`)
      console.log(`    Vínbúðin URL: ${beer.vinbudinUrl || 'Ekkert'}`)
      
      // Check if this beer needs fixing based on product number
      if (beer.productNumber && fixes[beer.productNumber]) {
        const fix = fixes[beer.productNumber]
        console.log(`\n    🔧 Leiðrétti:`)
        console.log(`      Stærð: ${beer.containerSize}ml → ${fix.containerSize}ml`)
        console.log(`      Tegund: ${beer.containerType || 'Ekkert'} → ${fix.containerType}`)
        
        try {
          await prisma.beer.update({
            where: { id: beer.id },
            data: {
              containerSize: fix.containerSize,
              containerType: fix.containerType
            }
          })
          console.log(`    ✅ Uppfært!`)
        } catch (error) {
          console.error(`    ❌ Villa við að uppfæra:`, error)
        }
      } else {
        console.log(`    ⚠️  Engin leiðrétting skilgreind fyrir vörunúmer ${beer.productNumber || 'ekkert'}`)
      }
    }
  }
}

async function fixSpecificBeers() {
  console.log('\n🔧 Leiðrétti tilgreinda bjóra...\n')

  // Based on user report:
  // - Thule Jólabjór 330ml should be 500ml (currently showing as 500ml, so might need to check)
  // - Thule Jólabjór 500ml should be 330ml
  // - Víking Jólabjór variants are swapped
  // - Gull Lite White Ale Jól 330ml should be 500ml

  const fixes = [
    // Based on user report:
    // - Thule Jólabjór: The one showing as 330ml should be 500ml, and vice versa
    //   Currently we have #22264 as 500ml Dós - if this was listed as "330ml" on listing page,
    //   it should stay 500ml (correct). But if there's another one, they need to be swapped.
    //   Since we only found 1, maybe this one is correct and we're missing the other variant?
    
    // - Víking Jólabjór: Both are 330ml, but one should be 500ml
    //   We'll handle this with a swap below
    
    // - Gull Lite White Ale Jól: product #26259 is 330ml Dós, but should be 500ml
    {
      productNumber: '26259',
      name: 'Gull Lite White Ale Jól',
      currentSize: 330,
      newSize: 500,
      containerType: 'Dós'
    }
  ]

  for (const fix of fixes) {
    const beer = await prisma.beer.findFirst({
      where: {
        productNumber: fix.productNumber
      }
    })

    if (!beer) {
      console.log(`  ⚠️  Fann ekki bjór með vörunúmer ${fix.productNumber}`)
      continue
    }

    if (beer.containerSize === fix.newSize) {
      console.log(`  ✓ ${beer.name} (${fix.productNumber}) er þegar ${fix.newSize}ml - ekkert að gera`)
      continue
    }

    console.log(`\n  🔧 Uppfæri ${beer.name} (${fix.productNumber}):`)
    console.log(`     Stærð: ${beer.containerSize}ml → ${fix.newSize}ml`)
    console.log(`     Tegund: ${beer.containerType || 'Ekkert'} → ${fix.containerType}`)

    try {
      await prisma.beer.update({
        where: { id: beer.id },
        data: {
          containerSize: fix.newSize,
          containerType: fix.containerType
        }
      })
      console.log(`  ✅ Uppfært!`)
    } catch (error) {
      console.error(`  ❌ Villa við að uppfæra:`, error)
    }
  }
}

async function swapContainerSizes(beerName: string) {
  console.log(`\n🔄 Skipta um stærðir fyrir: ${beerName}\n`)
  
  const beers = await prisma.beer.findMany({
    where: {
      name: {
        contains: beerName,
        mode: 'insensitive'
      }
    },
    orderBy: {
      containerSize: 'asc'
    }
  })

  if (beers.length !== 2) {
    console.log(`  ⚠️  Fann ${beers.length} bjóra, en búist var við 2. Skipti ekki um.`)
    return
  }

  const [beer1, beer2] = beers
  
  console.log(`  Bjór 1: ${beer1.name} - ${beer1.containerSize}ml ${beer1.containerType} (${beer1.productNumber})`)
  console.log(`  Bjór 2: ${beer2.name} - ${beer2.containerSize}ml ${beer2.containerType} (${beer2.productNumber})`)
  
  // Swap container sizes
  const tempSize = beer1.containerSize
  const tempType = beer1.containerType
  
  try {
    await prisma.beer.update({
      where: { id: beer1.id },
      data: {
        containerSize: beer2.containerSize,
        containerType: beer2.containerType
      }
    })
    
    await prisma.beer.update({
      where: { id: beer2.id },
      data: {
        containerSize: tempSize,
        containerType: tempType
      }
    })
    
    console.log(`\n  ✅ Skipti um stærðir:`)
    console.log(`    ${beer1.name}: ${beer1.containerSize}ml → ${beer2.containerSize}ml`)
    console.log(`    ${beer2.name}: ${beer2.containerSize}ml → ${tempSize}ml`)
  } catch (error) {
    console.error(`  ❌ Villa við að skipta um:`, error)
  }
}

async function main() {
  try {
    // Check for dry-run flag
    const isDryRun = process.argv.includes('--dry-run') || process.argv.includes('-d')
    
    if (isDryRun) {
      console.log('🔍 DRY RUN MODE - engar breytingar verða gerðar\n')
    }

    // First, show what we found
    await findAndFixBeers()

    // If not dry run, fix the specific beers
    if (!isDryRun) {
      console.log('\n\n🔧 Uppfæri tilgreinda bjóra...')
      await fixSpecificBeers()
      
      // For Víking Jólabjór, we need to fix one of them to 500ml
      // Based on the data, we have:
      // - #17471: 330ml Dós (should be 500ml based on user report)
      // - #03590: 330ml Flaska (should stay 330ml or be 500ml - need to check)
      console.log('\n\n🔄 Athuga Víking Jólabjór...')
      const vikingBeers = await prisma.beer.findMany({
        where: {
          name: {
            contains: 'Víking Jólabjór',
            mode: 'insensitive'
          }
        },
        orderBy: {
          containerSize: 'asc'
        }
      })
      
      if (vikingBeers.length === 2) {
        // If both are 330ml, make the Dós one 500ml
        if (vikingBeers.every(b => b.containerSize === 330)) {
          const dosBeer = vikingBeers.find(b => b.containerType === 'Dós')
          if (dosBeer) {
            console.log(`  Uppfæri ${dosBeer.name} (${dosBeer.productNumber}) frá 330ml → 500ml`)
            await prisma.beer.update({
              where: { id: dosBeer.id },
              data: { containerSize: 500 }
            })
            console.log('  ✅ Uppfært!')
          }
        } else {
          // If one is already 500ml, swap them
          console.log('  Skipti um stærðir...')
          await swapContainerSizes('Víking Jólabjór')
        }
      }
      
      // For Thule Jólabjór - check if we need to create a missing variant or fix existing one
      console.log('\n\n🔄 Athuga Thule Jólabjór...')
      const thuleBeers = await prisma.beer.findMany({
        where: {
          name: {
            contains: 'Thule Jólabjór',
            mode: 'insensitive'
          }
        }
      })
      
      if (thuleBeers.length === 1) {
        const thule = thuleBeers[0]
        // User says: "Thule Jólabjór 330ml is 500ml on vinbudin.is"
        // And "the reverse applies for Thule Jólabjór 500ml"
        // This means if we have a 500ml entry, it might have been listed as "330ml" 
        // and should stay 500ml (correct). But if it was listed as "500ml", it should be 330ml.
        // Since we only have 1 entry, let's check: if it's 500ml and product #22264,
        // based on user's description, this might need to be changed to 330ml
        // (if it was incorrectly showing as 500ml when it should be 330ml)
        console.log(`  Fann aðeins 1 Thule Jólabjór: ${thule.containerSize}ml ${thule.containerType}`)
        console.log(`  Vörunúmer: ${thule.productNumber}`)
        
        // Based on user report: "Thule Jólabjór 330ml is 500ml on vinbudin.is"
        // and "the reverse applies for Thule Jólabjór 500ml"
        // This suggests there should be 2 variants that got swapped.
        // Since we only have 1 entry, we need to verify on Vínbúðin what the actual size is.
        // Product #22264 URL: https://www.vinbudin.is/desktopdefault.aspx/tabid-54/?productID=22264/
        console.log(`  ⚠️  Athuga á Vínbúðinni hvaða stærð vörunúmer ${thule.productNumber} er í raun`)
        console.log(`  URL: ${thule.vinbudinUrl}`)
        console.log(`  Ef þetta er 330ml á Vínbúðinni, breyttu í 330ml.`)
        console.log(`  Ef þetta er 500ml á Vínbúðinni, skildu sem 500ml.`)
        console.log(`  Ef það eru 2 útgáfur á Vínbúðinni, þarf að bæta við annarri útgáfunni.`)
      } else if (thuleBeers.length === 2) {
        console.log('  Skipti um stærðir...')
        await swapContainerSizes('Thule Jólabjór')
      }
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

