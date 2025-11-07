import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupTastings() {
  console.log('Starting cleanup of all tastings and ratings...\n');

  try {
    // Get counts before deletion
    const tastingCount = await prisma.tasting.count();
    const participantCount = await prisma.participant.count();
    const ratingCount = await prisma.rating.count();
    const tastingBeerCount = await prisma.tastingBeer.count();

    console.log('Current state:');
    console.log(`- Tastings: ${tastingCount}`);
    console.log(`- Participants: ${participantCount}`);
    console.log(`- Ratings: ${ratingCount}`);
    console.log(`- Tasting Beers: ${tastingBeerCount}\n`);

    // Delete all tastings (cascade will handle related records)
    console.log('Deleting all tastings (and cascading to participants, ratings, tasting beers)...');
    const result = await prisma.tasting.deleteMany({});

    console.log(`\n✓ Deleted ${result.count} tastings and all related data`);

    // Verify cleanup
    const verifyTastings = await prisma.tasting.count();
    const verifyParticipants = await prisma.participant.count();
    const verifyRatings = await prisma.rating.count();
    const verifyTastingBeers = await prisma.tastingBeer.count();
    const verifyUsers = await prisma.user.count();
    const verifyBeers = await prisma.beer.count();

    console.log('\nFinal state:');
    console.log(`- Tastings: ${verifyTastings}`);
    console.log(`- Participants: ${verifyParticipants}`);
    console.log(`- Ratings: ${verifyRatings}`);
    console.log(`- Tasting Beers: ${verifyTastingBeers}`);
    console.log(`\nPreserved:`);
    console.log(`- Users: ${verifyUsers}`);
    console.log(`- Beers: ${verifyBeers}`);

    console.log('\n✓ Cleanup completed successfully!');
  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTastings()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
