const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const [bookings, hosts] = await Promise.all([
    p.booking.findMany({
      include: {
        homestay: { select: { name: true, ownerId: true } },
        guest:    { select: { name: true, mobile: true } },
      },
    }),
    p.user.findMany({
      where:  { role: 'host' },
      select: { id: true, name: true, mobile: true },
    }),
  ]);

  console.log('\n=== HOSTS ===');
  hosts.forEach(h => console.log(`  ${h.name ?? 'unnamed'} | ${h.mobile} | id: ${h.id}`));

  console.log('\n=== BOOKINGS ===');
  bookings.forEach(b => console.log(`  Homestay: ${b.homestay.name} | ownerId: ${b.homestay.ownerId} | Guest: ${b.guest.mobile} | Status: ${b.status}`));

  console.log('\n=== MATCH CHECK ===');
  const hostIds = new Set(hosts.map(h => h.id));
  bookings.forEach(b => {
    const match = hostIds.has(b.homestay.ownerId) ? '✅ MATCH' : '❌ NO MATCH';
    console.log(`  ${match} — ${b.homestay.name}`);
  });
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());
