/**
 * Import scraped WB Tourism homestays into the database
 *
 * Usage (run AFTER scrape-wbtourism.js):
 *   node scripts/seed-scraped.js
 *
 * What it does:
 *   - Reads scripts/scraped-homestays.json
 *   - Creates a "scraper" admin user if not exists
 *   - Inserts each homestay with status=pending (needs admin approval)
 *   - Skips duplicates (same name + district)
 */

const { PrismaClient } = require('@prisma/client');
const fs               = require('fs');
const path             = require('path');

const prisma = new PrismaClient();

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

async function main() {
  const filePath = path.join(__dirname, 'scraped-homestays.json');
  if (!fs.existsSync(filePath)) {
    console.error('❌ scraped-homestays.json not found. Run scrape-wbtourism.js first.');
    process.exit(1);
  }

  const homestays = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  console.log(`📦 Importing ${homestays.length} homestays...\n`);

  // Get or create a system user for scraped listings
  let scraperUser = await prisma.user.findFirst({
    where: { mobile: '0000000000' },
  });
  if (!scraperUser) {
    scraperUser = await prisma.user.create({
      data: {
        mobile: '0000000000',
        name:   'WB Tourism (Scraped)',
        role:   'host',
      },
    });
    console.log('Created scraper system user');
  }

  let created = 0;
  let skipped = 0;

  for (const h of homestays) {
    // Check duplicate
    const existing = await prisma.homestay.findFirst({
      where: {
        name:     { equals: h.name,     mode: 'insensitive' },
        district: { equals: h.district, mode: 'insensitive' },
      },
    });
    if (existing) { skipped++; continue; }

    // Generate unique slug
    let baseSlug = slugify(h.name);
    let slug     = baseSlug;
    let counter  = 1;
    while (await prisma.homestay.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    await prisma.homestay.create({
      data: {
        slug,
        name:          h.name,
        district:      h.district,
        state:         'West Bengal',
        address:       h.address || null,
        description:   `Homestay in ${h.district}, West Bengal.`,
        pricePerNight: h.pricePerNight || 1000,
        minStayDays:   1,
        maxStayDays:   30,
        amenities:     [],
        // Contact stored in DB but hidden from public until isPremium = true
        phone:         h.phone || null,
        contactEmail:  h.email || null,
        status:        'pending_review',   // admin must approve
        isFeatured:    false,
        isPremium:     false,
        ownerId:       scraperUser.id,
      },
    });
    created++;
    if (created % 10 === 0) process.stdout.write(`  ${created} imported...\r`);
  }

  console.log(`\n✅ Import complete:`);
  console.log(`   Created : ${created}`);
  console.log(`   Skipped : ${skipped} (duplicates)`);
  console.log(`\n➡ Go to /admin/dashboard to approve listings.`);

  await prisma.$disconnect();
}

main().catch(async e => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
