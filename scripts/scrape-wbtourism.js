/**
 * WB Tourism Homestay Scraper — Auto-pagination version
 *
 * HOW TO USE:
 *   node scripts/scrape-wbtourism.js
 *   node scripts/seed-scraped.js
 *
 * The scraper fetches every page for each district automatically,
 * stopping when a page returns 0 homestay cards.
 *
 * Install once:  npm install axios cheerio --save-dev
 */

const axios     = require('axios');
const cheerio   = require('cheerio');
const fs        = require('fs');
const path      = require('path');
const https     = require('https');
const constants = require('constants');

// ═════════════════════════════════════════════════════════════════════════════
//  One base URL per district — scraper auto-fetches ALL pages until empty
// ═════════════════════════════════════════════════════════════════════════════
const DISTRICTS = [
  { district: 'Alipurduar',        url: 'https://www.wbtourism.gov.in/home-stay-page/664' },
  { district: 'Bankura',           url: 'https://www.wbtourism.gov.in/home-stay-page/305' },
  { district: 'Birbhum',           url: 'https://www.wbtourism.gov.in/home-stay-page/307' },
  { district: 'Cooch Behar',       url: 'https://www.wbtourism.gov.in/home-stay-page/308' },
  { district: 'Dakshin Dinajpur',  url: 'https://www.wbtourism.gov.in/home-stay-page/310' },
  { district: 'Darjeeling',        url: 'https://www.wbtourism.gov.in/home-stay-page/309' },
  { district: 'Hooghly',           url: 'https://www.wbtourism.gov.in/home-stay-page/312' },
  { district: 'Howrah',            url: 'https://www.wbtourism.gov.in/home-stay-page/313' },
  { district: 'Jalpaiguri',        url: 'https://www.wbtourism.gov.in/home-stay-page/314' },
  { district: 'Jhargram',          url: 'https://www.wbtourism.gov.in/home-stay-page/703' },
  { district: 'Kalimpong',         url: 'https://www.wbtourism.gov.in/home-stay-page/702' },
  { district: 'Kolkata',           url: 'https://www.wbtourism.gov.in/home-stay-page/315' },
  { district: 'Malda',             url: 'https://www.wbtourism.gov.in/home-stay-page/316' },
  { district: 'Murshidabad',       url: 'https://www.wbtourism.gov.in/home-stay-page/319' },
  { district: 'Nadia',             url: 'https://www.wbtourism.gov.in/home-stay-page/320' },
  { district: 'North 24 Parganas', url: 'https://www.wbtourism.gov.in/home-stay-page/303' },
  { district: 'Paschim Bardhaman', url: 'https://www.wbtourism.gov.in/home-stay-page/704' },
  { district: 'Paschim Medinipur', url: 'https://www.wbtourism.gov.in/home-stay-page/318' },
  { district: 'Purba Bardhaman',   url: 'https://www.wbtourism.gov.in/home-stay-page/306' },
  { district: 'Purba Medinipur',   url: 'https://www.wbtourism.gov.in/home-stay-page/317' },
  { district: 'Purulia',           url: 'https://www.wbtourism.gov.in/home-stay-page/321' },
  { district: 'South 24 Parganas', url: 'https://www.wbtourism.gov.in/home-stay-page/304' },
  { district: 'Uttar Dinajpur',    url: 'https://www.wbtourism.gov.in/home-stay-page/311' },
];
// ═════════════════════════════════════════════════════════════════════════════

const DELAY_MS = 1000;

const httpsAgent = new https.Agent({
  secureOptions: constants.SSL_OP_LEGACY_SERVER_CONNECT,
  rejectUnauthorized: false,
});

const http = axios.create({
  timeout:    20000,
  httpsAgent,
  headers: {
    'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    'Accept':          'text/html,application/xhtml+xml',
    'Accept-Language': 'en-IN,en;q=0.9',
    'Referer':         'https://www.wbtourism.gov.in/',
  },
});

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchHtml(url) {
  try {
    const res = await http.get(url);
    return res.data;
  } catch (err) {
    console.warn(`  ⚠ ${url}\n    ${err.message}`);
    return null;
  }
}

function extractPhone(text) {
  const m = text.match(/(\+?91[-.\s]?)?([6-9]\d{9}|0\d{2,4}[-\s]\d{6,8})/);
  return m ? m[0].replace(/\s+/g, ' ').trim() : '';
}

function extractEmail(cells) {
  return cells.find(c => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.trim())) || '';
}

function extractPrice(cells) {
  for (const c of cells) {
    if (/₹|rs\.?|inr|tariff|charge|per.?night/i.test(c)) {
      const m = c.match(/(\d{3,6})/);
      if (m) return parseInt(m[1], 10);
    }
  }
  return 0;
}

function getSpanText($, $el, label) {
  let val = '';
  $el.find('p').each((_, p) => {
    const text = $(p).text();
    if (text.toLowerCase().includes(label.toLowerCase())) {
      val = $(p).find('span').text().replace(/\s+/g, ' ').trim();
    }
  });
  return val;
}

function parseRows(html, district) {
  const $       = cheerio.load(html);
  const results = [];

  // WB Tourism uses .home-sty-main cards, one per homestay
  $('.home-sty-main').each((_, card) => {
    const $card = $(card);

    const name  = $card.find('.home-top-h h5').text().replace(/\s+/g, ' ').trim();
    const owner = $card.find('.home-bottom-link h6').text().replace(/\s+/g, ' ').trim();

    if (!name || name.length < 3) return;

    const phone         = getSpanText($, $card, 'Phone');
    const email         = getSpanText($, $card, 'Email');
    const address       = getSpanText($, $card, 'Address');
    const subdivision   = getSpanText($, $card, 'Sub Division');
    const block         = getSpanText($, $card, 'Block');
    const village       = getSpanText($, $card, 'Village');
    const policeStation = getSpanText($, $card, 'Police Station');
    const landmark      = getSpanText($, $card, 'Land Mark');

    const fullAddress = [address, village, block, subdivision, policeStation, landmark]
      .filter(Boolean).join(', ');

    results.push({
      name,
      owner,
      district,
      address:       fullAddress || address,
      subdivision,
      block,
      village,
      phone,
      email,
      pricePerNight: 1000, // WB Tourism doesn't show price — set default
      source:        'wbtourism.gov.in',
      status:        'pending',
    });
  });

  return results;
}

async function main() {
  console.log(`🏡 WB Tourism Scraper — ${DISTRICTS.length} districts, auto-paginating\n`);

  const all = [];

  for (const { district, url } of DISTRICTS) {
    console.log(`\n📍 ${district}`);

    let pageNum    = 1;
    let distTotal  = 0;

    while (true) {
      const pageUrl = pageNum === 1 ? url : `${url}?page=${pageNum}`;
      process.stdout.write(`  Page ${pageNum}: fetching... `);

      const html = await fetchHtml(pageUrl);

      if (!html) {
        console.log('FAILED — stopping district');
        break;
      }

      const rows = parseRows(html, district);
      console.log(`${rows.length} homestays`);

      if (rows.length === 0) {
        // Empty page = no more data for this district
        break;
      }

      all.push(...rows);
      distTotal += rows.length;
      pageNum++;
      await sleep(DELAY_MS);
    }

    console.log(`  ✓ ${distTotal} total for ${district} (${pageNum - 1} page(s))`);
  }

  // Deduplicate by name + district
  const seen   = new Set();
  const unique = all.filter(h => {
    const key = `${h.name}||${h.district}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });

  const outPath = path.join(__dirname, 'scraped-homestays.json');
  fs.writeFileSync(outPath, JSON.stringify(unique, null, 2));

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`✅ ${unique.length} unique homestays saved → ${outPath}`);
  console.log(`   (${all.length - unique.length} duplicates removed)`);
  console.log(`\nNext: node scripts/seed-scraped.js`);
}

main().catch(console.error);
