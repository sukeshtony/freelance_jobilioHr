const mongoose = require('mongoose');

const SentCandidatesSchema = new mongoose.Schema({
  requirementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Requirement',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  candidates: [{
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    matchPercentage: {
      type: Number,
      required: true
    },
    skillMatchPercentage: {
      type: Number,
      required: true
    },
    matchedSkills: [String],
    experienceMatch: {
      type: Boolean,
      default: false
    },
    experience: Number,
    location: String,
    username: String,
    email: String
  }],
  totalCandidates: {
    type: Number,
    required: true
  },
  requestedCount: {
    type: Number,
    required: true
  },
  creditIssue: {
    type: Boolean,
    default: false
  },
  message: {
    type: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  sentAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SentCandidates', SentCandidatesSchema);
