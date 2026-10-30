import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

// Realistic Icelandic names for dummy users
const dummyUsers = [
  'Jón Jónsson',
  'Anna Sigurðardóttir',
  'Gunnar Pétursson',
  'Sigríður Ólafsdóttir',
  'Ólafur Magnússon',
  'Guðrún Kristinsdóttir',
  'Einar Þorsteinsson',
  'Kristín Jóhannesdóttir',
  'Þór Gunnarsson',
  'María Stefánsdóttir',
  'Bjarni Einarsson',
  'Helga Björnsdóttir',
  'Stefán Hjálmarsson',
  'Katrín Baldursdóttir',
  'Magnús Eiríksson'
]

// Generate a realistic rating with some variance
function generateRating(baseRating: number, variance: number = 1.5): number {
  // Add some randomness around the base rating
  const rating = baseRating + (Math.random() - 0.5) * variance * 2
  // Clamp between 1.0 and 10.0, round to nearest 0.5
  return Math.max(1.0, Math.min(10.0, Math.round(rating * 2) / 2))
}

// Generate participant code (4 alphanumeric characters)
function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Generate rejoin token
function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

async function createTestTasting() {
  console.log('🍺 Creating test tasting with realistic data...\n')

  try {
    // 1. Create or get dummy users
    console.log('👥 Creating 15 dummy users...')
    const users = []
    for (const name of dummyUsers) {
      const user =
        (await prisma.user.findFirst({ where: { name, clerkId: null } })) ??
        (await prisma.user.create({ data: { name } }))
      users.push(user)
    }
    console.log(`✓ Created/found ${users.length} users\n`)

    // 2. Get 25 beers, prioritizing breweries with multiple beers
    console.log('🍺 Selecting 25 beers (prioritizing multi-beer breweries)...')

    // First, get all available beers with price data
    const availableBeers = await prisma.beer.findMany({
      where: {
        pricePerLiter: { not: null } // Ensure they have price data
      },
      orderBy: {
        brewery: 'asc' // Group by brewery
      }
    })

    if (availableBeers.length === 0) {
      console.error('❌ No beers found in database!')
      return
    }

    // Group beers by brewery
    const beersByBrewery = availableBeers.reduce((acc, beer) => {
      const brewery = beer.brewery || 'Unknown'
      if (!acc[brewery]) {
        acc[brewery] = []
      }
      acc[brewery].push(beer)
      return acc
    }, {} as Record<string, typeof availableBeers>)

    // Sort breweries by number of beers (descending)
    const breweriesWithMultipleBeers = Object.entries(beersByBrewery)
      .filter(([_, beers]) => beers.length >= 2)
      .sort((a, b) => b[1].length - a[1].length)

    const breweriesWithOneBeers = Object.entries(beersByBrewery)
      .filter(([_, beers]) => beers.length === 1)

    // Select beers: prioritize breweries with multiple beers
    const selectedBeers: typeof availableBeers = []

    // First, add beers from breweries with multiple beers (take 2-3 from each)
    for (const [brewery, beers] of breweriesWithMultipleBeers) {
      if (selectedBeers.length >= 25) break

      // Take 2-3 beers from this brewery
      const numToTake = Math.min(
        beers.length,
        Math.min(3, 25 - selectedBeers.length),
        2 + Math.floor(Math.random() * 2) // 2 or 3 beers
      )

      // Randomly select beers from this brewery
      const shuffled = [...beers].sort(() => Math.random() - 0.5)
      selectedBeers.push(...shuffled.slice(0, numToTake))

      console.log(`  ✓ Added ${numToTake} beers from ${brewery}`)
    }

    // Then, fill remaining slots with single-beer breweries
    if (selectedBeers.length < 25) {
      const needed = 25 - selectedBeers.length
      const singleBeers = breweriesWithOneBeers
        .map(([_, beers]) => beers[0])
        .sort(() => Math.random() - 0.5)
        .slice(0, needed)

      selectedBeers.push(...singleBeers)
      console.log(`  ✓ Added ${singleBeers.length} beers from single-beer breweries`)
    }

    const allBeers = selectedBeers.slice(0, 25)
    console.log(`\n🍺 Selected ${allBeers.length} beers for the tasting`)

    // Print brewery distribution
    const finalBreweryCount = allBeers.reduce((acc, beer) => {
      const brewery = beer.brewery || 'Unknown'
      acc[brewery] = (acc[brewery] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    console.log('\n📊 Brewery distribution:')
    Object.entries(finalBreweryCount)
      .sort((a, b) => b[1] - a[1])
      .forEach(([brewery, count]) => {
        console.log(`  ${brewery}: ${count} beer${count > 1 ? 's' : ''}`)
      })
    console.log()

    // 3. Create the test tasting
    console.log('📋 Creating test tasting...')
    const tasting = await prisma.tasting.create({
      data: {
        title: 'Test Smökkun - Verðgreining',
        status: 'closed', // Set to closed so price analytics shows
        createdBy: users[0].id
      }
    })
    console.log(`✓ Created tasting: ${tasting.title} (${tasting.id})\n`)

    // 4. Add beers to tasting
    console.log('🍻 Adding beers to tasting...')
    const tastingBeers = []
    for (let i = 0; i < allBeers.length; i++) {
      const tb = await prisma.tastingBeer.create({
        data: {
          tastingId: tasting.id,
          beerId: allBeers[i].id,
          orderIndex: i,
          status: 'finished', // Mark all as finished
          currentSince: new Date(Date.now() - 3600000 * (allBeers.length - i)), // Stagger times
          finishedAt: new Date(Date.now() - 3600000 * (allBeers.length - i - 1))
        }
      })
      tastingBeers.push(tb)
    }
    console.log(`✓ Added ${tastingBeers.length} beers to tasting\n`)

    // 5. Create participants
    console.log('👥 Creating participants...')
    const participants = []
    for (const user of users) {
      const participant = await prisma.participant.create({
        data: {
          tastingId: tasting.id,
          userId: user.id,
          code: generateCode(),
          rejoinToken: generateToken(),
          active: true
        }
      })
      participants.push(participant)
    }
    console.log(`✓ Created ${participants.length} participants\n`)

    // 6. Generate ratings for each participant for each beer
    console.log('⭐ Generating ratings...')

    // Assign each beer a "true quality" score that ratings will cluster around
    const beerQualities = allBeers.map((beer, index) => {
      // Vary quality from 5.0 to 9.5
      const baseQuality = 5.0 + (index / (allBeers.length - 1)) * 4.5
      return {
        beer,
        quality: baseQuality
      }
    })

    let totalRatings = 0
    for (const participant of participants) {
      // Each participant has their own bias (some are more generous, some more critical)
      const participantBias = (Math.random() - 0.5) * 2 // -1.0 to +1.0

      for (const { beer, quality } of beerQualities) {
        const tastingBeer = tastingBeers.find(tb => tb.beerId === beer.id)!

        // Generate rating based on beer quality + participant bias + random variance
        const baseRating = quality + participantBias
        const rating = generateRating(baseRating, 1.0)

        await prisma.rating.create({
          data: {
            tastingId: tasting.id,
            tastingBeerId: tastingBeer.id,
            participantId: participant.id,
            score: rating
          }
        })
        totalRatings++
      }

      console.log(`  ✓ Generated ratings for ${participant.code}`)
    }

    console.log(`\n✓ Created ${totalRatings} total ratings\n`)

    // 7. Print summary
    console.log('📊 Test Tasting Summary:')
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`Tasting ID: ${tasting.id}`)
    console.log(`Title: ${tasting.title}`)
    console.log(`Status: ${tasting.status}`)
    console.log(`Participants: ${participants.length}`)
    console.log(`Beers: ${tastingBeers.length}`)
    console.log(`Total Ratings: ${totalRatings}`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

    // 8. Calculate and show top 5 beers
    console.log('🏆 Top 5 Beers:')
    const scores = await prisma.rating.groupBy({
      by: ['tastingBeerId'],
      where: { tastingId: tasting.id },
      _avg: { score: true },
      _count: { score: true }
    })

    const beersWithScores = await Promise.all(
      scores.map(async (s) => {
        const tb = await prisma.tastingBeer.findUnique({
          where: { id: s.tastingBeerId },
          include: { beer: true }
        })
        return {
          name: tb?.beer?.name || 'Unknown',
          brewery: tb?.beer?.brewery || 'Unknown',
          average: s._avg.score || 0,
          count: s._count.score
        }
      })
    )

    beersWithScores
      .sort((a, b) => b.average - a.average)
      .slice(0, 5)
      .forEach((beer, index) => {
        console.log(`  ${index + 1}. ${beer.name} - ${beer.brewery}`)
        console.log(`     Average: ${beer.average.toFixed(2)} (${beer.count} ratings)`)
      })

    console.log(`\n✅ Test tasting created successfully!`)
    console.log(`\n🔗 View scores at: /t/${tasting.id}/scores`)
    console.log(`🔗 View tasting at: /t/${tasting.id}\n`)

  } catch (error) {
    console.error('❌ Error creating test tasting:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createTestTasting()
