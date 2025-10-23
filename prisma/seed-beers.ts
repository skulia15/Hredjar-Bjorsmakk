import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Icelandic Christmas beers and popular craft beers
const ICELANDIC_BEERS = [
  // Borg Brugghús - Popular Icelandic brewery
  {
    name: 'Jólabjór',
    brewery: 'Borg Brugghús',
    style: 'Christmas Ale',
    abv: 5.8,
    country: 'Iceland',
    description: 'Traditional Icelandic Christmas beer with warming spices and caramel malt character.',
    containerSize: 330,
    containerType: 'Can',
    productNumber: 'BB-JOL-330',
    vinbudinUrl: 'https://www.vinbudin.is'
  },
  {
    name: 'Úlfur IPA',
    brewery: 'Borg Brugghús',
    style: 'IPA',
    abv: 5.9,
    country: 'Iceland',
    description: 'Hoppy India Pale Ale with citrus and pine notes.',
    containerSize: 330,
    containerType: 'Can',
    productNumber: 'BB-ULF-330',
    vinbudinUrl: 'https://www.vinbudin.is'
  },
  {
    name: 'Garún nr. 19',
    brewery: 'Borg Brugghús',
    style: 'Pilsner',
    abv: 4.6,
    country: 'Iceland',
    description: 'Crisp and refreshing Icelandic pilsner.',
    containerSize: 500,
    containerType: 'Bottle',
    productNumber: 'BB-GAR-500',
    vinbudinUrl: 'https://www.vinbudin.is'
  },

  // Gæðingur - Another Icelandic brewery
  {
    name: 'Jólasúð',
    brewery: 'Gæðingur',
    style: 'Christmas Ale',
    abv: 5.5,
    country: 'Iceland',
    description: 'Festive Christmas ale with notes of cinnamon and orange peel.',
    containerSize: 330,
    containerType: 'Can',
    productNumber: 'GAE-JOL-330',
    vinbudinUrl: 'https://www.vinbudin.is'
  },
  {
    name: 'Beljandi IPA',
    brewery: 'Gæðingur',
    style: 'IPA',
    abv: 6.2,
    country: 'Iceland',
    description: 'Bold IPA with tropical fruit aromas.',
    containerSize: 330,
    containerType: 'Can',
    productNumber: 'GAE-BEL-330',
    vinbudinUrl: 'https://www.vinbudin.is'
  },

  // Einstök - Well-known Icelandic brand
  {
    name: 'Icelandic White Ale',
    brewery: 'Einstök',
    style: 'Witbier',
    abv: 5.2,
    country: 'Iceland',
    description: 'Refreshing wheat beer brewed with coriander and orange peel.',
    containerSize: 330,
    containerType: 'Bottle',
    productNumber: 'EIN-WHI-330',
    vinbudinUrl: 'https://www.vinbudin.is'
  },
  {
    name: 'Arctic Pale Ale',
    brewery: 'Einstök',
    style: 'Pale Ale',
    abv: 5.6,
    country: 'Iceland',
    description: 'Balanced pale ale with Icelandic water.',
    containerSize: 330,
    containerType: 'Bottle',
    productNumber: 'EIN-ARC-330',
    vinbudinUrl: 'https://www.vinbudin.is'
  },
  {
    name: 'Toasted Porter',
    brewery: 'Einstök',
    style: 'Porter',
    abv: 6.0,
    country: 'Iceland',
    description: 'Rich porter with chocolate and coffee notes.',
    containerSize: 330,
    containerType: 'Bottle',
    productNumber: 'EIN-POR-330',
    vinbudinUrl: 'https://www.vinbudin.is'
  },

  // Kaldi - One of Iceland's first microbreweries
  {
    name: 'Jólaöl',
    brewery: 'Kaldi',
    style: 'Christmas Lager',
    abv: 5.0,
    country: 'Iceland',
    description: 'Classic Christmas lager with malty sweetness.',
    containerSize: 500,
    containerType: 'Bottle',
    productNumber: 'KAL-JOL-500',
    vinbudinUrl: 'https://www.vinbudin.is'
  },
  {
    name: 'Móri',
    brewery: 'Kaldi',
    style: 'Stout',
    abv: 5.2,
    country: 'Iceland',
    description: 'Dark stout with roasted malt character.',
    containerSize: 330,
    containerType: 'Bottle',
    productNumber: 'KAL-MOR-330',
    vinbudinUrl: 'https://www.vinbudin.is'
  },

  // Bríó - Craft brewery
  {
    name: 'Jólahefð',
    brewery: 'Bríó',
    style: 'Christmas Spiced Ale',
    abv: 6.5,
    country: 'Iceland',
    description: 'Heavily spiced Christmas ale with cloves, ginger, and cardamom.',
    containerSize: 330,
    containerType: 'Can',
    productNumber: 'BRI-JOL-330',
    vinbudinUrl: 'https://www.vinbudin.is'
  },
  {
    name: 'Austri',
    brewery: 'Bríó',
    style: 'Lager',
    abv: 4.5,
    country: 'Iceland',
    description: 'Clean and crisp Icelandic lager.',
    containerSize: 500,
    containerType: 'Can',
    productNumber: 'BRI-AUS-500',
    vinbudinUrl: 'https://www.vinbudin.is'
  },

  // Popular international Christmas beers often available in Iceland
  {
    name: 'Julebryg',
    brewery: 'Tuborg',
    style: 'Christmas Lager',
    abv: 5.6,
    country: 'Denmark',
    description: 'Danish Christmas lager, widely available in Iceland.',
    containerSize: 500,
    containerType: 'Bottle',
    productNumber: 'TUB-JUL-500',
    vinbudinUrl: 'https://www.vinbudin.is'
  },
  {
    name: 'Nisseøl',
    brewery: 'Nøgne Ø',
    style: 'Christmas Ale',
    abv: 7.5,
    country: 'Norway',
    description: 'Norwegian Christmas ale with rich malt profile.',
    containerSize: 500,
    containerType: 'Bottle',
    productNumber: 'NOG-NIS-500',
    vinbudinUrl: 'https://www.vinbudin.is'
  },
  {
    name: 'Juleøl',
    brewery: 'Mikkeller',
    style: 'Christmas IPA',
    abv: 6.9,
    country: 'Denmark',
    description: 'Hoppy Christmas IPA from renowned Danish brewery.',
    containerSize: 330,
    containerType: 'Can',
    productNumber: 'MIK-JUL-330',
    vinbudinUrl: 'https://www.vinbudin.is'
  },


  // Craft selections
  {
    name: 'Lava',
    brewery: 'Ölvisholt',
    style: 'Imperial Stout',
    abv: 9.5,
    country: 'Iceland',
    description: 'Bold imperial stout brewed with Icelandic spring water.',
    containerSize: 330,
    containerType: 'Bottle',
    productNumber: 'OLV-LAV-330',
    vinbudinUrl: 'https://www.vinbudin.is'
  },
  {
    name: 'Bruggsmiðjan Jólabjór',
    brewery: 'Bruggsmiðjan',
    style: 'Christmas Ale',
    abv: 6.0,
    country: 'Iceland',
    description: 'Small batch Christmas ale from Grindavík brewery.',
    containerSize: 330,
    containerType: 'Bottle',
    productNumber: 'BRG-JOL-330',
    vinbudinUrl: 'https://www.vinbudin.is'
  }
]

async function seedBeers() {
  console.log('🍺 Seeding beer catalog...')

  let created = 0
  let skipped = 0

  for (const beerData of ICELANDIC_BEERS) {
    try {
      await prisma.beer.upsert({
        where: {
          name_brewery: {
            name: beerData.name,
            brewery: beerData.brewery
          }
        },
        update: {
          ...beerData
        },
        create: {
          ...beerData
        }
      })
      created++
      console.log(`✓ ${beerData.name} - ${beerData.brewery}`)
    } catch (error) {
      console.error(`✗ Failed to seed ${beerData.name}:`, error)
      skipped++
    }
  }

  console.log(`\n📊 Beer catalog seeding complete:`)
  console.log(`   Created/Updated: ${created}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Total in catalog: ${await prisma.beer.count()}`)
}

async function main() {
  try {
    await seedBeers()
  } catch (error) {
    console.error('Error seeding beers:', error)
    throw error
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
