const { createApp } = require('../src/app');
const { initStore } = require('../src/store');
const { seedIfEmpty } = require('../src/services/seed');

let bootstrapped = null;

async function bootstrap() {
  await initStore({ mongoUri: process.env.MONGODB_URI });
  if (process.env.ADLAA_SEED !== 'false') await seedIfEmpty();
  return createApp();
}

module.exports = async (req, res) => {
  bootstrapped = bootstrapped || bootstrap();
  const app = await bootstrapped;
  return app(req, res);
};
