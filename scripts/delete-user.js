#!/usr/bin/env node
/**
 * delete-user.js — safely delete a user and all their data
 * Usage:  node scripts/delete-user.js <mobile>
 * Example: node scripts/delete-user.js 9800012345
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const mobile = process.argv[2]?.trim();

  if (!mobile) {
    console.error('❌  Usage: node scripts/delete-user.js <mobile>');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { mobile } });
  if (!user) {
    console.error(`❌  No user found with mobile: ${mobile}`);
    process.exit(1);
  }

  console.log(`\n👤  Found user:`);
  console.log(`    Name   : ${user.name ?? '(none)'}`);
  console.log(`    Mobile : ${user.mobile}`);
  console.log(`    Role   : ${user.role}`);
  console.log(`    ID     : ${user.id}`);

  // Count what will be deleted
  const homestayCount = await prisma.homestay.count({ where: { ownerId: user.id } });
  const bookingCount  = await prisma.booking.count({ where: { guestId: user.id } });

  console.log(`\n🗑️   Will delete:`);
  console.log(`    ${homestayCount} homestay listing(s)`);
  console.log(`    ${bookingCount}  booking(s) as guest`);

  // Delete in correct order to avoid foreign key errors
  await prisma.$transaction(async (tx) => {

    // 1. Delete bookings on host's homestays
    if (homestayCount > 0) {
      const homestayIds = (await tx.homestay.findMany({
        where: { ownerId: user.id }, select: { id: true }
      })).map(h => h.id);

      await tx.booking.deleteMany({ where: { homestayId: { in: homestayIds } } });
      await tx.review.deleteMany({ where: { homestayId: { in: homestayIds } } });
    }

    // 2. Delete guest's own bookings and reviews
    await tx.booking.deleteMany({ where: { guestId: user.id } });
    await tx.review.deleteMany({ where: { userId: user.id } });

    // 3. Delete homestays (rooms, images, categories cascade automatically)
    await tx.homestay.deleteMany({ where: { ownerId: user.id } });

    // 4. Finally delete the user
    await tx.user.delete({ where: { id: user.id } });
  });

  console.log(`\n✅  User and all associated data deleted successfully.`);
}

main()
  .catch(err => {
    console.error('❌  Error:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
