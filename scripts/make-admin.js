#!/usr/bin/env node
/**
 * make-admin.js
 * Usage:  node scripts/make-admin.js <10-digit-mobile>
 * Example: node scripts/make-admin.js 9800012345
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const mobile = process.argv[2]?.trim();

  if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
    console.error('❌  Please provide a valid 10-digit Indian mobile number.');
    console.error('    Usage: node scripts/make-admin.js 9800012345');
    process.exit(1);
  }

  // Check if user exists
  let user = await prisma.user.findUnique({ where: { mobile } });

  if (!user) {
    // Create the admin user if not registered yet
    user = await prisma.user.create({
      data: { mobile, role: 'admin', tier: 'paid' },
    });
    console.log(`✅  New admin user created`);
  } else {
    // Upgrade existing user to admin
    user = await prisma.user.update({
      where: { mobile },
      data:  { role: 'admin', tier: 'paid' },
    });
    console.log(`✅  Existing user upgraded to admin`);
  }

  console.log(`\n👤  User details:`);
  console.log(`    ID      : ${user.id}`);
  console.log(`    Mobile  : ${user.mobile}`);
  console.log(`    Name    : ${user.name ?? '(not set)'}`);
  console.log(`    Role    : ${user.role}`);
  console.log(`    Tier    : ${user.tier}`);
  console.log(`\n🔐  Login with OTP at: http://localhost:3000/login`);
  console.log(`    Then visit: http://localhost:3000/admin`);
}

main()
  .catch(err => {
    console.error('❌  Error:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
