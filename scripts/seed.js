require('dotenv').config();

const { initStore, getStore } = require('../src/store');
const { seedDemoData } = require('../src/services/seed');

async function main() {
  await initStore({ mongoUri: process.env.MONGODB_URI });
  const count = await seedDemoData({ reset: true });

  console.log(`Seeded ${count} demo applications into ${getStore().label}.`);
  process.exit(0);
}

main().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
