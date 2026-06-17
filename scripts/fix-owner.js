const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

p.homestay.updateMany({
  where: { ownerId: '58874237-693a-4fcc-a7cb-ae74bf86fd82' },
  data:  { ownerId: '1612a54c-bc46-4d17-ad7d-94e1296876da' },
}).then(r => console.log('Updated:', r.count, 'homestays'))
  .finally(() => p.$disconnect());
