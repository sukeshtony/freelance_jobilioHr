// models/Feedbacker.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const feedbackerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  completedFeedbacks: {
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

// Hash password before saving
feedbackerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Update timestamp on update
feedbackerSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// ✅ Virtual field to count assigned students
feedbackerSchema.virtual('assignedCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'assignedFeedbacker',
  count: true
});

// ✅ Enable virtuals in toJSON and toObject
feedbackerSchema.set('toObject', { virtuals: true });
feedbackerSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Feedbacker', feedbackerSchema);
