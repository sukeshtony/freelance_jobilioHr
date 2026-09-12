const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  fullName: { 
    type: String, 
    required: [true, 'Full name is required'],
    trim: true
  },
  mobile: { 
    type: String, 
    required: [true, 'Mobile number is required'],
    trim: true
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true
  },
  message: { 
    type: String, 
    required: [true, 'Message is required'],
    trim: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
});

module.exports = mongoose.model('Contact', contactSchema);