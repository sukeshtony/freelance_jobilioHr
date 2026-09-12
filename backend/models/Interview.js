// models/Interview.js
const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  interviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interviewer',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    default: '45 mins'
  },
  interviewType: {
    type: String,
    enum: ['IT', 'Non-IT'],
    required: true
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Cancelled', 'No Show', 'Conducted'],
    default: 'Scheduled'
  },
  meetingLink: {
    type: String
  },
  result: {
    passed: Boolean,
    score: Number,
    feedback: String,
    topics: [String],
    strengths: [String],
    areasToImprove: [String],
    recommendations: [String]
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

// Update timestamps on save
interviewSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Interview', interviewSchema);