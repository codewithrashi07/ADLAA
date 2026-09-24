const mongoose = require('mongoose');

const timelineSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String, default: '' },
    at: { type: String, required: true }
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    trackingId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 1, max: 120 },
    location: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    categoryName: { type: String, required: true },
    service: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },

    difficulty: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], required: true },
    score: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },
    estimatedDays: { type: Number, default: 0 },
    matchedService: { type: String, default: null },
    requiredDocuments: { type: [String], default: [] },
    suggestedServices: { type: [mongoose.Schema.Types.Mixed], default: [] },
    scoreBreakdown: { type: [mongoose.Schema.Types.Mixed], default: [] },
    actionPlan: { type: [mongoose.Schema.Types.Mixed], default: [] },
    nextStep: { type: String, default: '' },
    resultMessage: { type: String, default: '' },

    status: { type: String, enum: ['Submitted', 'In Review', 'Action Needed', 'Approved', 'Rejected'], default: 'Submitted' },
    metrics: {
      taskTime: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      validationErrors: { type: Number, default: 0 },
      backActions: { type: Number, default: 0 },
      helpRequests: { type: Number, default: 0 }
    },
    timeline: { type: [timelineSchema], default: [] },

    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
  },
  { versionKey: false }
);

module.exports = mongoose.models.Application || mongoose.model('Application', applicationSchema);
