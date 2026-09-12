const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  // Basic lead information
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  
  // Lead source and context
  source: {
    type: String,
    enum: ['job_application', 'external_job_application', 'contact_form', 'direct', 'referral', 'other'],
    default: 'job_application'
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: false // Make optional for external jobs
  },
  jobTitle: {
    type: String,
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  
  // Lead status and management
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Application details
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobApplication'
  },
  resume: {
    filename: String,
    originalName: String,
    path: String,
    mimetype: String,
    size: Number
  },
  
  // External job details
  externalJobUrl: {
    type: String,
    trim: true
  },
  
  // Lead notes and follow-up
  notes: [{
    note: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Follow-up scheduling
  nextFollowUp: {
    type: Date
  },
  followUpNotes: {
    type: String
  },
  
  // Lead scoring and qualification
  score: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  qualification: {
    isQualified: {
      type: Boolean,
      default: false
    },
    qualificationDate: Date,
    qualificationNotes: String
  },
  
  // Conversion tracking
  convertedTo: {
    type: String,
    enum: ['customer', 'client', 'student', 'other']
  },
  conversionDate: Date,
  conversionValue: Number,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Assigned to
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Tags for categorization
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Index for better query performance
leadSchema.index({ email: 1 });
leadSchema.index({ jobId: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ assignedTo: 1 });

// Update the updatedAt field before saving
leadSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Lead', leadSchema);
