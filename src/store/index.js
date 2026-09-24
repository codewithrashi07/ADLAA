const path = require('path');
const JsonStore = require('./jsonStore');
const MongoStore = require('./mongoStore');

let activeStore = null;

/**
 * Picks MongoDB when MONGODB_URI is configured and reachable, otherwise falls
 * back to the JSON file store so the application never fails to boot.
 */
async function initStore({ mongoUri, dataFile } = {}) {
  const file = dataFile || path.join(process.cwd(), 'data', 'applications.json');

  if (mongoUri) {
    try {
      activeStore = await new MongoStore(mongoUri).connect();
      return activeStore;
    } catch (error) {
      console.warn(`[store] MongoDB unavailable (${error.message}). Falling back to local JSON store.`);
    }
  }

  activeStore = await new JsonStore(file).connect();
  return activeStore;
}

function getStore() {
  if (!activeStore) throw new Error('Store has not been initialised. Call initStore() first.');
  return activeStore;
}

module.exports = { initStore, getStore };
