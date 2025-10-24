import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanup() {
  console.log('Starting database cleanup...\n')

  try {
    // Delete all ratings
    const deletedRatings = await prisma.rating.deleteMany({})
    console.log(`✓ Deleted ${deletedRatings.count} ratings`)

    // Delete all tasting beers
    const deletedTastingBeers = await prisma.tastingBeer.deleteMany({})
    console.log(`✓ Deleted ${deletedTastingBeers.count} tasting beers`)

    // Delete all participants
    const deletedParticipants = await prisma.participant.deleteMany({})
    console.log(`✓ Deleted ${deletedParticipants.count} participants`)

    // Delete all tastings
    const deletedTastings = await prisma.tasting.deleteMany({})
    console.log(`✓ Deleted ${deletedTastings.count} tastings`)

    // Delete all users (except admins if you want to keep them)
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        isAdmin: false
      }
    })
    console.log(`✓ Deleted ${deletedUsers.count} users (kept admins)`)

    // Optionally delete all beers from catalog
    // Uncomment if you want to clear the beer catalog too
    // const deletedBeers = await prisma.beer.deleteMany({})
    // console.log(`✓ Deleted ${deletedBeers.count} beers from catalog`)

    console.log('\n✅ Database cleanup completed successfully!')

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

cleanup()
