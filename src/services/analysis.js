const { getCategory, categoryName } = require('../data/catalog');

const URGENCY_KEYWORDS = ['urgent', 'emergency', 'immediately', 'deadline', 'asap', 'today', 'tomorrow'];
const COMPLICATION_KEYWORDS = ['rejected', 'pending', 'appeal', 'court', 'legal', 'dispute', 'correction', 'lost', 'duplicate', 'verification', 'mismatch', 'error'];
const FIRST_TIME_KEYWORDS = ['first time', 'new', 'do not know', "don't know", 'never applied', 'not sure', 'confused', 'help'];

const DIFFICULTY_ORDER = ['LOW', 'MEDIUM', 'HIGH'];

function normalise(text) {
  return String(text || '').toLowerCase();
}

function countMatches(text, keywords) {
  return keywords.filter((keyword) => text.includes(keyword)).length;
}

function similarity(a, b) {
  const left = new Set(normalise(a).split(/\W+/).filter(Boolean));
  const right = normalise(b).split(/\W+/).filter(Boolean);
  if (!right.length) return 0;
  const hits = right.filter((word) => left.has(word)).length;
  return hits / right.length;
}

function matchService(category, serviceText) {
  if (!category) return null;
  let best = null;
  let bestScore = 0;
  category.services.forEach((service) => {
    const score = similarity(serviceText, service.name);
    if (score > bestScore) {
      bestScore = score;
      best = service;
    }
  });
  return bestScore >= 0.4 ? best : null;
}

function relatedServices(category, serviceText, limit = 3) {
  if (!category) return [];
  return category.services
    .map((service) => ({ service, score: similarity(serviceText, service.name) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => ({ name: entry.service.name, estimatedDays: entry.service.days }));
}

/**
 * Scores an application and produces the guidance shown to the applicant.
 * Everything here runs server side so the dashboard, the API and the form
 * always agree on the same result.
 */
function analyse({ category, service = '', description = '', age }) {
  const categoryId = normalise(category);
  const categoryEntry = getCategory(categoryId);
  const text = `${normalise(service)} ${normalise(description)}`;

  const breakdown = [];
  let score = 0;

  const baseComplexity = categoryEntry ? categoryEntry.baseComplexity : 2;
  score += baseComplexity;
  breakdown.push({ factor: 'Category baseline', points: baseComplexity, detail: categoryName(categoryId) });

  const matchedService = matchService(categoryEntry, service);
  if (matchedService) {
    const servicePoints = matchedService.days >= 40 ? 3 : matchedService.days >= 20 ? 2 : 1;
    score += servicePoints;
    breakdown.push({ factor: 'Service processing time', points: servicePoints, detail: `${matchedService.name} (~${matchedService.days} days)` });
  } else if (service.length > 30) {
    score += 1;
    breakdown.push({ factor: 'Unrecognised service request', points: 1, detail: 'Needs manual classification' });
  }

  const complications = countMatches(text, COMPLICATION_KEYWORDS);
  if (complications) {
    const points = Math.min(complications * 2, 4);
    score += points;
    breakdown.push({ factor: 'Case complications', points, detail: `${complications} complicating signal(s) detected` });
  }

  const urgency = countMatches(text, URGENCY_KEYWORDS);
  if (urgency) {
    score += 1;
    breakdown.push({ factor: 'Urgency', points: 1, detail: 'Time-sensitive request' });
  }

  const firstTime = countMatches(text, FIRST_TIME_KEYWORDS);
  if (firstTime) {
    score += 1;
    breakdown.push({ factor: 'First-time applicant signals', points: 1, detail: 'Extra guidance recommended' });
  }

  const descriptionLength = description.trim().length;
  if (descriptionLength > 160) {
    score += 2;
    breakdown.push({ factor: 'Requirement detail', points: 2, detail: 'Long, multi-part requirement' });
  } else if (descriptionLength > 70) {
    score += 1;
    breakdown.push({ factor: 'Requirement detail', points: 1, detail: 'Moderately detailed requirement' });
  } else if (descriptionLength > 0 && descriptionLength < 20) {
    score += 1;
    breakdown.push({ factor: 'Sparse description', points: 1, detail: 'Officer may request more information' });
  }

  const numericAge = Number(age);
  if (Number.isFinite(numericAge) && (numericAge >= 60 || (numericAge > 0 && numericAge < 18))) {
    score += 1;
    breakdown.push({ factor: 'Assisted applicant', points: 1, detail: numericAge >= 60 ? 'Senior citizen' : 'Minor applicant' });
  }

  const difficulty = score <= 4 ? 'LOW' : score <= 7 ? 'MEDIUM' : 'HIGH';

  const baseDays = matchedService ? matchedService.days : categoryEntry ? categoryEntry.averageDays : 15;
  const estimatedDays = Math.max(3, Math.round(baseDays * (difficulty === 'HIGH' ? 1.4 : difficulty === 'MEDIUM' ? 1.15 : 1)));

  const documents = matchedService
    ? matchedService.documents
    : ['Aadhaar card or government photo ID', 'Address proof', 'Supporting documents for the request'];

  const confidence = Math.min(95, 55 + (matchedService ? 25 : 0) + Math.min(descriptionLength / 10, 15));

  return {
    difficulty,
    score,
    maxScore: 14,
    confidence: Math.round(confidence),
    estimatedDays,
    matchedService: matchedService ? matchedService.name : null,
    categoryName: categoryName(categoryId),
    requiredDocuments: documents,
    suggestedServices: relatedServices(categoryEntry, service),
    scoreBreakdown: breakdown,
    nextStep: nextStepFor(difficulty, matchedService),
    resultMessage: messageFor(difficulty, estimatedDays),
    actionPlan: actionPlanFor(difficulty, documents)
  };
}

function nextStepFor(difficulty, matchedService) {
  if (difficulty === 'LOW') {
    return matchedService
      ? `Collect the listed documents and apply for ${matchedService.name}.`
      : 'Collect the listed documents and proceed with the application.';
  }
  if (difficulty === 'MEDIUM') {
    return 'Verify the required documents, then submit at your nearest service centre.';
  }
  return 'Book an assisted session — additional verification is likely to be required.';
}

function messageFor(difficulty, estimatedDays) {
  if (difficulty === 'LOW') {
    return `This request is straightforward. Expect completion in roughly ${estimatedDays} days once submitted.`;
  }
  if (difficulty === 'MEDIUM') {
    return `This request needs a few supporting documents. Typical turnaround is about ${estimatedDays} days.`;
  }
  return `This request involves extra verification steps and usually takes around ${estimatedDays} days. Assisted support is recommended.`;
}

function actionPlanFor(difficulty, documents) {
  const plan = [
    { step: 1, title: 'Gather documents', detail: `Prepare ${documents.length} document(s) listed in your application overview.` },
    { step: 2, title: 'Verify details', detail: 'Check that names and dates match exactly across all documents.' },
    { step: 3, title: 'Submit application', detail: 'Apply online or at the designated service centre.' }
  ];
  if (difficulty !== 'LOW') {
    plan.push({ step: 4, title: 'Track and follow up', detail: 'Use your tracking ID to monitor progress and respond to queries.' });
  }
  if (difficulty === 'HIGH') {
    plan.push({ step: 5, title: 'Request assistance', detail: 'Book an assisted session if verification is delayed beyond the estimate.' });
  }
  return plan;
}

module.exports = { analyse, DIFFICULTY_ORDER };
