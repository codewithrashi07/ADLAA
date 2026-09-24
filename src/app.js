const path = require('path');
const express = require('express');
const cors = require('cors');

const { getStore } = require('./store');
const { router: applicationsRouter } = require('./routes/applications');
const catalogRouter = require('./routes/catalog');
const statsRouter = require('./routes/stats');

function createApp() {
  const app = express();
  const publicDir = path.join(__dirname, '..', 'public');

  app.use(cors());
  app.use(express.json({ limit: '100kb' }));
  app.use(express.static(publicDir, { extensions: ['html'] }));

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok', storage: getStore().label, uptime: Math.round(process.uptime()) } });
  });

  app.use('/api/applications', applicationsRouter);
  app.use('/api/catalog', catalogRouter);
  app.use('/api/stats', statsRouter);

  app.use('/api', (_req, res) => {
    res.status(404).json({ success: false, error: 'Unknown API endpoint.' });
  });

  app.use((_req, res) => {
    res.status(404).sendFile(path.join(publicDir, '404.html'));
  });

  // eslint-disable-next-line no-unused-vars
  app.use((error, _req, res, _next) => {
    const status = error.statusCode || 500;
    if (status >= 500) console.error('[error]', error);
    res.status(status).json({
      success: false,
      error: status >= 500 ? 'Something went wrong on the server.' : error.message,
      fields: error.fields
    });
  });

  return app;
}

module.exports = { createApp };
