/**
 * WB Tourism Homestay Scraper
 * Source: https://www.wbtourism.gov.in/home/dist_list_homestay
 *
 * Usage:
 *   node scripts/scrape-wbtourism.js
 *
 * Output:
 *   scripts/scraped-homestays.json
 *
 * Install deps first:
 *   npm install axios cheerio --save-dev
 */

const axios   = require('axios');
const cheerio = require('cheerio');
const fs      = require('fs');
const path    = require('path');

const BASE_URL = 'https://www.wbtourism.gov.in';
const DELAY_MS = 1200; // polite delay between requests

// Known district page IDs from wbtourism.gov.in
const DISTRICT_PAGES = [
  { name: 'Darjeeling',        id: 309 },
  { name: 'Kalimpong',         id: 310 },
  { name: 'Jalpaiguri',        id: 311 },
  { name: 'Alipurduar',        id: 312 },
  { name: 'Cooch Behar',       id: 313 },
  { name: 'Malda',             id: 314 },
  { name: 'Murshidabad',       id: 319 },
  { name: 'Birbhum',           id: 316 },
  { name: 'Bankura',           id: 317 },
  { name: 'Purulia',           id: 318 },
  { name: 'Jhargram',          id: 320 },
  { name: 'West Midnapore',    id: 321 },
  { name: 'East Midnapore',    id: 322 },
  { name: 'South 24 Parganas', id: 323 },
  { name: 'North 24 Parganas', id: 303 },
  { name: 'Nadia',             id: 324 },
  { name: 'Hooghly',           id: 325 },
  { name: 'Howrah',            id: 326 },
  { name: 'Kolkata',           id: 327 },
  { name: 'Bardhaman',         id: 328 },
  { name: 'Sundarbans',        id: 702 },
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPage(url) {
  try {
    const res = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BengalHomestayBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    return res.data;
  } catch (err) {
    console.warn(`  ⚠ Failed to fetch ${url}: ${err.message}`);
    return null;
  }
}

function parseHomestayPage(html, district) {
  const $        = cheerio.load(html);
  const results  = [];

  // WB Tourism tables: each row is a homestay
  // Typical columns: S.No | Name | Address | Phone | Email | Rooms | Price
  $('table tbody tr').each((_, row) => {
    const cells = $(row).find('td').map((_, td) => $(td).text().trim()).get();
    if (cells.length < 3) return;

    // Skip header rows
    if (cells[0].toLowerCase().includes('s.no') || cells[0].toLowerCase().includes('sl')) return;

    const name    = cells[1] || cells[0] || '';
    const address = cells[2] || '';
    const phone   = cells.find(c => /^\+?[\d\s\-()]{8,}$/.test(c.replace(/\D/g, '').slice(0,10))) || '';
    const email   = cells.find(c => c.includes('@')) || '';

    // Extract price if present (look for ₹ or numbers like 500-2000)
    const priceCell = cells.find(c => /₹|rs\.?|inr|\d{3,4}/i.test(c));
    let pricePerNight = 0;
    if (priceCell) {
      const match = priceCell.match(/(\d{3,6})/);
      if (match) pricePerNight = parseInt(match[1], 10);
    }

    if (!name || name.length < 3) return;

    results.push({
      name:          name.replace(/\s+/g, ' ').trim(),
      district,
      address:       address.replace(/\s+/g, ' ').trim(),
      phone:         phone.replace(/\s+/g, ' ').trim(),
      email:         email.toLowerCase().trim(),
      pricePerNight: pricePerNight || 1000, // default if not found
      source:        'wbtourism.gov.in',
      status:        'pending',             // needs admin approval
    });
  });

  // Fallback: some pages use divs/cards instead of tables
  if (results.length === 0) {
    $('.homestay-item, .card, .listing-item').each((_, el) => {
      const name    = $(el).find('h2,h3,h4,.name,.title').first().text().trim();
      const address = $(el).find('.address,.location,address').first().text().trim();
      const phone   = $(el).find('.phone,.contact,[href^="tel:"]').first().text().trim();
      if (name && name.length > 3) {
        results.push({
          name, district, address, phone,
          email: '', pricePerNight: 1000,
          source: 'wbtourism.gov.in', status: 'pending',
        });
      }
    });
  }

  return results;
}

async function scrapeDistrict(district, id) {
  const url  = `${BASE_URL}/home-stay-page/${id}`;
  console.log(`  Fetching ${district} → ${url}`);
  const html = await fetchPage(url);
  if (!html) return [];

  const results = parseHomestayPage(html, district);
  console.log(`  ✓ ${district}: ${results.length} homestays found`);
  return results;
}

async function main() {
  console.log('🏡 WB Tourism Homestay Scraper\n');

  // First, try the main listing page to discover any IDs we missed
  console.log('Fetching district list...');
  const mainHtml = await fetchPage(`${BASE_URL}/home/dist_list_homestay`);
  if (mainHtml) {
    const $     = cheerio.load(mainHtml);
    const found = [];
    $('a[href*="home-stay-page"]').each((_, el) => {
      const href  = $(el).attr('href') || '';
      const match = href.match(/home-stay-page\/(\d+)/);
      const name  = $(el).text().trim();
      if (match && name) {
        found.push({ name, id: parseInt(match[1], 10) });
      }
    });
    if (found.length > 0) {
      console.log(`Found ${found.length} districts on main page:`);
      found.forEach(d => console.log(`  ${d.name} → ID ${d.id}`));
      // Merge with our known list (prefer discovered)
      found.forEach(f => {
        const existing = DISTRICT_PAGES.find(d => d.id === f.id);
        if (!existing) DISTRICT_PAGES.push(f);
      });
    }
  }
  await sleep(DELAY_MS);

  const allHomestays = [];

  for (const { name, id } of DISTRICT_PAGES) {
    const homestays = await scrapeDistrict(name, id);
    allHomestays.push(...homestays);
    await sleep(DELAY_MS);
  }

  // Deduplicate by name+district
  const seen    = new Set();
  const unique  = allHomestays.filter(h => {
    const key = `${h.name}||${h.district}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const outPath = path.join(__dirname, 'scraped-homestays.json');
  fs.writeFileSync(outPath, JSON.stringify(unique, null, 2));

  console.log(`\n✅ Done! ${unique.length} unique homestays saved to:\n   ${outPath}`);
  console.log('\nNext step: run the seed script to import into your database:');
  console.log('   node scripts/seed-scraped.js');
}

main().catch(console.error);
