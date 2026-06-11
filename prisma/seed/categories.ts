import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  // Wildlife
  { group: 'wildlife', name: 'Wildlife Sanctuaries',    slug: 'wildlife-sanctuaries'    },
  { group: 'wildlife', name: 'Zoological Parks',        slug: 'zoological-parks'        },
  { group: 'wildlife', name: 'Bird Watching',           slug: 'bird-watching'           },
  { group: 'wildlife', name: 'National Parks',          slug: 'national-parks'          },
  // Heritage
  { group: 'heritage', name: 'Monuments',               slug: 'monuments'               },
  { group: 'heritage', name: 'Museums',                 slug: 'museums'                 },
  { group: 'heritage', name: 'Historical Buildings',    slug: 'historical-buildings'    },
  { group: 'heritage', name: 'UNESCO World Heritage',   slug: 'unesco-world-heritage'   },
  { group: 'heritage', name: 'Archeological Sites',     slug: 'archeological-sites'     },
  { group: 'heritage', name: 'Historical Sites',        slug: 'historical-sites'        },
  { group: 'heritage', name: 'Palaces & Forts',         slug: 'palaces-forts'           },
  // Spiritual
  { group: 'spiritual', name: 'Hinduism',               slug: 'hinduism'                },
  { group: 'spiritual', name: 'Islam',                  slug: 'islam'                   },
  { group: 'spiritual', name: 'Buddhism',               slug: 'buddhism'                },
  { group: 'spiritual', name: 'Sikhism',                slug: 'sikhism'                 },
  { group: 'spiritual', name: 'Jainism',                slug: 'jainism'                 },
  { group: 'spiritual', name: 'Christianity',           slug: 'christianity'            },
  { group: 'spiritual', name: 'Jewish',                 slug: 'jewish'                  },
  // Adventure
  { group: 'adventure', name: 'Rafting',                slug: 'rafting'                 },
  { group: 'adventure', name: 'Paragliding',            slug: 'paragliding'             },
  { group: 'adventure', name: 'Parasailing',            slug: 'parasailing'             },
  { group: 'adventure', name: 'Skiing',                 slug: 'skiing'                  },
  { group: 'adventure', name: 'Sky Diving',             slug: 'sky-diving'              },
  { group: 'adventure', name: 'Bungee Jumping',         slug: 'bungee-jumping'          },
  { group: 'adventure', name: 'Mountain Biking',        slug: 'mountain-biking'         },
  { group: 'adventure', name: 'Hiking & Trekking',      slug: 'hiking-trekking'         },
  { group: 'adventure', name: 'Mountaineering',         slug: 'mountaineering'          },
  // Rural
  { group: 'rural', name: 'Agro Tourism',               slug: 'agro-tourism'            },
  { group: 'rural', name: 'Crafts Tourism',             slug: 'crafts-tourism'          },
  { group: 'rural', name: 'Tribal Tourism',             slug: 'tribal-tourism'          },
  { group: 'rural', name: 'Eco Tourism',                slug: 'eco-tourism'             },
  { group: 'rural', name: 'Wildlife Tourism',           slug: 'wildlife-tourism'        },
  // Nature
  { group: 'nature', name: 'Sustainable Tourism',       slug: 'sustainable-tourism'     },
  { group: 'nature', name: 'Beaches & Cruises',         slug: 'beaches-cruises'         },
  { group: 'nature', name: 'Hills & Mountains',         slug: 'hills-mountains'         },
  { group: 'nature', name: 'Forests & Gardens',         slug: 'forests-gardens'         },
  { group: 'nature', name: 'Rivers & Lakes',            slug: 'rivers-lakes'            },
] as const;

async function main() {
  console.log('Seeding categories...');

  for (const cat of categories) {
    await prisma.category.upsert({
      where:  { slug: cat.slug },
      update: { name: cat.name, group: cat.group as any },
      create: { name: cat.name, slug: cat.slug, group: cat.group as any },
    });
  }

  console.log(`Done — ${categories.length} categories seeded.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
