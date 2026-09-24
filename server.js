require('dotenv').config();

const { createApp } = require('./src/app');
const { initStore } = require('./src/store');

const PORT = Number(process.env.PORT) || 3000;

async function main() {
  const store = await initStore({ mongoUri: process.env.MONGODB_URI });
  const app = createApp();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ADLAA running on http://localhost:${PORT}`);
    console.log(`Storage backend: ${store.label}`);
  });
}

main().catch((error) => {
  console.error('Failed to start ADLAA:', error);
  process.exit(1);
});
