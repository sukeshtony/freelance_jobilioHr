const mongoose = require('mongoose');

const RequirementSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobTitle: {
    type: String,
    required: true
  },
    jobType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Remote', 'Contract', 'Internship', 'Freelance'],
    default: 'Full-time'
  },
  skills: {
    type: [String],
    required: true
  },
  location: {
    type: String,
    required: true
  },
  experienceMin: {
    type: Number,
    required: true
  },
  experienceMax: {
    type: Number,
    required: true
  },
  salaryBudget: {
    type: String
  },
  applicantsCount: {
    type: Number,
    default: 1,
    min: 1
  },
  notes: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'draft', 'deleted'],
    default: 'active'
  },
  deletedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
// Update the updatedAt field before saving
RequirementSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Requirement', RequirementSchema);