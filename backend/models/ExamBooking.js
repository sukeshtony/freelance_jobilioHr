const mongoose = require('mongoose');

const ExamBookingSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  category: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },

  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  courseName: { type: String, required: true },

  duration: { type: String, default: '45 mins' },
  status: {
    type: String,
    enum: ['Scheduled', 'Missed', 'Passed', 'Failed', 'Conducted', 'Canceled'],
    default: 'Scheduled'
  },
  score: { type: Number },
  attended: { type: Boolean, default: false },
  totalMarks: { type: Number, default: 0 }
}, {
  timestamps: true 
});

ExamBookingSchema.index({ userId: 1, date: 1, time: 1 }, { unique: true });

module.exports = mongoose.model('ExamBooking', ExamBookingSchema);