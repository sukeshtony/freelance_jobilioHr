// models/Instructor.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const instructorSchema = new mongoose.Schema({
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
    match: [/\S+@\S+\.\S+/, 'Please enter a valid email']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  about: {
    type: String,
    trim: true
  },
  field: {
    type: String,
    required: [true, 'Field is required'],
    enum: ['IT', 'Non-IT'],
    default: 'IT'
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  courses: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    }],
    default: []
  },
  availability: {
    type: [String],
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    default: ['Monday', 'Wednesday', 'Friday']
  },
  defaultSlots: { 
    type: [String],
    default: ["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM"]
  },
  examDuration: {
    type: String,
    default: '60 minutes'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
instructorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

module.exports = mongoose.model('Instructor', instructorSchema);