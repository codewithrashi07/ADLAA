const os = require('os');
const path = require('path');
const JsonStore = require('./jsonStore');
const MongoStore = require('./mongoStore');

let activeStore = null;

// Serverless platforms ship a read-only bundle with a writable temp directory.
const READ_ONLY_FS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

function defaultDataFile() {
  if (process.env.ADLAA_DATA_FILE) return process.env.ADLAA_DATA_FILE;
  const base = READ_ONLY_FS ? path.join(os.tmpdir(), 'adlaa') : path.join(process.cwd(), 'data');
  return path.join(base, 'applications.json');
}

/**
 * Picks MongoDB when MONGODB_URI is configured and reachable, otherwise falls
 * back to the JSON file store so the application never fails to boot.
 */
async function initStore({ mongoUri, dataFile } = {}) {
  const file = dataFile || defaultDataFile();

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
