/**
 * Run this ONCE after the migration to mark your actual registered homestay(s)
 * as selfRegistered=true so they appear in the host management UI.
 *
 * Usage:
 *   node --env-file=.env scripts/mark-self-registered.js
 *
 * It will print all homestays owned by you (Sujay Mondal) and mark any that
 * are NOT from the scraped dataset. Edit the NAMES array below to list your
 * real property names exactly.
 */

const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

// ← Put your actual homestay name(s) here (exact match)
const NAMES = ['Gitanjali Homestay'];

async function main() {
  // Show all current homestays under Sujay's account
  const all = await p.homestay.findMany({
    where: { owner: { mobile: '9830614868' } },
    select: { id: true, name: true, selfRegistered: true, status: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`\nTotal homestays under your account: ${all.length}`);
  console.log('\nID                                    | selfRegistered | name');
  console.log('----------------------------------------------------------------------');
  all.forEach(h => console.log(`${h.id} | ${String(h.selfRegistered).padEnd(14)} | ${h.name}`));

  const toMark = all.filter(h => NAMES.includes(h.name));
  if (toMark.length === 0) {
    console.log('\n⚠️  No homestays matched NAMES array. Edit the NAMES list in this script and re-run.');
    return;
  }

  const result = await p.homestay.updateMany({
    where: { id: { in: toMark.map(h => h.id) } },
    data:  { selfRegistered: true },
  });

  console.log(`\n✅ Marked ${result.count} homestay(s) as selfRegistered=true:`);
  toMark.forEach(h => console.log(`   → ${h.name}`));
  console.log('\nDone. These listings will now appear in your host management pages.');
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());
