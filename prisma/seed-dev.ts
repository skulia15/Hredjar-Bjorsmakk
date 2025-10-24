import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding development database...');

  // Create admin auth
  await prisma.adminAuth.upsert({
    where: { id: 'admin-1' },
    update: {},
    create: {
      id: 'admin-1',
      passwordHash: 'admin', // In production, this would be bcrypt hashed
    },
  });

  // Create users
  const skuli = await prisma.user.upsert({
    where: { name: 'skuli' },
    update: {},
    create: {
      name: 'skuli',
      isLeader: true,
    },
  });

  const anna = await prisma.user.upsert({
    where: { name: 'anna' },
    update: {},
    create: {
      name: 'anna',
      isLeader: true,
    },
  });

  const jon = await prisma.user.upsert({
    where: { name: 'jon' },
    update: {},
    create: {
      name: 'jon',
      isLeader: true,
    },
  });

  const eiki = await prisma.user.upsert({
    where: { name: 'eiki' },
    update: {},
    create: {
      name: 'eiki',
      isLeader: false,
    },
  });

  const maria = await prisma.user.upsert({
    where: { name: 'maria' },
    update: {},
    create: {
      name: 'maria',
      isLeader: false,
    },
  });

  const olafur = await prisma.user.upsert({
    where: { name: 'olafur' },
    update: {},
    create: {
      name: 'olafur',
      isLeader: false,
    },
  });

  const sara = await prisma.user.upsert({
    where: { name: 'sara' },
    update: {},
    create: {
      name: 'sara',
      isLeader: false,
    },
  });

  const emma = await prisma.user.upsert({
    where: { name: 'emma' },
    update: {},
    create: {
      name: 'emma',
      isLeader: false,
    },
  });

  console.log('✅ Created 8 users (3 leaders, 5 participants)');

  // Create active tasting
  const activeTasting = await prisma.tasting.create({
    data: {
      title: 'Friday Night Beers',
      status: 'active',
      createdBy: skuli.id,
      version: 1,
    },
  });

  // Create beers for active tasting
  const beer1 = await prisma.tastingBeer.create({
    data: {
      tastingId: activeTasting.id,
      customName: 'IPA Sample',
      customBrewery: 'Brewery A',
      customStyle: 'IPA',
      customAbv: 6.5,
      orderIndex: 0,
      status: 'finished',
    },
  });

  const beer2 = await prisma.tastingBeer.create({
    data: {
      tastingId: activeTasting.id,
      customName: 'Stout Special',
      customBrewery: 'Brewery B',
      customStyle: 'Stout',
      customAbv: 8.0,
      orderIndex: 1,
      status: 'current',
    },
  });

  const beer3 = await prisma.tastingBeer.create({
    data: {
      tastingId: activeTasting.id,
      customName: 'Lager Light',
      customBrewery: 'Brewery C',
      customStyle: 'Lager',
      customAbv: 4.5,
      orderIndex: 2,
      status: 'untasted',
    },
  });

  const beer4 = await prisma.tastingBeer.create({
    data: {
      tastingId: activeTasting.id,
      customName: 'Pilsner Gold',
      customBrewery: 'Brewery D',
      customStyle: 'Pilsner',
      customAbv: 5.2,
      orderIndex: 3,
      status: 'untasted',
    },
  });

  const beer5 = await prisma.tastingBeer.create({
    data: {
      tastingId: activeTasting.id,
      customName: 'Wheat Wonder',
      customBrewery: 'Brewery E',
      customStyle: 'Wheat Beer',
      customAbv: 5.5,
      orderIndex: 4,
      status: 'untasted',
    },
  });

  const beer6 = await prisma.tastingBeer.create({
    data: {
      tastingId: activeTasting.id,
      customName: 'Amber Ale',
      customBrewery: 'Brewery F',
      customStyle: 'Amber Ale',
      customAbv: 6.0,
      orderIndex: 5,
      status: 'untasted',
    },
  });

  await prisma.tasting.update({
    where: { id: activeTasting.id },
    data: { currentTastingBeerId: beer2.id },
  });

  console.log('✅ Created active tasting with 6 beers');

  // Create participants for active tasting
  const participants = [];
  const users = [skuli, anna, jon, eiki, maria, olafur, sara, emma];

  for (let i = 0; i < users.length; i++) {
    const participant = await prisma.participant.create({
      data: {
        tastingId: activeTasting.id,
        userId: users[i].id,
        code: generateCode(),
        rejoinToken: `token-${i}`,
      },
    });
    participants.push(participant);
  }

  console.log('✅ Created 8 participants');

  // Create ratings for finished beer
  const scores = [8.5, 9.0, 7.5, 8.0, 8.5, 7.0, 9.0, 8.0];
  for (let i = 0; i < participants.length; i++) {
    await prisma.rating.create({
      data: {
        tastingId: activeTasting.id,
        tastingBeerId: beer1.id,
        participantId: participants[i].id,
        score: scores[i],
      },
    });
  }

  // Create some ratings for current beer (not everyone has rated yet)
  const currentScores = [8.0, 7.5, 9.0, 8.5];
  for (let i = 0; i < 4; i++) {
    await prisma.rating.create({
      data: {
        tastingId: activeTasting.id,
        tastingBeerId: beer2.id,
        participantId: participants[i].id,
        score: currentScores[i],
      },
    });
  }

  console.log('✅ Created ratings for beers');

  // Create a closed tasting
  const closedTasting = await prisma.tasting.create({
    data: {
      title: 'December Tasting',
      status: 'closed',
      createdBy: anna.id,
      version: 10,
    },
  });

  // Create beers for closed tasting
  for (let i = 0; i < 8; i++) {
    await prisma.tastingBeer.create({
      data: {
        tastingId: closedTasting.id,
        customName: `Beer ${i + 1}`,
        customBrewery: `Brewery ${String.fromCharCode(65 + i)}`,
        orderIndex: i,
        status: 'finished',
      },
    });
  }

  console.log('✅ Created closed tasting with 8 beers');

  console.log('🎉 Seed complete!');
  console.log('\nTest Accounts:');
  console.log('  Admin: admin');
  console.log('  Leaders: skuli, anna, jon');
  console.log('  Participants: eiki, maria, olafur, sara, emma');
  console.log('\nActive Tasting ID:', activeTasting.id);
}

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 4 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
