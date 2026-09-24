const { getStore } = require('../store');
const { CATEGORIES } = require('../data/catalog');
const { STATUSES } = require('./applications');

function average(values) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function dayKey(iso) {
  return String(iso).slice(0, 10);
}

/** Aggregates every stored application into the numbers the dashboard renders. */
async function buildStats() {
  const records = await getStore().all();
  const metrics = records.map((record) => record.metrics || {});

  const byDifficulty = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  records.forEach((record) => {
    if (byDifficulty[record.difficulty] !== undefined) byDifficulty[record.difficulty] += 1;
  });

  const byStatus = Object.fromEntries(STATUSES.map((status) => [status, 0]));
  records.forEach((record) => {
    if (byStatus[record.status] !== undefined) byStatus[record.status] += 1;
  });

  const byCategory = CATEGORIES.map((category) => ({
    id: category.id,
    name: category.name,
    count: records.filter((record) => record.category === category.id).length
  })).sort((a, b) => b.count - a.count);

  const days = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - offset);
    const key = dayKey(date.toISOString());
    days.push({
      date: key,
      label: date.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' }),
      count: records.filter((record) => dayKey(record.createdAt) === key).length
    });
  }

  const resolved = records.filter((record) => ['Approved', 'Rejected'].includes(record.status)).length;

  return {
    total: records.length,
    resolved,
    resolutionRate: records.length ? Math.round((resolved / records.length) * 100) : 0,
    byDifficulty,
    byStatus,
    byCategory,
    trend: days,
    averages: {
      taskTime: average(metrics.map((metric) => Number(metric.taskTime) || 0)),
      clicks: average(metrics.map((metric) => Number(metric.clicks) || 0)),
      validationErrors: average(metrics.map((metric) => Number(metric.validationErrors) || 0)),
      backActions: average(metrics.map((metric) => Number(metric.backActions) || 0)),
      helpRequests: average(metrics.map((metric) => Number(metric.helpRequests) || 0)),
      estimatedDays: average(records.map((record) => Number(record.estimatedDays) || 0)),
      confidence: average(records.map((record) => Number(record.confidence) || 0))
    },
    topLocations: Object.entries(
      records.reduce((acc, record) => {
        const key = record.location || 'Unknown';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([location, count]) => ({ location, count })),
    generatedAt: new Date().toISOString()
  };
}

module.exports = { buildStats };
