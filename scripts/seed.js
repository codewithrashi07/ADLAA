require('dotenv').config();

const { initStore, getStore } = require('../src/store');
const { createApplication } = require('../src/services/applications');
const { updateStatus } = require('../src/services/applications');

const SAMPLES = [
  { name: 'Anita Sharma', age: 34, location: 'Jaipur', category: 'documents', service: 'Income Certificate', description: 'I need an income certificate for my daughter school scholarship application this month.', status: 'Approved' },
  { name: 'Ravi Kumar', age: 67, location: 'Patna', category: 'financial', service: 'Old Age Pension', description: 'My old age pension application was rejected last year and I do not know what document was missing.', status: 'Action Needed' },
  { name: 'Meera Joshi', age: 21, location: 'Pune', category: 'education', service: 'Post-Matric Scholarship', description: 'Applying for post matric scholarship for my second year college fees.', status: 'In Review' },
  { name: 'Salim Ansari', age: 29, location: 'Lucknow', category: 'employment', service: 'Labour Card', description: 'I work as a construction worker and want a labour card for welfare benefits.', status: 'Submitted' },
  { name: 'Priya Nair', age: 41, location: 'Kochi', category: 'health', service: 'Ayushman Bharat Card', description: 'Need a health card for my family of four.', status: 'Approved' },
  { name: 'Deepak Verma', age: 52, location: 'Indore', category: 'government', service: 'Trade Licence', description: 'Opening a small grocery shop and urgently need a trade licence, my earlier application had a name mismatch error.', status: 'In Review' },
  { name: 'Fatima Begum', age: 38, location: 'Hyderabad', category: 'documents', service: 'Domicile Certificate', description: 'Require a domicile certificate for a state government job application.', status: 'Submitted' },
  { name: 'Arjun Singh', age: 16, location: 'Jaipur', category: 'education', service: 'Pre-Matric Scholarship', description: 'First time applying, not sure which documents are needed for the pre matric scholarship.', status: 'Submitted' }
];

async function main() {
  await initStore({ mongoUri: process.env.MONGODB_URI });
  await getStore().clear();

  for (const sample of SAMPLES) {
    const { status, ...payload } = sample;
    const created = await createApplication({
      ...payload,
      metrics: {
        taskTime: 45 + Math.round(Math.random() * 180),
        clicks: 8 + Math.round(Math.random() * 30),
        validationErrors: Math.round(Math.random() * 3),
        backActions: Math.round(Math.random() * 2),
        helpRequests: Math.round(Math.random() * 2)
      }
    });
    if (status !== 'Submitted') await updateStatus(created.id, status, 'Seeded demo record.');
  }

  console.log(`Seeded ${SAMPLES.length} demo applications into ${getStore().label}.`);
  process.exit(0);
}

main().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
