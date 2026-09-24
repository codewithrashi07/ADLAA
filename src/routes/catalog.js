const express = require('express');
const { CATEGORIES, getCategory } = require('../data/catalog');
const { STATUSES } = require('../services/applications');

const router = express.Router();

router.get('/categories', (_req, res) => {
  res.json({
    success: true,
    data: CATEGORIES.map(({ id, name, icon, description, averageDays, services }) => ({
      id,
      name,
      icon,
      description,
      averageDays,
      serviceCount: services.length
    }))
  });
});

router.get('/categories/:id/services', (req, res) => {
  const category = getCategory(req.params.id);
  if (!category) return res.status(404).json({ success: false, error: 'Unknown category.' });
  res.json({ success: true, data: category.services });
});

router.get('/statuses', (_req, res) => {
  res.json({ success: true, data: STATUSES });
});

module.exports = router;
