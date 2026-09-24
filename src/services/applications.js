const crypto = require('crypto');
const { getStore } = require('../store');
const { getCategory, categoryName } = require('../data/catalog');
const { analyse } = require('./analysis');

const STATUSES = ['Submitted', 'In Review', 'Action Needed', 'Approved', 'Rejected'];

class ValidationError extends Error {
  constructor(fields) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.statusCode = 422;
    this.fields = fields;
  }
}

function text(value) {
  return String(value ?? '').trim();
}

function validate(payload) {
  const fields = {};

  const name = text(payload.name);
  if (!name) fields.name = 'Please enter your full name.';
  else if (name.length < 2) fields.name = 'Name looks too short.';
  else if (name.length > 80) fields.name = 'Name must be under 80 characters.';

  const age = Number(payload.age);
  if (!text(payload.age)) fields.age = 'Please enter your age.';
  else if (!Number.isFinite(age) || age < 1 || age > 120) fields.age = 'Please enter a valid age between 1 and 120.';

  const location = text(payload.location);
  if (!location) fields.location = 'Please enter your city or district.';

  const category = text(payload.category).toLowerCase();
  if (!category) fields.category = 'Please select a service category.';
  else if (!getCategory(category)) fields.category = 'Unknown service category.';

  const service = text(payload.service);
  if (!service) fields.service = 'Please enter the required service.';

  const description = text(payload.description);
  if (!description) fields.description = 'Please describe your requirement.';
  else if (description.length < 10) fields.description = 'Please add a little more detail (at least 10 characters).';
  else if (description.length > 1000) fields.description = 'Description must be under 1000 characters.';

  if (Object.keys(fields).length) throw new ValidationError(fields);

  return { name, age, location, category, service, description };
}

function generateTrackingId() {
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  const stamp = Date.now().toString(36).slice(-4).toUpperCase();
  return `ADL-${stamp}-${random}`;
}

function sanitiseMetrics(metrics = {}) {
  const clamp = (value) => {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? Math.min(Math.round(number), 100000) : 0;
  };
  return {
    taskTime: clamp(metrics.taskTime),
    clicks: clamp(metrics.clicks),
    validationErrors: clamp(metrics.validationErrors),
    backActions: clamp(metrics.backActions),
    helpRequests: clamp(metrics.helpRequests)
  };
}

async function createApplication(payload) {
  const clean = validate(payload);
  const analysis = analyse(clean);
  const now = new Date().toISOString();

  return getStore().create({
    trackingId: generateTrackingId(),
    ...clean,
    categoryName: categoryName(clean.category),
    difficulty: analysis.difficulty,
    score: analysis.score,
    confidence: analysis.confidence,
    estimatedDays: analysis.estimatedDays,
    matchedService: analysis.matchedService,
    requiredDocuments: analysis.requiredDocuments,
    suggestedServices: analysis.suggestedServices,
    scoreBreakdown: analysis.scoreBreakdown,
    actionPlan: analysis.actionPlan,
    nextStep: analysis.nextStep,
    resultMessage: analysis.resultMessage,
    status: 'Submitted',
    metrics: sanitiseMetrics(payload.metrics),
    timeline: [{ status: 'Submitted', note: 'Application received by ADLAA.', at: now }],
    createdAt: now,
    updatedAt: now
  });
}

async function updateStatus(id, status, note = '') {
  if (!STATUSES.includes(status)) throw new ValidationError({ status: `Status must be one of: ${STATUSES.join(', ')}` });

  const existing = await getStore().findById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const timeline = [...(existing.timeline || []), { status, note: note || `Status changed to ${status}.`, at: now }];

  return getStore().update(id, { status, timeline, updatedAt: now });
}

module.exports = { createApplication, updateStatus, validate, ValidationError, STATUSES, sanitiseMetrics };
