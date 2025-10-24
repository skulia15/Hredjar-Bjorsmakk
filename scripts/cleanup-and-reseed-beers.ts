import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupBeers() {
  console.log('🗑️  Deleting all beers from catalog...\n')

  try {
    const deletedBeers = await prisma.beer.deleteMany({})
    console.log(`✓ Deleted ${deletedBeers.count} beers from catalog\n`)

    console.log('✅ Beer catalog cleanup completed!\n')
    console.log('📝 Now run the Vínbúðin scraper to add fresh data:')
    console.log('   DATABASE_URL="..." npx tsx scripts/fetch-vinbudin-beers.ts\n')

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

cleanupBeers()
