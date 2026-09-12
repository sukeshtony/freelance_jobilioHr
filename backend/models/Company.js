// models/Company.js
const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  hrName: {
    type: String,
    required: [true, 'HR name is required'],
    trim: true,
    maxlength: [50, 'HR name cannot exceed 50 characters']
  },
  mobileNumber: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true,
    // Accept either a 10-digit local number OR a number with leading country code '91' (12 digits).
    // Examples allowed: 9876543210 or 919876543210 (or pasted +919876543210 will be cleaned to 919876543210)
    validate: {
      validator: function (v) {
        const s = String(v || '');
        return /^(?:\d{10}|91\d{10})$/.test(s);
      },
      message: props => `${props.value} is not a valid mobile number! Accepts 10-digit local or leading '91' + 10 digits.`
    },
    unique: true
  },
  pan: {
    type: String,
    required: [true, 'PAN number is required'],
    trim: true,
    uppercase: true,
    validate: {
      validator: function(v) {
        return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
      },
      message: props => `${props.value} is not a valid PAN number! Format: ABCDE1234F`
    }
  },
  gst: {
    type: String,
    trim: true,
    uppercase: true,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v);
      },
      message: props => `${props.value} is not a valid GST number!`
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    virtuals: true
  }
});

// Indexes
companySchema.index({ userId: 1 }, { unique: true });
companySchema.index({ pan: 1 }, { unique: true });
companySchema.index({ mobileNumber: 1 }, { unique: true });

companySchema.pre('save', function(next) {
  // Clean mobile number by removing non-digits and country code
  if (this.mobileNumber) {
    // Keep country code if present — only strip non-digit characters.
    // e.g. "+919876543210" -> "919876543210", "919876543210" stays same, "9876543210" stays same
    this.mobileNumber = this.mobileNumber.replace(/\D/g, '');
  }
  
  if (this.pan) {
    this.pan = this.pan.toUpperCase();
  }
  
  if (this.gst) {
    this.gst = this.gst.toUpperCase();
  }
  
  next();
});

companySchema.statics.findByUserId = function(userId) {
  return this.findOne({ userId });
};

module.exports = mongoose.model('Company', companySchema);