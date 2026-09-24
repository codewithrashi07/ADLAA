const express = require('express');
const { getStore } = require('../store');
const { createApplication, updateStatus, STATUSES } = require('../services/applications');
const { analyse } = require('../services/analysis');

const router = express.Router();

const wrap = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

router.post(
  '/',
  wrap(async (req, res) => {
    const application = await createApplication(req.body || {});
    res.status(201).json({ success: true, data: application });
  })
);

/** Live preview of the analysis engine — used by the form before submitting. */
router.post(
  '/preview',
  wrap(async (req, res) => {
    const { category = '', service = '', description = '', age } = req.body || {};
    res.json({ success: true, data: analyse({ category, service, description, age }) });
  })
);

router.get(
  '/',
  wrap(async (req, res) => {
    const { status, category, difficulty, search, page = 1, limit = 20 } = req.query;
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const { items, total } = await getStore().list({ status, category, difficulty, search, page, limit: safeLimit });
    res.json({
      success: true,
      data: items,
      pagination: { page: Number(page), limit: safeLimit, total, pages: Math.max(1, Math.ceil(total / safeLimit)) }
    });
  })
);

router.get(
  '/latest',
  wrap(async (_req, res) => {
    const application = await getStore().findLatest();
    if (!application) return res.status(404).json({ success: false, error: 'No applications submitted yet.' });
    res.json({ success: true, data: application });
  })
);

router.get(
  '/track/:trackingId',
  wrap(async (req, res) => {
    const application = await getStore().findByTracking(req.params.trackingId);
    if (!application) return res.status(404).json({ success: false, error: 'No application found for that tracking ID.' });
    res.json({ success: true, data: application });
  })
);

router.get(
  '/:id',
  wrap(async (req, res) => {
    const application = await getStore().findById(req.params.id);
    if (!application) return res.status(404).json({ success: false, error: 'Application not found.' });
    res.json({ success: true, data: application });
  })
);

router.patch(
  '/:id',
  wrap(async (req, res) => {
    const { status, note } = req.body || {};
    const application = await updateStatus(req.params.id, status, note);
    if (!application) return res.status(404).json({ success: false, error: 'Application not found.' });
    res.json({ success: true, data: application });
  })
);

router.delete(
  '/:id',
  wrap(async (req, res) => {
    const removed = await getStore().remove(req.params.id);
    if (!removed) return res.status(404).json({ success: false, error: 'Application not found.' });
    res.json({ success: true, data: { id: req.params.id } });
  })
);

module.exports = { router, STATUSES };
