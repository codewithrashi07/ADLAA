const test = require('node:test');
const assert = require('node:assert');

const { analyse } = require('../src/services/analysis');
const { validate, ValidationError, sanitiseMetrics } = require('../src/services/applications');

test('matches a known service and returns its document checklist', () => {
  const result = analyse({ category: 'documents', service: 'Income Certificate', description: 'Needed for a school scholarship.' });

  assert.strictEqual(result.matchedService, 'Income Certificate');
  assert.ok(result.requiredDocuments.includes('Aadhaar card'));
  assert.ok(result.estimatedDays > 0);
});

test('scores complicated financial cases higher than simple document requests', () => {
  const simple = analyse({ category: 'documents', service: 'Birth Certificate', description: 'Need a copy.' });
  const complex = analyse({
    category: 'financial',
    service: 'Old Age Pension',
    description: 'My application was rejected and there is a name mismatch that needs urgent correction before the deadline.',
    age: 70
  });

  assert.ok(complex.score > simple.score);
  assert.strictEqual(complex.difficulty, 'HIGH');
});

test('always returns a difficulty within the allowed set', () => {
  ['documents', 'education', 'employment', 'health', 'financial', 'government', 'other'].forEach((category) => {
    const { difficulty } = analyse({ category, service: 'Something', description: 'A requirement description.' });
    assert.ok(['LOW', 'MEDIUM', 'HIGH'].includes(difficulty));
  });
});

test('validation rejects incomplete payloads with per-field messages', () => {
  assert.throws(
    () => validate({ name: '', age: 'abc', location: '', category: 'nope', service: '', description: 'short' }),
    (error) => {
      assert.ok(error instanceof ValidationError);
      assert.deepStrictEqual(Object.keys(error.fields).sort(), ['age', 'category', 'description', 'location', 'name', 'service']);
      return true;
    }
  );
});

test('validation accepts a complete payload', () => {
  const clean = validate({
    name: 'Anita Sharma',
    age: '34',
    location: 'Jaipur',
    category: 'documents',
    service: 'Income Certificate',
    description: 'Required for my daughter scholarship application.'
  });

  assert.strictEqual(clean.category, 'documents');
  assert.strictEqual(clean.age, 34);
});

test('metrics are coerced into safe numbers', () => {
  const metrics = sanitiseMetrics({ taskTime: '42', clicks: -5, validationErrors: 'x', backActions: 2.7, helpRequests: 1e9 });

  assert.deepStrictEqual(metrics, { taskTime: 42, clicks: 0, validationErrors: 0, backActions: 3, helpRequests: 100000 });
});
