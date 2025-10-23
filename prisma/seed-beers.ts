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
    description: 'Traditional Icelandic Christmas beer with warming spices and caramel malt character.'
  },
  {
    name: 'Úlfur IPA',
    brewery: 'Borg Brugghús',
    style: 'IPA',
    abv: 5.9,
    country: 'Iceland',
    description: 'Hoppy India Pale Ale with citrus and pine notes.'
  },
  {
    name: 'Garún nr. 19',
    brewery: 'Borg Brugghús',
    style: 'Pilsner',
    abv: 4.6,
    country: 'Iceland',
    description: 'Crisp and refreshing Icelandic pilsner.'
  },

  // Gæðingur - Another Icelandic brewery
  {
    name: 'Jólasúð',
    brewery: 'Gæðingur',
    style: 'Christmas Ale',
    abv: 5.5,
    country: 'Iceland',
    description: 'Festive Christmas ale with notes of cinnamon and orange peel.'
  },
  {
    name: 'Beljandi IPA',
    brewery: 'Gæðingur',
    style: 'IPA',
    abv: 6.2,
    country: 'Iceland',
    description: 'Bold IPA with tropical fruit aromas.'
  },

  // Einstök - Well-known Icelandic brand
  {
    name: 'Icelandic White Ale',
    brewery: 'Einstök',
    style: 'Witbier',
    abv: 5.2,
    country: 'Iceland',
    description: 'Refreshing wheat beer brewed with coriander and orange peel.'
  },
  {
    name: 'Arctic Pale Ale',
    brewery: 'Einstök',
    style: 'Pale Ale',
    abv: 5.6,
    country: 'Iceland',
    description: 'Balanced pale ale with Icelandic water.'
  },
  {
    name: 'Toasted Porter',
    brewery: 'Einstök',
    style: 'Porter',
    abv: 6.0,
    country: 'Iceland',
    description: 'Rich porter with chocolate and coffee notes.'
  },

  // Kaldi - One of Iceland's first microbreweries
  {
    name: 'Jólaöl',
    brewery: 'Kaldi',
    style: 'Christmas Lager',
    abv: 5.0,
    country: 'Iceland',
    description: 'Classic Christmas lager with malty sweetness.'
  },
  {
    name: 'Móri',
    brewery: 'Kaldi',
    style: 'Stout',
    abv: 5.2,
    country: 'Iceland',
    description: 'Dark stout with roasted malt character.'
  },

  // Bríó - Craft brewery
  {
    name: 'Jólahefð',
    brewery: 'Bríó',
    style: 'Christmas Spiced Ale',
    abv: 6.5,
    country: 'Iceland',
    description: 'Heavily spiced Christmas ale with cloves, ginger, and cardamom.'
  },
  {
    name: 'Austri',
    brewery: 'Bríó',
    style: 'Lager',
    abv: 4.5,
    country: 'Iceland',
    description: 'Clean and crisp Icelandic lager.'
  },

  // Popular international Christmas beers often available in Iceland
  {
    name: 'Julebryg',
    brewery: 'Tuborg',
    style: 'Christmas Lager',
    abv: 5.6,
    country: 'Denmark',
    description: 'Danish Christmas lager, widely available in Iceland.'
  },
  {
    name: 'Nisseøl',
    brewery: 'Nøgne Ø',
    style: 'Christmas Ale',
    abv: 7.5,
    country: 'Norway',
    description: 'Norwegian Christmas ale with rich malt profile.'
  },
  {
    name: 'Juleøl',
    brewery: 'Mikkeller',
    style: 'Christmas IPA',
    abv: 6.9,
    country: 'Denmark',
    description: 'Hoppy Christmas IPA from renowned Danish brewery.'
  },

  // Classic Icelandic options
  {
    name: 'Gull',
    brewery: 'Vífilfell',
    style: 'Pilsner',
    abv: 5.0,
    country: 'Iceland',
    description: 'Iceland's most popular pilsner, a classic choice.'
  },
  {
    name: 'Thule',
    brewery: 'Vífilfell',
    style: 'Pilsner',
    abv: 4.6,
    country: 'Iceland',
    description: 'Light and refreshing Icelandic pilsner.'
  },
  {
    name: 'Boli',
    brewery: 'Egils',
    style: 'Pilsner',
    abv: 2.25,
    country: 'Iceland',
    description: 'Light pilsner-style beer.'
  },

  // Craft selections
  {
    name: 'Lava',
    brewery: 'Ölvisholt',
    style: 'Imperial Stout',
    abv: 9.5,
    country: 'Iceland',
    description: 'Bold imperial stout brewed with Icelandic spring water.'
  },
  {
    name: 'Bruggsmiðjan Jólabjór',
    brewery: 'Bruggsmiðjan',
    style: 'Christmas Ale',
    abv: 6.0,
    country: 'Iceland',
    description: 'Small batch Christmas ale from Grindavík brewery.'
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
