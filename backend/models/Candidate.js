const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
  name: String,
  job: String,
  status: String, // 'shortlisted', 'interview', 'rejected', 'hired'
  email: String,
  phone: String,
  type: String, // 'applied' or 'searched'
  skills: [String],
  experience: String,
  location: String,
  lastCompany: String,
  education: String,
  salary: String,
  noticePeriod: String,
  resumeUrl: String,
});

module.exports = mongoose.model('Candidate', CandidateSchema);
