const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    enrolledAt: {
        type: Date,
        default: Date.now
    },
  progress: [{
        lessonId: String,     // ID from embedded lesson (_id from Course.lessons[])
        watched: Boolean      // true if watched
    }]

});

module.exports = mongoose.model('Enrollment', EnrollmentSchema);
