const mongoose = require('mongoose');

const CreditRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  creditsRequested: {
    type: Number,
    required: true,
    default: 10
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    default: ''
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  }
}, { timestamps: true });

const UserCreditSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  credits: {
    type: Number,
    default: 5
  },
  viewedResumes: [{
    type: String // Array of candidate IDs that have been viewed
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const CreditRequest = mongoose.model('CreditRequest', CreditRequestSchema);
const UserCredit = mongoose.model('UserCredit', UserCreditSchema);

module.exports = { CreditRequest, UserCredit };
