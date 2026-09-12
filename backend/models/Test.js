const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    unique: true
  },
  questions: [
    {
      questionText: String,
      options: [String],
      correctAnswer: Number // index of correct option
    }
  ]
});

module.exports = mongoose.model('Test', testSchema);