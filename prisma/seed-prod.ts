import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding production database...');

  // Create admin auth
  await prisma.adminAuth.upsert({
    where: { id: 'admin-1' },
    update: {},
    create: {
      id: 'admin-1',
      passwordHash: 'admin', // In production, this would be bcrypt hashed
    },
  });
  console.log('✅ Created admin auth');

  // Create users - all as leaders
  const admin = await prisma.user.upsert({
    where: { name: 'admin' },
    update: { isLeader: true },
    create: {
      name: 'admin',
      isLeader: true,
    },
  });

  const eiki = await prisma.user.upsert({
    where: { name: 'eiki' },
    update: { isLeader: true },
    create: {
      name: 'eiki',
      isLeader: true,
    },
  });

  const skuli = await prisma.user.upsert({
    where: { name: 'skúli' },
    update: { isLeader: true },
    create: {
      name: 'skúli',
      isLeader: true,
    },
  });

  console.log('✅ Created 3 users (all leaders):');
  console.log(`   - ${admin.name}`);
  console.log(`   - ${eiki.name}`);
  console.log(`   - ${skuli.name}`);

  console.log('\n🎉 Production seed complete!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
