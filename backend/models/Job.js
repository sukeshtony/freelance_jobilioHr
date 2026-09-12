const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  // New extended fields (compatible with legacy fields below)
  position: { type: String },
  band: { type: String },
  qualification: { type: String },
  essentialHiringSkills: { type: [String], default: [] },
  responsibility: { type: String },
  shift: { type: String },
  role: { type: String },
  industryType: { type: String },
  employmentType: { type: String },
  roleCategory: { type: String },
  education: { type: String },
  keySkills: { type: [String], default: [] },
  aboutCompany: { type: String },
  jobTitle: {
    type: String,
    required: true
  },
  jobType: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  department: String,
  salary: String,
  experienceLevel: {
    type: String,
    default: 'Any'
  },
  description: {
    type: String,
    required: true
  },
  requirements: {
    type: String,
    required: true
  },
  companyName: {
    type: String,
    required: true
  },

  applicationDeadline: Date,
  vacancies: {
    type: Number,
    default: 1
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  // External application support
  isExternalLink: {
    type: Boolean,
    default: false
  },
  externalLink: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'closed'],
    default: 'active'
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applications: {
    type: Number,
    default: 0
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
jobSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Update the updatedAt field before updating
jobSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

module.exports = mongoose.model('Job', jobSchema);