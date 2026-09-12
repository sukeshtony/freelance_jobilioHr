// models/Interviewer.js
const mongoose = require('mongoose');

const interviewerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['interviewer'],
    default: 'interviewer'
  },
  password: {
    type: String,
    required: true,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  title: {
    type: String,
    required: true
  },
  skills: {
    type: [String],
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['IT', 'Non-IT']
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 4.5
  },
  interviewCount: {
    type: Number,
    default: 0
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Interviewer', interviewerSchema);