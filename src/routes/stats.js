const express = require('express');
const { buildStats } = require('../services/stats');

const router = express.Router();

router.get('/', (_req, res, next) => {
  buildStats()
    .then((stats) => res.json({ success: true, data: stats }))
    .catch(next);
});

module.exports = router;
