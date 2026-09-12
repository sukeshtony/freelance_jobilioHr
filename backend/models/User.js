const mongoose = require("mongoose");

// Company Subdocument Schema
const companySchema = new mongoose.Schema({
  name: String,
  position: String,
  location: String,
  startDate: String,
  endDate: String,
  responsibilities: String,
  achievements: String,
  experience: { type: Number, min: 0 }
}, { _id: false });  // _id false if you don't want subdocument _id

// Education Subdocument Schema
const educationSchema = new mongoose.Schema({
  degree: String,
  institute: String,
  customInstitute: String,
  startDate: String,
  endDate: String,
  currentlyStudying: Boolean
}, { _id: false });

// Profile Schema (with embedded subdocuments)
const profileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: String,
  email: String,
  name: String,
  phone: String,
  dob: String,
  experience: { type: Number, min: 0 },
  gender: String,
  address: String,
  city: String,
  state: String,
  country: String,
  zip: String,
  linkedin: String,
  objective: String,
  jobType: String,
  workMode: String,
  expectedSalary: String,
  noticePeriod: String,
  avatarUrl: String,
  resumeUrl: String,
  isDraft: { type: Boolean, default: true },
  skills: [String],
  languages: [String],
  img: {
    data: Buffer,
    contentType: String
  },
  certifications: [String],
  companies: [companySchema],      // embedded array
  education: [educationSchema]     // embedded array
}, { timestamps: true });

const Profile = mongoose.model("Profile", profileSchema);

// User Schema (top-level)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false, minlength: 6 }, // Made optional for Google OAuth
  role: { type: String, enum: ["Candidate", "Client"], required: true },
  mobile: { type: String },
  profile: { type: mongoose.Schema.Types.ObjectId, ref: "Profile" },
  googleId: { type: String, sparse: true }, // Google OAuth ID
  isGoogleUser: { type: Boolean, default: false },// Flag for Google OAuth users
  resetPasswordCode: { type: String },
  isPremium: { type: Boolean, default: false },
  resetPasswordExpires: { type: Date },
  isVerified: {
    type: Boolean,
    default: false
  },
  assignedFeedbacker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Feedbacker',
    default: null
  }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

// Export only User and Profile now (Company and Education no longer separate)
module.exports = {
  User,
  Profile
};