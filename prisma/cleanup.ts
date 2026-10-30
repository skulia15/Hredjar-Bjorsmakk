import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

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

    // Delete all users (except admins and leaders)
    try {
      const deletedUsers = await prisma.user.deleteMany({
        where: {
          AND: [
            { isAdmin: false },
            { isLeader: false }
          ]
        }
      })
      console.log(`✓ Deleted ${deletedUsers.count} users (kept admins and leaders)`)
    } catch (error: any) {
      // Handle case where isAdmin column doesn't exist (older schema)
      if (error.code === 'P2022') {
        const deletedUsers = await prisma.user.deleteMany({
          where: {
            isLeader: false
          }
        })
        console.log(`✓ Deleted ${deletedUsers.count} users (kept leaders)`)
      } else {
        throw error
      }
    }

    // Ensure required users exist
    console.log('\n📝 Ensuring required users exist...')

    // Ensure "admin" user exists with admin and leader privileges
    const adminUser = await prisma.user.upsert({
      where: { name: 'admin' },
      update: {
        isAdmin: true,
        isLeader: true
      },
      create: {
        name: 'admin',
        isAdmin: true,
        isLeader: true
      }
    })
    console.log(`✓ Admin user ensured: ${adminUser.name}`)

    // Ensure "skuli" user exists with admin and leader privileges
    const skuliUser = await prisma.user.upsert({
      where: { name: 'skuli' },
      update: {
        isAdmin: true,
        isLeader: true
      },
      create: {
        name: 'skuli',
        isAdmin: true,
        isLeader: true
      }
    })
    console.log(`✓ Skuli user ensured: ${skuliUser.name}`)

    // Count preserved records
    const beerCount = await prisma.beer.count()
    const userCount = await prisma.user.count()

    console.log('\n📊 Preserved records:')
    console.log(`  • ${beerCount} beers in catalog`)
    console.log(`  • ${userCount} users (admins/leaders)`)

    console.log('\n✅ Database cleanup completed successfully!')
    console.log('💡 Note: Beer catalog and admin/leader users are preserved')
    console.log('    To delete beers, use: npm run seed:beers:cleanup')

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

cleanup()
